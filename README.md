# mcp-zt

Zero-Trust control plane for the Model Context Protocol (MCP). This repository contains a minimal but complete reference implementation of a policy-aware gateway, control plane, admin UI, observability pipeline, and conformance tooling. Everything runs locally through Docker Compose for rapid experimentation.

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for setup instructions and the ten minute demo script.

## Components

* `gateway/` – Fastify + TypeScript policy enforcement layer with OIDC verification, schema enforcement, DLP, egress policy, rate limits, tracing, and signed audit logs.
* `control-api/` – FastAPI control plane with Postgres catalog, grants, policy profiles, schema hosting, and mock token minting/JWKS.
* `admin-ui/` – React + Tailwind + shadcn-inspired UI with catalog views, tool drill-down, and audit explorer.
* `conformance/` – Node.js CLI for recording/replaying golden sessions against the gateway.
* `deploy/` – Docker Compose stack and service Dockerfiles.
* `docs/` – Contracts, policies, APIs, and demo scripts.
* `examples/` – JSON Schemas, golden sessions, and a sample MCP server used for local testing.
