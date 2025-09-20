import { DlpResult } from './types.js';

type DataClass = 'public' | 'internal' | 'confidential' | 'regulated';

const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phoneRegex = /\b(?:\+?1[-. ]?)?(?:\(?\d{3}\)?[-. ]?)\d{3}[-. ]?\d{4}\b/g;
const ccnRegex = /\b(?:\d[ -]?){13,19}\b/g;

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (Number.isNaN(digit)) {
      return false;
    }
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function maskString(value: string): { masked: string; matches: Record<string, number>; blocked: boolean; blockedRules: string[] } {
  let masked = value;
  const matches: Record<string, number> = {};
  const blockedRules: string[] = [];

  masked = masked.replace(ssnRegex, (match) => {
    matches['ssn'] = (matches['ssn'] ?? 0) + 1;
    return '***-**-****';
  });
  masked = masked.replace(emailRegex, (match) => {
    matches['email'] = (matches['email'] ?? 0) + 1;
    return '[redacted-email]';
  });
  masked = masked.replace(phoneRegex, (match) => {
    matches['phone'] = (matches['phone'] ?? 0) + 1;
    return '[redacted-phone]';
  });

  const blockedCandidates = value.match(ccnRegex) || [];
  for (const candidate of blockedCandidates) {
    const digits = candidate.replace(/[^\d]/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
      matches['ccn'] = (matches['ccn'] ?? 0) + 1;
      blockedRules.push('ccn');
    }
  }

  return { masked, matches, blocked: blockedRules.length > 0, blockedRules };
}

function walk(value: unknown, collector: Record<string, number>): unknown {
  if (typeof value === 'string') {
    const { masked, matches } = maskString(value);
    for (const [rule, count] of Object.entries(matches)) {
      collector[rule] = (collector[rule] ?? 0) + count;
    }
    return masked;
  }
  if (Array.isArray(value)) {
    return value.map((item) => walk(item, collector));
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = walk(val, collector);
    }
    return result;
  }
  return value;
}

export function applyDlp(payload: unknown, dataClass: DataClass): DlpResult {
  const matches: Record<string, number> = {};
  const blockedRules: string[] = [];

  const redacted = walk(payload, matches);

  if (matches['ccn']) {
    blockedRules.push('ccn');
  }

  if (blockedRules.length && (dataClass === 'confidential' || dataClass === 'regulated')) {
    return {
      action: 'block',
      rules: Array.from(new Set(blockedRules)),
      count: blockedRules.reduce((sum, rule) => sum + (matches[rule] ?? 0), 0),
    };
  }

  const redactionRules = Object.keys(matches).filter((rule) => rule !== 'ccn');

  if (redactionRules.length) {
    const total = redactionRules.reduce((sum, rule) => sum + (matches[rule] ?? 0), 0);
    return {
      action: 'redact',
      rules: redactionRules,
      count: total,
      redactedPayload: redacted,
    };
  }

  return { action: 'allow', rules: [], count: 0 };
}
