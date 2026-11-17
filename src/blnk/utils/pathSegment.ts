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

// `/ \ ? # %` change how the path is parsed or decoded; control characters
// (including CR and LF) have no place in a resource ID.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_SEGMENT_CHARS = /[/\\?#%\u0000-\u001f\u007f]/;

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

/**
 * Validates and escapes one path segment.
 *
 * Throws {@link InvalidPathSegmentError} when the value is empty, `.` or
 * `..`, or contains `/ \ ? # %` or a control character. Everything else is
 * passed through `encodeURIComponent`.
 */
export function pathSegment(value: unknown, name?: string): string {
  const segment = assertString(value, name);
  if (isDotSegment(segment)) {
    throw new InvalidPathSegmentError(
      `${describe(name)} cannot be "." or ".."`,
    );
  }
  if (FORBIDDEN_SEGMENT_CHARS.test(segment)) {
    throw new InvalidPathSegmentError(
      `${describe(name)} contains a character that is not allowed in a URL path (/ \\ ? # % or a control character)`,
    );
  }
  return encodeURIComponent(segment);
}

/**
 * Escapes a free-form value, such as a transaction reference, as one path
 * segment.
 *
 * `/` and `%` are escaped rather than rejected because references may contain
 * them. Empty values, and values with a `.` or `..` part, are rejected,
 * because escaping leaves dots unchanged.
 */
export function pathReference(value: unknown, name?: string): string {
  const reference = assertString(value, name);
  if (reference.split(/[/\\]/).some(isDotSegment)) {
    throw new InvalidPathSegmentError(
      `${describe(name)} cannot contain "." or ".." path segments`,
    );
  }
  return encodeURIComponent(reference);
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

const MAX_DECODE_ROUNDS = 5;

function decodePath(path: string): string {
  let decoded = path;
  for (let i = 0; i < MAX_DECODE_ROUNDS; i++) {
    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      throw new InvalidPathSegmentError(
        `request path contains malformed percent-encoding`,
      );
    }
    if (next === decoded) {
      return decoded;
    }
    decoded = next;
  }
  return decoded;
}

/**
 * Rejects an endpoint whose path, once percent-decoded, contains a `.` or
 * `..` segment. This catches `%2e%2e` and `..%2F`, which a decoding proxy or
 * server would otherwise resolve outside the intended route.
 */
export function assertNoDotSegments(endpoint: string): void {
  const path = endpoint.split(/[?#]/, 1)[0];
  if (decodePath(path).split(/[/\\]/).some(isDotSegment)) {
    throw new InvalidPathSegmentError(
      `request path escapes the API base: dot segments are not allowed`,
    );
  }
}
