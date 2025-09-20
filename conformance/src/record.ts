import axios from 'axios';
import fs from 'fs';
import YAML from 'yaml';
import { GoldenSession } from './types.js';

export interface RecordOptions {
  tool: string;
  gateway: string;
  inputs: Record<string, unknown>;
  outputPath: string;
  token?: string;
}

export async function recordSession(options: RecordOptions): Promise<void> {
  const { tool, gateway, inputs, outputPath, token } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const started = Date.now();
  const response = await axios.post(`${gateway.replace(/\/$/, '')}/mcp/${tool}/call`, inputs, { headers });
  const latency = Date.now() - started;

  const session: GoldenSession = {
    tool,
    inputs,
    expect: {
      keys_present: Object.keys(response.data ?? {}),
      schema_ok: true,
      latency_ms_max: latency + 200,
    },
  };

  const yaml = YAML.stringify(session);
  fs.writeFileSync(outputPath, yaml, 'utf-8');
}
