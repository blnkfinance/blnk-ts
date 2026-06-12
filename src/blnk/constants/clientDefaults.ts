/** Default HTTP timeout in ms (matches Go SDK and install docs). */
export const DEFAULT_TIMEOUT_MS = 10000;

/** Total request attempts including the first (matches Go SDK default). */
export const DEFAULT_RETRY_COUNT = 1;

/** Base delay between retry attempts in ms (matches Go SDK). */
export const DEFAULT_RETRY_DELAY_MS = 2000;
