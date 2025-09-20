import axios from 'axios';

const CONTROL_API = import.meta.env.VITE_CONTROL_API_URL || 'http://localhost:8000';
const GATEWAY_API = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';

export interface Tool {
  tool_id: string;
  name: string;
  owner: string;
  endpoint: string;
  version: string;
  scopes: string[];
  data_class: string;
  status: string;
  signature_status?: string;
  sbom_url?: string;
  schema_ref: string;
  egress_allow: string[];
  policy_profile?: string | null;
  created_at: string;
}

export interface Grant {
  id: number;
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

export interface AuditRecord {
  ts: string;
  session: string;
  user: string;
  tool: { id: string; ver?: string };
  policy: { allowed: boolean; scopes: string[] };
  dlp: { action: string; rules: string[]; count: number };
  schema: { input: string; output: string };
  latency_ms: number;
}

export interface GatewayEvent {
  ts: string;
  code: string;
  message: string;
}

export async function fetchTools(): Promise<Tool[]> {
  const res = await axios.get(`${CONTROL_API}/tools`);
  return res.data.items;
}

export async function fetchTool(toolId: string): Promise<{ tool: Tool; grants: Grant[]; policy_profile?: PolicyProfile | null }>
{
  const res = await axios.get(`${CONTROL_API}/tools/${toolId}`);
  return res.data;
}

export async function fetchAuditRecords(): Promise<AuditRecord[]> {
  const res = await axios.get(`${CONTROL_API}/audit/records`);
  return res.data.items;
}

export async function fetchGatewayEvents(toolId: string): Promise<GatewayEvent[]> {
  const res = await axios.get(`${GATEWAY_API}/admin/events`, { params: { toolId } });
  return res.data.items;
}
