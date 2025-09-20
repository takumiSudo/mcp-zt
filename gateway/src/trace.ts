import { diag, DiagConsoleLogger, DiagLogLevel, trace, Tracer } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import os from 'os';
import { GatewayConfig } from './types.js';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

let initialized = false;

export function initTracing(config: GatewayConfig): Tracer {
  if (initialized) {
    return trace.getTracer('gateway');
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'mcp-gateway',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.DEPLOYMENT_ENV || 'local',
    [SemanticResourceAttributes.HOST_ID]: os.hostname(),
  });

  const provider = new NodeTracerProvider({ resource });

  const exporter = new OTLPTraceExporter({
    url: config.otlpEndpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318/v1/traces',
  });

  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();

  initialized = true;
  return trace.getTracer('gateway');
}

export function getTracer(): Tracer {
  return trace.getTracer('gateway');
}
