export interface BlnkClientOptions {
  baseUrl: string; // Required
  /**
   * Cloud Core instance ID (`instance_...`). When set, requests are sent to
   * `{baseUrl}proxy/{corePath}?instance_id=...` instead of Core directly.
   * Use Cloud's API origin as `baseUrl` (e.g. `https://api.cloud.blnkfinance.com`)
   * and a Cloud API key or OAuth access token as the SDK key.
   *
   * @see https://docs.blnkfinance.com/cloud/reference/proxy-api
   */
  instanceId?: string;
  /** HTTP timeout in ms. Defaults to 10000. */
  timeout?: number;
  /**
   * Total request attempts including the first. Defaults to 1.
   * Retries apply only to idempotent `GET` requests (not POST/PUT/DELETE).
   */
  retryCount?: number;
  /** Base delay between retries in ms. Defaults to 2000. */
  retryDelayMs?: number;
  logger?: BlnkLogger;
}

export interface BlnkLogger {
  info(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
  debug?(message: string, ...meta: unknown[]): void; // Optional for more detailed logs
}

/** Platform fetch (Node 18+ global `fetch`). */
export type FetchType = typeof fetch;
