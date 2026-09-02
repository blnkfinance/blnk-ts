export interface BlnkApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Stable Core `error_detail.code` values called out for SDK 1.4.0 / Core 0.15.3.
 * Compare `response.error?.code` — do not branch on message text.
 *
 * @see https://docs.blnkfinance.com/advanced/error-codes
 */
export const BlnkErrorCode = {
  /** Catalog code for invalid amounts (see Core error-code docs). */
  TXN_INVALID_AMOUNT: `TXN_INVALID_AMOUNT`,
  /** Duplicate internal-balance indicator + currency (HTTP 409). */
  GEN_CONFLICT: `GEN_CONFLICT`,
  /**
   * Request failed validation before processing. On Core 0.15.3 this includes
   * negative `amount`/`precision` and source equal to destination.
   */
  TXN_VALIDATION_ERROR: `TXN_VALIDATION_ERROR`,
} as const;

export type BlnkErrorCode = (typeof BlnkErrorCode)[keyof typeof BlnkErrorCode];

/**
 * Extracts structured Blnk API error details from a JSON error body.
 * Supports `error_detail` (current Core API) and legacy `error` string fields.
 */
export function parseBlnkApiErrorBody(
  body: unknown,
): BlnkApiErrorDetail | null {
  if (!body || typeof body !== `object`) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const errorDetail = record.error_detail;

  if (errorDetail && typeof errorDetail === `object`) {
    const detail = errorDetail as Record<string, unknown>;
    if (typeof detail.code === `string` && typeof detail.message === `string`) {
      const parsed: BlnkApiErrorDetail = {
        code: detail.code,
        message: detail.message,
      };
      if (`details` in detail) {
        parsed.details = detail.details;
      }
      return parsed;
    }
  }

  if (typeof record.error === `string` && record.error.length > 0) {
    return {
      code: `UNKNOWN`,
      message: record.error,
    };
  }

  return null;
}
