function hostMatches(host: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1);
    return host.endsWith(suffix);
  }
  return host === pattern;
}

export function isEgressAllowed(host: string, allowlist: string[]): boolean {
  return allowlist.some((pattern) => hostMatches(host, pattern));
}

export function extractHost(target: string): string | null {
  try {
    const url = new URL(target);
    return url.hostname;
  } catch (err) {
    return null;
  }
}

export function unionAllowlists(...lists: (string[] | undefined)[]): string[] {
  const merged = new Set<string>();
  for (const list of lists) {
    if (!list) continue;
    for (const item of list) {
      merged.add(item);
    }
  }
  return Array.from(merged);
}
