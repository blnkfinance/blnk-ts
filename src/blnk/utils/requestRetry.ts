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

export function normalizeRetryCount(retryCount: number | undefined): number {
  if (retryCount === undefined || retryCount < 1) {
    return 1;
  }

  return retryCount;
}

export function normalizeRetryDelayMs(retryDelayMs: number | undefined): number {
  if (retryDelayMs === undefined || retryDelayMs < 0) {
    return 2000;
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
