export interface GoldenSession {
  tool: string;
  inputs: Record<string, unknown>;
  expect: {
    keys_present?: string[];
    schema_ok?: boolean;
    latency_ms_max?: number;
  };
}

export interface ReplayResult {
  success: boolean;
  latency: number;
  missingKeys: string[];
  schemaOk: boolean;
}
