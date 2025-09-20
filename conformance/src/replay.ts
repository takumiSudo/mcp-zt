import axios from 'axios';
import fs from 'fs';
import YAML from 'yaml';
import { GoldenSession, ReplayResult } from './types.js';

export interface ReplayOptions {
  file: string;
  gateway: string;
  token?: string;
}

export async function replaySession(options: ReplayOptions): Promise<ReplayResult> {
  const { file, gateway, token } = options;
  const raw = fs.readFileSync(file, 'utf-8');
  const session = YAML.parse(raw) as GoldenSession;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const started = Date.now();
  try {
    const response = await axios.post(`${gateway.replace(/\/$/, '')}/mcp/${session.tool}/call`, session.inputs, {
      headers,
      validateStatus: () => true,
    });
    const latency = Date.now() - started;

    const missingKeys = (session.expect.keys_present || []).filter((key) => !(key in (response.data || {})));
    const schemaOk = response.status === 200;
    const latencyOk = session.expect.latency_ms_max ? latency <= session.expect.latency_ms_max : true;

    const success = schemaOk === (session.expect.schema_ok ?? true) && missingKeys.length === 0 && latencyOk;

    return {
      success,
      latency,
      missingKeys,
      schemaOk,
    };
  } catch (err) {
    return {
      success: false,
      latency: 0,
      missingKeys: session.expect.keys_present || [],
      schemaOk: false,
    };
  }
}
