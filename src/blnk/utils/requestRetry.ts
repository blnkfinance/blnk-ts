export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function isRetryableHttpMethod(
  method: `POST` | `GET` | `PUT` | `DELETE`,
): boolean {
  return method === `GET`;
}

export function isRetryableHttpStatus(status: number): boolean {
  return status >= 500;
}

import {
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY_MS,
} from "../constants/clientDefaults";

export function normalizeRetryCount(retryCount: number | undefined): number {
  if (
    retryCount === undefined ||
    !Number.isFinite(retryCount) ||
    retryCount < 1
  ) {
    return DEFAULT_RETRY_COUNT;
  }

  return Math.floor(retryCount);
}

export function normalizeRetryDelayMs(retryDelayMs: number | undefined): number {
  if (
    retryDelayMs === undefined ||
    !Number.isFinite(retryDelayMs) ||
    retryDelayMs < 0
  ) {
    return DEFAULT_RETRY_DELAY_MS;
  }

  return retryDelayMs;
}

export function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === `AbortError`) {
    return false;
  }

  return true;
}

export function retryDelayForAttempt(
  attempt: number,
  baseDelayMs: number,
): number {
  return baseDelayMs * attempt;
}
