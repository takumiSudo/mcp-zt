import { GatewayConfig } from './types.js';

export function loadConfig(): GatewayConfig {
  const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required env var ${key}`);
    }
    return value;
  };

  const egress = (process.env.EGRESS_ALLOWLIST || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  return {
    oidcIssuer: requireEnv('OIDC_ISSUER'),
    oidcAudience: requireEnv('OIDC_AUDIENCE'),
    jwksUrl: requireEnv('JWKS_URL'),
    redisUrl: requireEnv('REDIS_URL'),
    controlApiUrl: requireEnv('CONTROL_API_URL'),
    minioEndpoint: requireEnv('MINIO_ENDPOINT'),
    minioAccessKey: requireEnv('MINIO_ACCESS_KEY'),
    minioSecretKey: requireEnv('MINIO_SECRET_KEY'),
    minioBucket: requireEnv('MINIO_BUCKET'),
    egressAllowlist: egress,
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  };
}
