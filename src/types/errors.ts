export interface BlnkApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

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
      return {
        code: detail.code,
        message: detail.message,
        details: detail.details,
      };
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
