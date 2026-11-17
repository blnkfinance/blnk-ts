import {assertNoDotSegments, InvalidPathSegmentError} from "./pathSegment";

const PROXY_PATH_PREFIX = `proxy`;

/**
 * Trims a Cloud proxy instance ID. Throws if the value is present but empty.
 *
 * Cloud requires `instance_id` on every `/proxy/*` request.
 * @see https://docs.blnkfinance.com/cloud/reference/proxy-api
 */
export function normalizeInstanceId(
  instanceId: string | undefined,
): string | undefined {
  if (instanceId === undefined) {
    return undefined;
  }

  if (typeof instanceId !== `string`) {
    throw new Error(`instanceId must be a string`);
  }

  const trimmed = instanceId.trim();
  if (trimmed === ``) {
    throw new Error(`instanceId cannot be empty`);
  }

  return trimmed;
}

function baseUrlIncludesProxy(baseUrl: string): boolean {
  return baseUrl.replace(/\/+$/, ``).endsWith(`/${PROXY_PATH_PREFIX}`);
}

function corePathForProxy(endpoint: string): string {
  const withoutLeading = endpoint.replace(/^\/+/, ``);
  if (
    withoutLeading === PROXY_PATH_PREFIX ||
    withoutLeading.startsWith(`${PROXY_PATH_PREFIX}/`) ||
    withoutLeading.startsWith(`${PROXY_PATH_PREFIX}?`)
  ) {
    return withoutLeading;
  }

  return `${PROXY_PATH_PREFIX}/${withoutLeading}`;
}

/**
 * Throws unless `url` is still under the base path. `new URL` resolves plain
 * `../`, so this is the last check that the request stays inside the API (or
 * Cloud `/proxy/`) base.
 */
function assertWithinBase(url: string, baseUrl: string): void {
  const resolved = new URL(url);
  const base = new URL(baseUrl);
  const basePath = base.pathname.endsWith(`/`)
    ? base.pathname
    : `${base.pathname}/`;
  if (
    resolved.origin !== base.origin ||
    !`${resolved.pathname}/`.startsWith(basePath)
  ) {
    throw new InvalidPathSegmentError(
      `request path escapes the API base: ${resolved.pathname}`,
    );
  }
  assertNoDotSegments(resolved.pathname);
}

/**
 * Builds the request URL for Core or Cloud proxy.
 *
 * Direct Core: `{baseUrl}{endpoint}` (unchanged).
 * Cloud proxy: `{baseUrl}proxy/{corePath}?instance_id=...`
 * plus any query string already on the Core path.
 *
 * Throws {@link InvalidPathSegmentError} when the endpoint contains a dot
 * segment, including percent-encoded ones such as `%2e%2e`.
 */
export function buildBlnkRequestUrl(
  baseUrl: string,
  endpoint: string,
  instanceId?: string,
): string {
  assertNoDotSegments(endpoint);

  if (!instanceId) {
    const href = `${baseUrl}${endpoint}`;
    assertWithinBase(href, baseUrl);
    return href;
  }

  const path = baseUrlIncludesProxy(baseUrl)
    ? endpoint.replace(/^\/+/, ``)
    : corePathForProxy(endpoint);

  const url = new URL(path, baseUrl);
  url.searchParams.set(`instance_id`, instanceId);
  assertWithinBase(
    url.href,
    baseUrlIncludesProxy(baseUrl)
      ? baseUrl
      : new URL(`${PROXY_PATH_PREFIX}/`, baseUrl).href,
  );
  return url.href;
}
