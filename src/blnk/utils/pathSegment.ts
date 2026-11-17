/**
 * Builders for the path part of Core request URLs.
 *
 * Caller-supplied values (IDs, indicators, currencies, field names, ...) are
 * placed into the URL path. Without checks, a value such as `../backup` turns
 * `GET identities/{id}` into `GET /backup` and sends the API key there.
 */

/** Thrown when a value cannot be placed into a request path safely. */
export class InvalidPathSegmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = `InvalidPathSegmentError`;
  }
}

// Control characters (including CR and LF) have no place in a resource ID.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function describe(name: string | undefined): string {
  return name ?? `path segment`;
}

function assertString(value: unknown, name: string | undefined): string {
  if (typeof value !== `string`) {
    throw new InvalidPathSegmentError(`${describe(name)} must be a string`);
  }
  if (value === ``) {
    throw new InvalidPathSegmentError(`${describe(name)} is required`);
  }
  return value;
}

function isDotSegment(segment: string): boolean {
  return segment === `.` || segment === `..`;
}

const MAX_DECODE_ROUNDS = 5;
const ASCII_ESCAPE = /%([0-7][0-9a-fA-F])/g;

/**
 * Decodes ASCII percent-escapes until the value stops changing, so `%2e`,
 * `%2E` and `%252e` are all seen as `.` and `%2F` as `/`. Anything else,
 * including a literal `%` as in `100%`, is left as it is, so a malformed
 * escape elsewhere in the value cannot stop the check early.
 */
function decodeRepeatedly(value: string): string {
  let decoded = value;
  for (let i = 0; i < MAX_DECODE_ROUNDS; i++) {
    const next = decoded.replace(ASCII_ESCAPE, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
    if (next === decoded) {
      return decoded;
    }
    decoded = next;
  }
  return decoded;
}

/** True when the value, once decoded, has a `.` or `..` part. */
function hasDotSegment(value: string): boolean {
  return decodeRepeatedly(value).split(/[/\\]/).some(isDotSegment);
}

function escapeSegment(value: string, name: string | undefined): string {
  if (hasDotSegment(value)) {
    throw new InvalidPathSegmentError(
      `${describe(name)} cannot contain "." or ".." path segments`,
    );
  }
  return encodeURIComponent(value);
}

/**
 * Validates and escapes one path segment, such as a resource ID, balance
 * indicator, currency or field name.
 *
 * Reserved characters (`/ ? # % \` and so on) are percent-encoded, so
 * `@user/name` is sent as `%40user%2Fname` and stays one segment.
 *
 * Throws {@link InvalidPathSegmentError} when the value is empty, contains a
 * control character, or has a `.` or `..` part once percent-decoded (`..`,
 * `../backup`, `%2e%2e`, `a/../b`). Escaping cannot neutralise those, because
 * `encodeURIComponent` leaves dots unchanged and servers decode `%2F`.
 */
export function pathSegment(value: unknown, name?: string): string {
  const segment = assertString(value, name);
  if (CONTROL_CHARS.test(segment)) {
    throw new InvalidPathSegmentError(
      `${describe(name)} cannot contain control characters`,
    );
  }
  return escapeSegment(segment, name);
}

/**
 * Escapes a free-form value, such as a transaction reference, as one path
 * segment. Same as {@link pathSegment}, except control characters are
 * escaped rather than rejected, as they were before.
 */
export function pathReference(value: unknown, name?: string): string {
  return escapeSegment(assertString(value, name), name);
}

/**
 * Tagged template that passes every interpolated value through
 * {@link pathSegment}.
 *
 * @example
 * endpointPath`identities/${id}/tokenize/${field}`
 */
export function endpointPath(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let path = strings[0];
  for (let i = 0; i < values.length; i++) {
    path += pathSegment(values[i]) + strings[i + 1];
  }
  return path;
}

/**
 * Rejects an endpoint whose path, once percent-decoded, contains a `.` or
 * `..` segment. This catches `%2e%2e` and `..%2F`, which a decoding proxy or
 * server would otherwise resolve outside the intended route.
 */
export function assertNoDotSegments(endpoint: string): void {
  const path = endpoint.split(/[?#]/, 1)[0];
  if (hasDotSegment(path)) {
    throw new InvalidPathSegmentError(
      `request path escapes the API base: dot segments are not allowed`,
    );
  }
}
