import {
  CreateTransactions,
  TransactionDateInput,
} from "../../types/transactions";

/**
 * Matches Blnk Core `time.Parse("2006-01-02T15:04:05Z07:00", …)` in
 * `api/model/model.go` — RFC3339 without fractional seconds.
 */
export const RFC3339_DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}(?::\d{2}|\d{2}))$/;

export function isValidTransactionDateInput(
  value: TransactionDateInput,
): boolean {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  if (typeof value === `string`) {
    const trimmed = value.trim();
    if (trimmed === ``) {
      return false;
    }
    if (!RFC3339_DATETIME.test(trimmed)) {
      return false;
    }
    return !isNaN(Date.parse(trimmed));
  }

  return false;
}

/**
 * Serializes a transaction date field for the Blnk API (RFC3339 string).
 */
export function serializeTransactionDate(
  value: TransactionDateInput | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().replace(/\.\d{3}Z$/, `Z`);
  }

  return value;
}

/**
 * Prepares a create-transaction payload for the API, converting Date fields to ISO strings.
 */
export function serializeCreateTransaction<T extends Record<string, unknown>>(
  data: CreateTransactions<T>,
): CreateTransactions<T> {
  return {
    ...data,
    inflight_expiry_date: serializeTransactionDate(
      data.inflight_expiry_date,
    ) as CreateTransactions<T>[`inflight_expiry_date`],
    scheduled_for: serializeTransactionDate(
      data.scheduled_for,
    ) as CreateTransactions<T>[`scheduled_for`],
    effective_date: serializeTransactionDate(
      data.effective_date,
    ) as CreateTransactions<T>[`effective_date`],
    inflight_commit_date: serializeTransactionDate(
      data.inflight_commit_date,
    ) as CreateTransactions<T>[`inflight_commit_date`],
  };
}
