# Policy Guide

This document summarizes the default policy posture enforced by the gateway and outlines how to extend it for production deployments.

## Access policy

* Tools are `deny` by default. Only catalog entries with `status=approved` are callable.
* Grants map identity groups to tool scopes and environments. A user must satisfy all conditions to call a tool.
* Finance group defaults:
  * `dev` & `stage`: `read:*`
  * `prod`: `write:*` requires interactive confirmation (stubbed hook).

## Data loss prevention (DLP)

The gateway includes a light-weight DLP engine:

* Social security numbers and e-mail addresses are redacted in audit payloads.
* Phone numbers are redacted.
* Credit card numbers (detected with a Luhn checksum) are blocked when the tool's `data_class` is `confidential` or `regulated`.

## Egress policy

All outbound requests from the gateway are validated against the intersection of:

1. Global allow-list (`/policy/egress` from the control API).
2. Tool-level allow-list declared in the catalog entry.
3. The operator-provided `EGRESS_ALLOWLIST` environment variable on the gateway service.

## Audit signing

Each request produces a JSON audit record stored in MinIO. A rolling `manifest.json` includes SHA-256 hashes for each record. In production you would sign the manifest using [Sigstore Cosign](https://docs.sigstore.dev/cosign/overview/).

### Cosign placeholder workflow

1. Export the manifest: `aws s3 cp s3://mcp-audit/manifest.json ./manifest.json`.
2. Sign the manifest (keyless): `cosign sign-blob --yes --identity-token \$OIDC_TOKEN manifest.json`.
3. Upload signature: `aws s3 cp manifest.json.sig s3://mcp-audit/`.

The MVP does not perform this step automatically but documents the intended process.
