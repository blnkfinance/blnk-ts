const SENSITIVE_KEYS = new Set([
  `apikey`,
  `api_key`,
  `x-blnk-key`,
  `authorization`,
  `cookie`,
  `password`,
  `secret`,
  `token`,
]);

export function redactSensitiveString(value: string): string {
  return value
    .replace(/X-Blnk-Key:\s*[^\s,;]+/gi, `X-Blnk-Key: [REDACTED]`)
    .replace(/Bearer\s+[^\s,;]+/gi, `Bearer [REDACTED]`)
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[^"'\s,}]+/gi, `$1[REDACTED]`);
}

export function redactSensitiveLogValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === `string`) {
    return redactSensitiveString(value);
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveString(value.message),
    };
  }

  if (Array.isArray(value)) {
    return value.map(redactSensitiveLogValue);
  }

  if (typeof value === `object`) {
    return redactSensitiveLogMeta(value as Record<string, unknown>);
  }

  return value;
}

export function redactSensitiveLogMeta(
  meta: Record<string, unknown>,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = `[REDACTED]`;
      continue;
    }

    if (key.toLowerCase() === `headers`) {
      redacted[key] = redactSensitiveLogMeta(value as Record<string, unknown>);
      continue;
    }

    redacted[key] = redactSensitiveLogValue(value);
  }

  return redacted;
}

export function safeLogMeta(...meta: unknown[]): unknown[] {
  return meta.map(redactSensitiveLogValue);
}
