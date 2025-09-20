# Quickstart

This repository contains a complete zero-trust control plane for Model Context Protocol (MCP) tools. Everything runs locally via Docker Compose and the included Make targets.

## Prerequisites

* Docker + Docker Compose Plugin
* Node.js 18+ (for optional local development)
* Python 3.11+

## First run

```bash
make up
```

This command builds the containers and starts Postgres, Redis, MinIO, the control API, the gateway, the admin UI, the conformance CLI base image, and the OpenTelemetry collector. Once the stack is healthy you can seed the catalog with demo data:

```bash
make seed
```

## Mint a mock token

The control API exposes a helper endpoint for local development that issues a signed JWT using the same issuer/audience configured for the gateway.

```bash
curl -s http://localhost:8000/tokens/mock | jq -r '.token' > /tmp/mcp-token.txt
```

The payload includes:

* `sub`: synthetic user ID
* `groups`: `["finance"]`
* `env`: `dev`
* `dlp_profile`: `standard`

Export the token and test the payroll reconciliation tool:

```bash
export MCP_TOKEN=$(cat /tmp/mcp-token.txt)
curl -H "Authorization: Bearer $MCP_TOKEN" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:8080/mcp/payroll-recon/call \
     -d '{"period":"2025-08","accountIds":["A-1001"]}' | jq
```

## Admin UI

The Vite dev server runs behind the Docker Compose network and is exposed at <http://localhost:5173>. The UI communicates with the control API gateway for catalog management and audit browsing.

## Conformance CLI

The CLI is packaged as a Node.js application. From the repository root:

```bash
cd conformance
npm install
npm run build
node dist/index.js replay ../examples/golden/payroll-recon.yaml --gateway http://localhost:8080
```

## Cleanup

Stop the stack with:

```bash
docker compose -f deploy/docker-compose.yml down -v
```
