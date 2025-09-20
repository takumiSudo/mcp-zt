# API Reference

## Gateway

### `POST /mcp/{toolId}/call`

Proxy invocation for MCP tools. Requires `Authorization: Bearer <jwt>` header. Request body is forwarded to the MCP server after policy and schema enforcement.

Responses:

* `200 OK`: JSON payload returned by the tool.
* `400 Bad Request`: Schema or DLP violations. Body: `{ code, message, details }`.
* `403 Forbidden`: Policy denied (`{ code: "forbidden" }`).
* `404 Not Found`: Unknown tool id.
* `429 Too Many Requests`: Rate limiting triggered.
* `502/504`: Upstream failures.

## Control API

### `GET /tools`
List all tools.

### `POST /tools`
Create a tool. Body matches `ToolCreate` schema.

### `GET /tools/{tool_id}`
Fetch a single tool with grants and policy metadata.

### `GET /grants`
List grants.

### `POST /grants`
Create or replace a grant.

### `GET /tokens/mock`
Issue a mock JWT for local development. The response is `{ token }`.

### `GET /schemas/{schema_id}`
Return the JSON Schema document for the given identifier.

### `GET /policy/egress`
Return the global egress allow-list configured for the environment.

### `GET /audit/records`
Return the most recent audit entries read from MinIO via the control API.
