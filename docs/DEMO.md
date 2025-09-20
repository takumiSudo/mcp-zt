# Ten Minute Demo

The `make demo` target automates the key acceptance scenarios. To follow along manually use the commands below.

## 1. Start the stack and seed data

```bash
make up
make seed
```

## 2. Request a token

```bash
TOKEN=$(curl -s http://localhost:8000/tokens/mock | jq -r '.token')
```

## 3. Call an unapproved tool

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"period":"2025-08","accountIds":["A-1001"]}' \
  http://localhost:8080/mcp/sandbox-echo/call | jq
```
Expected response: `{ "code": "not_approved" }`.

## 4. Missing scope enforcement

Revoke scope via the control API then observe the forbidden response.

```bash
curl -s -X POST http://localhost:8000/grants -H 'Content-Type: application/json' \
  -d '{"group":"finance","tool_id":"payroll-recon","scopes":[],"env":"dev"}' | jq

curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"period":"2025-08","accountIds":["A-1001"]}' http://localhost:8080/mcp/payroll-recon/call | jq

curl -s -X POST http://localhost:8000/grants -H 'Content-Type: application/json' \
  -d '{"group":"finance","tool_id":"payroll-recon","scopes":["read:ledger"],"env":"dev"}' | jq
```

The intermediate call fails with `{ "code": "forbidden" }` until the grant is restored.

## 5. Schema validation

Submit malformed input:

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"period":"Aug-2025"}' http://localhost:8080/mcp/payroll-recon/call | jq
```

Expect HTTP 400 with a JSON pointer describing the failure.

## 6. DLP actions

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"period":"2025-08","accountIds":["A-1001"],"note":"Employee SSN 123-45-6789"}' \
  http://localhost:8080/mcp/payroll-recon/call | jq
```

Audit logs redact the SSN while allowing the call to continue.

## 7. Egress block

```bash
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"period":"2025-08","accountIds":["A-1001"],"host":"https://untrusted.example.com"}' \
  http://localhost:8080/mcp/payroll-recon/call | jq
```

Response: `{ "code": "egress_block" }`.

## 8. Conformance replay

```bash
cd conformance
npm install
npm run build
node dist/index.js replay ../examples/golden/payroll-recon.yaml --gateway http://localhost:8080
```

The command fails if schema or latency budgets regress.
