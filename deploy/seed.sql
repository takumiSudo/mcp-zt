INSERT INTO policy_profiles (name, dlp_profile, egress_allowlist, rate_limit)
VALUES ('default', 'standard', '["*.corp.internal"]'::jsonb, 60)
ON CONFLICT (name) DO UPDATE SET dlp_profile = EXCLUDED.dlp_profile;

INSERT INTO tools (tool_id, name, owner, endpoint, version, scopes, data_class, status, signature_status, sbom_url, schema_ref, egress_allow, policy_profile)
VALUES
  ('payroll-recon', 'Payroll Reconciliation', 'Finance Ops', 'http://hello-server:4000/mcp/payroll-recon', '1.2.3', '["read:ledger"]'::jsonb, 'confidential', 'approved', 'verified', 'https://example.com/sbom/payroll-recon', 'payroll-recon', '["ledger.api.corp","hello-server"]'::jsonb, 'default'),
  ('sandbox-echo', 'Sandbox Echo', 'Finance Ops', 'http://hello-server:4000/mcp/sandbox-echo', '0.1.0', '["read:ledger"]'::jsonb, 'internal', 'sandbox', NULL, NULL, 'payroll-recon', '["hello-server"]'::jsonb, 'default')
ON CONFLICT (tool_id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO grants ("group", tool_id, scopes, env, expires_at)
VALUES ('finance', 'payroll-recon', '["read:ledger"]'::jsonb, 'dev|stage|prod', NULL)
ON CONFLICT (group, tool_id, env) DO UPDATE SET scopes = EXCLUDED.scopes;
