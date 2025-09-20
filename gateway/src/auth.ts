import { createRemoteJWKSet, jwtVerify } from 'jose';
import { GatewayConfig, JwtIdentity } from './types.js';

export interface AuthVerifier {
  verify(token: string): Promise<JwtIdentity>;
}

export function createAuthVerifier(config: GatewayConfig): AuthVerifier {
  const jwks = createRemoteJWKSet(new URL(config.jwksUrl));

  return {
    async verify(token: string): Promise<JwtIdentity> {
      if (!token) {
        throw new Error('missing token');
      }

      const { payload } = await jwtVerify(token, jwks, {
        issuer: config.oidcIssuer,
        audience: config.oidcAudience,
      });

      const groups = Array.isArray(payload.groups)
        ? (payload.groups as string[])
        : typeof payload.groups === 'string'
        ? [payload.groups]
        : [];

      return {
        sub: String(payload.sub ?? 'anonymous'),
        groups,
        env: String(payload.env ?? 'dev'),
        dlp_profile: payload.dlp_profile as string | undefined,
        ...payload,
      };
    },
  };
}
