export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function isRetryableHttpStatus(status: number): boolean {
  return status >= 500;
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
