#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

printf '\n=== Bootstrapping stack ===\n'
make -C "$ROOT_DIR" up
sleep 3
make -C "$ROOT_DIR" seed

printf '\n=== Minting token ===\n'
TOKEN=$(curl -s http://localhost:8000/tokens/mock | jq -r '.token')
export TOKEN

call_gateway() {
  local description=$1
  local tool=$2
  local payload=$3
  printf '\n-- %s --\n' "$description"
  curl -s -w '\n' -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "$payload" "http://localhost:8080/mcp/$tool/call" | jq
}

call_gateway "Unapproved tool" "sandbox-echo" '{"period":"2025-08","accountIds":["A-1001"]}' || true

printf '\n=== Updating grant ===\n'
curl -s -X POST http://localhost:8000/grants -H 'Content-Type: application/json' \
  -d '{"group":"finance","tool_id":"payroll-recon","scopes":[],"env":"dev"}' | jq
call_gateway "Missing scope (expected failure)" "payroll-recon" '{"period":"2025-08","accountIds":["A-1001"]}' || true
curl -s -X POST http://localhost:8000/grants -H 'Content-Type: application/json' \
  -d '{"group":"finance","tool_id":"payroll-recon","scopes":["read:ledger"],"env":"dev"}' | jq

call_gateway "Authorized call" "payroll-recon" '{"period":"2025-08","accountIds":["A-1001"]}'
call_gateway "Schema violation" "payroll-recon" '{"period":"Aug-2025"}' || true
call_gateway "DLP (SSN)" "payroll-recon" '{"period":"2025-08","accountIds":["A-1001"],"note":"SSN 123-45-6789"}'
call_gateway "Egress block" "payroll-recon" '{"period":"2025-08","accountIds":["A-1001"],"host":"https://untrusted.example.com"}' || true

printf '\n=== Conformance Replay ===\n'
(
  cd "$ROOT_DIR/conformance"
  npm install >/dev/null
  npm run build >/dev/null
  node dist/index.js replay ../examples/golden/payroll-recon.yaml --gateway http://localhost:8080
)
