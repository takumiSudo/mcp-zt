import Fastify from 'fastify';
import Redis from 'ioredis';
import { randomUUID, createHash } from 'crypto';
import { createAuthVerifier } from './auth.js';
import { loadConfig } from './config.js';
import { evaluatePolicy } from './policy.js';
import { applyDlp } from './dlp.js';
import { getSchemaValidators, formatErrors } from './schema.js';
import { extractHost, isEgressAllowed, unionAllowlists } from './egress.js';
import { RateLimiter } from './ratelimit.js';
import { initTracing, getTracer } from './trace.js';
import { AuditWriter } from './audit.js';
import { GatewayConfig, Grant, JwtIdentity, AuditRecord } from './types.js';

interface ToolResponse {
  tool: ToolCatalogEntry;
  grants: Grant[];
  policy_profile?: { rate_limit?: number; egress_allowlist?: string[]; dlp_profile?: string };
}

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

const gatewayEvents: { toolId: string; ts: string; code: string; message: string }[] = [];

function recordEvent(toolId: string, code: string, message: string) {
  gatewayEvents.unshift({ toolId, ts: new Date().toISOString(), code, message });
  if (gatewayEvents.length > 100) {
    gatewayEvents.length = 100;
  }
}

function errorResponse(reply: any, statusCode: number, code: string, message: string, details?: unknown, toolId?: string) {
  if (toolId) {
    recordEvent(toolId, code, message);
  }
  const body: ErrorBody = { code, message, details };
  reply.status(statusCode).send(body);
}

async function fetchTool(config: GatewayConfig, toolId: string): Promise<ToolResponse | null> {
  const res = await fetch(`${config.controlApiUrl}/tools/${toolId}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`control api error ${res.status}`);
  }
  return (await res.json()) as ToolResponse;
}

let cachedGlobalEgress: string[] | null = null;
let cachedAt = 0;
async function fetchGlobalEgress(config: GatewayConfig): Promise<string[]> {
  const ttlMs = 60_000;
  if (cachedGlobalEgress && Date.now() - cachedAt < ttlMs) {
    return cachedGlobalEgress;
  }
  const res = await fetch(`${config.controlApiUrl}/policy/egress`);
  if (!res.ok) return [];
  const data = (await res.json()) as { hosts: string[] };
  cachedGlobalEgress = data.hosts || [];
  cachedAt = Date.now();
  return cachedGlobalEgress;
}

async function main() {
  const config = loadConfig();
  const fastify = Fastify({ logger: true });
  initTracing(config);
  const tracer = getTracer();
  const auth = createAuthVerifier(config);
  const redis = new Redis(config.redisUrl);
  const rateLimiter = new RateLimiter(redis);
  const auditWriter = new AuditWriter(config);

  fastify.post('/mcp/:toolId/call', async (request, reply) => {
    const start = Date.now();
    const span = tracer.startSpan('gateway.call');
    try {
      const { toolId } = request.params as { toolId: string };
      const authHeader = (request.headers['authorization'] || '') as string;
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        errorResponse(reply, 401, 'unauthorized', 'missing bearer token', undefined, toolId);
        span.setAttribute('policy.allowed', false);
        span.end();
        return reply;
      }

      let identity: JwtIdentity;
      try {
        identity = await auth.verify(token);
      } catch (err) {
        errorResponse(reply, 401, 'unauthorized', 'token verification failed', undefined, toolId);
        span.setAttribute('policy.allowed', false);
        span.end();
        return reply;
      }

      const toolData = await fetchTool(config, toolId);
      if (!toolData) {
        errorResponse(reply, 404, 'not_found', 'tool not found', undefined, toolId);
        span.setAttribute('policy.allowed', false);
        span.end();
        return reply;
      }

      const decision = evaluatePolicy(identity, toolData.tool, toolData.grants);
      span.setAttribute('tool.id', toolId);
      span.setAttribute('user.id', identity.sub);
      span.setAttribute('policy.allowed', decision.allowed);

      if (!decision.allowed) {
        errorResponse(reply, 403, decision.code ?? 'forbidden', decision.reason ?? 'access denied', {
          scopes: decision.scopes,
        }, toolId);
        span.end();
        return reply;
      }

      const rateKeys = [
        `user:${identity.sub}`,
        ...identity.groups.map((g) => `group:${g}`),
      ];
      const rateResult = await rateLimiter.check(rateKeys);
      if (!rateResult.allowed) {
        reply.header('Retry-After', rateResult.retryAfter ?? 60);
        errorResponse(reply, 429, 'rate_limited', 'rate limit exceeded', undefined, toolId);
        span.end();
        return reply;
      }

      const validators = await getSchemaValidators(config, toolData.tool.schema_ref);
      const inputValidation = validators.validateInput(request.body);
      if (!inputValidation.valid) {
        errorResponse(reply, 400, 'schema_input', 'input schema validation failed', {
          errors: formatErrors(inputValidation.errors),
        }, toolId);
        span.end();
        return reply;
      }

      const dlpResult = applyDlp(request.body, toolData.tool.data_class);
      span.setAttribute('dlp.action', dlpResult.action);
      span.setAttribute('dlp.rules', dlpResult.rules.join(','));

      if (dlpResult.action === 'block') {
        errorResponse(reply, 400, 'dlp_block', 'payload blocked by DLP', {
          rules: dlpResult.rules,
        }, toolId);
        span.end();
        return reply;
      }

      const outboundPayload = dlpResult.action === 'redact' && dlpResult.redactedPayload
        ? dlpResult.redactedPayload
        : request.body;

      const globalEgress = await fetchGlobalEgress(config);
      const allowlist = unionAllowlists(
        config.egressAllowlist,
        globalEgress,
        toolData.tool.egress_allow,
        toolData.policy_profile?.egress_allowlist
      );

      const endpointHost = extractHost(toolData.tool.endpoint);
      if (!endpointHost || !isEgressAllowed(endpointHost, allowlist)) {
        errorResponse(reply, 403, 'egress_block', 'tool endpoint not allowed', {
          host: endpointHost,
        }, toolId);
        span.end();
        return reply;
      }

      if (typeof (request.body as any)?.host === 'string') {
        const userHost = extractHost((request.body as any).host);
        if (!userHost || !isEgressAllowed(userHost, allowlist)) {
          errorResponse(reply, 403, 'egress_block', 'requested host not permitted', {
            host: userHost,
          }, toolId);
          span.end();
          return reply;
        }
      }

      let upstreamResponse: any;
      try {
        upstreamResponse = await fetch(toolData.tool.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(outboundPayload),
        });
      } catch (err) {
        errorResponse(reply, 502, 'upstream_error', 'failed to reach tool', undefined, toolId);
        span.recordException(err as Error);
        span.end();
        return reply;
      }

      if (!upstreamResponse.ok) {
        errorResponse(reply, 502, 'upstream_error', `tool responded with ${upstreamResponse.status}`, undefined, toolId);
        span.end();
        return reply;
      }

      const responseJson = await upstreamResponse.json();

      const outputValidation = validators.validateOutput(responseJson);
      if (!outputValidation.valid) {
        errorResponse(reply, 400, 'schema_output', 'output schema validation failed', {
          errors: formatErrors(outputValidation.errors),
        }, toolId);
        span.end();
        return reply;
      }

      const outputDlp = applyDlp(responseJson, toolData.tool.data_class);
      if (outputDlp.action === 'block') {
        errorResponse(reply, 502, 'dlp_block', 'tool response blocked by DLP', {
          rules: outputDlp.rules,
        }, toolId);
        span.end();
        return reply;
      }

      const safeResponse = outputDlp.action === 'redact' && outputDlp.redactedPayload
        ? outputDlp.redactedPayload
        : responseJson;

      const combinedRules = new Set<string>([...dlpResult.rules, ...outputDlp.rules]);
      const combinedAction = outputDlp.action === 'block'
        ? outputDlp.action
        : outputDlp.action === 'redact'
        ? 'redact'
        : dlpResult.action;
      const combinedCount = dlpResult.count + (outputDlp.action !== 'allow' ? outputDlp.count : 0);

      const session = `s_${randomUUID()}`;
      const inputHash = createHash('sha256').update(JSON.stringify(outboundPayload)).digest('hex');
      const outputHash = createHash('sha256').update(JSON.stringify(safeResponse)).digest('hex');
      const latency = Date.now() - start;

      const audit: AuditRecord = {
        ts: new Date().toISOString(),
        session,
        user: identity.sub,
        host: request.headers['user-agent'] as string | undefined,
        tool: { id: toolId, ver: toolData.tool.version },
        policy: { allowed: true, scopes: decision.scopes ?? [] },
        dlp: { action: combinedAction, rules: Array.from(combinedRules), count: combinedCount },
        schema: { input: 'ok', output: 'ok' },
        egress: allowlist,
        io_hash: { in: inputHash, out: outputHash },
        latency_ms: latency,
      };

      span.setAttribute('latency_ms', latency);
      span.setAttribute('egress.hosts', allowlist.join(','));

      await auditWriter.write(audit);

      reply.status(200).send(safeResponse);
      span.end();
      return reply;
    } catch (err) {
      request.log.error(err);
      span.recordException(err as Error);
      errorResponse(reply, 500, 'internal_error', 'unexpected error');
      span.end();
      return reply;
    }
  });

  fastify.get('/admin/events', async (request, reply) => {
    const toolId = (request.query as { toolId?: string }).toolId;
    const items = toolId
      ? gatewayEvents.filter((event) => event.toolId === toolId).slice(0, 10)
      : gatewayEvents.slice(0, 10);
    reply.send({ items });
  });

  const port = Number(process.env.PORT || 8080);
  fastify.listen({ host: '0.0.0.0', port }).catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
}

main();
