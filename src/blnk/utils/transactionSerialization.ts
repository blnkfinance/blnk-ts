import {
  CreateTransactions,
  TransactionDateInput,
} from "../../types/transactions";

/**
 * Serializes a transaction date field for the Blnk API (RFC3339 / ISO 8601 string).
 */
export function serializeTransactionDate(
  value: TransactionDateInput | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
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
