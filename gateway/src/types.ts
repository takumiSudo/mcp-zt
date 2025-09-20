export interface JwtIdentity {
  sub: string;
  groups: string[];
  env: string;
  dlp_profile?: string;
  [key: string]: unknown;
}

export interface ToolCatalogEntry {
  tool_id: string;
  name: string;
  owner: string;
  endpoint: string;
  version: string;
  scopes: string[];
  data_class: 'public' | 'internal' | 'confidential' | 'regulated';
  status: 'sandbox' | 'approved';
  signature_status?: string;
  sbom_url?: string;
  schema_ref: string;
  egress_allow: string[];
}

export interface Grant {
  group: string;
  tool_id: string;
  scopes: string[];
  env: string;
  expires_at?: string | null;
}

export interface PolicyProfile {
  name: string;
  dlp_profile: string;
  egress_allowlist: string[];
  rate_limit: number;
}

export interface SchemaBundle {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface GatewayConfig {
  oidcIssuer: string;
  oidcAudience: string;
  jwksUrl: string;
  redisUrl: string;
  controlApiUrl: string;
  minioEndpoint: string;
  minioAccessKey: string;
  minioSecretKey: string;
  minioBucket: string;
  egressAllowlist: string[];
  otlpEndpoint?: string;
}

export interface PolicyDecision {
  allowed: boolean;
  code?: string;
  reason?: string;
  scopes?: string[];
}

export interface DlpResult {
  action: 'allow' | 'redact' | 'block';
  rules: string[];
  count: number;
  redactedPayload?: unknown;
}

export interface AuditRecord {
  ts: string;
  session: string;
  user: string;
  host?: string;
  tool: { id: string; ver?: string };
  policy: { allowed: boolean; scopes: string[] };
  dlp: { action: string; rules: string[]; count: number };
  schema: { input: string; output: string };
  egress: string[];
  io_hash: { in: string; out: string };
  latency_ms: number;
}
