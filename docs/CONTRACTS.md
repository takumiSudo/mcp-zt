# Contracts

The MCP zero-trust gateway enforces a strict contract between clients and tools. The contract is expressed as JSON Schema documents referenced by each tool in the catalog.

## Semantic versioning

Tools declare a `version` field using semantic versioning. The control plane expects:

* **Major**: Breaking changes to request/response schemas or side effects.
* **Minor**: Backwards-compatible additions (new optional fields, expanded enums).
* **Patch**: Backwards-compatible bug fixes.

When you promote a new tool version, update the schema in the control API and ensure the gateway has fetched the latest copy. Schema references may be served directly from the control API or through an external registry.

## Runtime enforcement

During each call the gateway:

1. Fetches the catalog entry and verifies the tool is `approved`.
2. Retrieves the JSON Schema referenced by `schema_ref`.
3. Validates the input payload prior to contacting the tool.
4. Validates the output payload before returning the response.

If validation fails a structured error response is returned to the caller and the attempt is recorded in the audit log with a `schema.input` or `schema.output` value of `error`.

## Golden sessions

The conformance CLI stores golden sessions inside `examples/golden/`. Each YAML file pairs inputs with expectations about schema success and response shape. Run `mcpctl replay` after any schema change to guarantee compatibility.
