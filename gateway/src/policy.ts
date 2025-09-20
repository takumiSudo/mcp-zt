import { Grant, JwtIdentity, PolicyDecision, ToolCatalogEntry } from './types.js';

function grantMatchesEnv(grantEnv: string, userEnv: string): boolean {
  if (!grantEnv) return false;
  if (grantEnv === '*') return true;
  return grantEnv.split('|').map((v) => v.trim()).includes(userEnv);
}

export function evaluatePolicy(
  identity: JwtIdentity,
  tool: ToolCatalogEntry,
  grants: Grant[]
): PolicyDecision {
  if (tool.status !== 'approved') {
    return { allowed: false, code: 'not_approved', reason: 'tool not approved' };
  }

  const now = Date.now();
  const matchingGrants = grants.filter((grant) => {
    if (grant.tool_id !== tool.tool_id) return false;
    if (!identity.groups.includes(grant.group)) return false;
    if (!grantMatchesEnv(grant.env, identity.env)) return false;
    if (grant.expires_at && new Date(grant.expires_at).getTime() < now) return false;
    return true;
  });

  if (!matchingGrants.length) {
    return { allowed: false, code: 'forbidden', reason: 'no matching grant' };
  }

  const scopeUnion = new Set<string>();
  for (const grant of matchingGrants) {
    grant.scopes.forEach((s) => scopeUnion.add(s));
  }

  const requiredScopes = tool.scopes.length ? tool.scopes : [];
  const grantedScopes = Array.from(scopeUnion);
  const hasRequiredScopes = requiredScopes.every((scope) => scopeUnion.has(scope));

  if (!hasRequiredScopes) {
    return { allowed: false, code: 'forbidden', reason: 'missing scope', scopes: grantedScopes };
  }

  return { allowed: true, scopes: grantedScopes };
}
