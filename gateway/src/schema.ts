import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { GatewayConfig, SchemaBundle } from './types.js';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

type Validator = (data: unknown) => { valid: boolean; errors?: ErrorObject[] };

const schemaCache = new Map<string, { bundle: SchemaBundle; validateInput: Validator; validateOutput: Validator }>();

async function fetchSchema(controlApiUrl: string, ref: string): Promise<SchemaBundle> {
  const res = await fetch(`${controlApiUrl}/schemas/${ref}`);
  if (!res.ok) {
    throw new Error(`failed to fetch schema ${ref}: ${res.status}`);
  }
  return (await res.json()) as SchemaBundle;
}

function compileValidator(bundle: SchemaBundle, direction: 'input' | 'output'): Validator {
  const schema = bundle[direction];
  const validate = ajv.compile(schema);
  return (data: unknown) => {
    const valid = validate(data) as boolean;
    return { valid, errors: valid ? undefined : validate.errors ?? undefined };
  };
}

export async function getSchemaValidators(config: GatewayConfig, ref: string) {
  if (!schemaCache.has(ref)) {
    const bundle = await fetchSchema(config.controlApiUrl, ref);
    const validateInput = compileValidator(bundle, 'input');
    const validateOutput = compileValidator(bundle, 'output');
    schemaCache.set(ref, { bundle, validateInput, validateOutput });
  }
  return schemaCache.get(ref)!;
}

export function formatErrors(errors?: ErrorObject[] | null): string[] {
  if (!errors) return [];
  return errors.map((err) => `${err.instancePath || '/'} ${err.message}`.trim());
}
