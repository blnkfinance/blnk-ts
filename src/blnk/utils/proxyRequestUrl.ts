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
 * Builds the request URL for Core or Cloud proxy.
 *
 * Direct Core: `{baseUrl}{endpoint}` (unchanged).
 * Cloud proxy: `{baseUrl}proxy/{corePath}?instance_id=...`
 * plus any query string already on the Core path.
 */
export function buildBlnkRequestUrl(
  baseUrl: string,
  endpoint: string,
  instanceId?: string,
): string {
  if (!instanceId) {
    return `${baseUrl}${endpoint}`;
  }

  const path = baseUrlIncludesProxy(baseUrl)
    ? endpoint.replace(/^\/+/, ``)
    : corePathForProxy(endpoint);

  const url = new URL(path, baseUrl);
  url.searchParams.set(`instance_id`, instanceId);
  return url.href;
}
