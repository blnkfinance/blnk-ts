/**
 * Transaction datetime input. Prefer a `Date` object so the SDK serializes it.
 *
 * String values must match Blnk Core `time.Parse("2006-01-02T15:04:05Z07:00")`
 * (e.g. `2024-04-22T15:28:03+00:00` or `2025-02-15T10:30:00Z`). Date-only
 * strings are rejected.
 */
export type TransactionDateInput = Date | string;

export interface CreateTransactions<T extends Record<string, unknown>> {
  /** Human-readable amount. Provide `amount` or `precise_amount` (at least one). */
  amount?: number;
  /**
   * Amount in minor units after `precision` is applied. Provide `amount` or
   * `precise_amount` (at least one). Prefer strings for values larger than
   * `Number.MAX_SAFE_INTEGER`.
   */
  precise_amount?: number | string;
  precision: number;
  reference: string;
  description: string;
  currency: string;
  rate?: number;
  source?: string;
  sources?: MultipleSourcesT[];
  destinations?: MultipleSourcesT[];
  destination?: string;
  inflight?: boolean;
  /** When `inflight` is true, void the transaction after this time. */
  inflight_expiry_date?: TransactionDateInput;
  /** When `inflight` is true, automatically commit at this time. */
  inflight_commit_date?: TransactionDateInput;
  scheduled_for?: TransactionDateInput;
  /**
   * Financial effective date for the transaction (ISO 8601). Defaults to
   * `created_at` when omitted.
   */
  effective_date?: TransactionDateInput;
  /** Process synchronously without queuing. Default: `false`. */
  skip_queue?: boolean;
  /**
   * When true on a split transaction (`sources` or `destinations`), all legs
   * succeed or fail together. Optional; omit for default Core behavior.
   */
  atomic?: boolean;
  allow_overdraft?: boolean;
  meta_data?: T;
}

export type PryTransactionStatus =
  | `QUEUED`
  | `APPLIED`
  | `REJECTED`
  | `COMMIT`
  | `VOID`
  | `INFLIGHT`
  | `EXPIRED`;
export type InflightStatus = `commit` | `void`;
export type StatusType = PryTransactionStatus;

/**
 * Response from `POST /transactions` and related transaction mutations.
 * Field shapes follow the Blnk Core create-transaction reference.
 *
 * @see https://docs.blnkfinance.com/reference/create-transaction
 */
export type CreateTransactionResponse<T extends Record<string, unknown>> = {
  transaction_id: string;
  amount: number;
  precision: number;
  precise_amount: number | string;
  reference: string;
  description: string;
  /** Removed from Core 0.15.0 responses; optional for request bodies and legacy payloads. */
  rate?: number;
  currency: string;
  status: StatusType;
  /** SHA-256 hash of the transaction details. */
  hash: string;
  /** Parent transaction ID, or empty string when none. */
  parent_transaction: string;
  source?: string;
  destination?: string;
  sources?: MultipleSourcesT[];
  destinations?: MultipleSourcesT[];
  allow_overdraft: boolean;
  skip_queue?: boolean;
  inflight: boolean;
  /** When true, all split legs succeed or fail together. */
  atomic?: boolean;
  overdraft_limit?: number;
  created_at: Date | string;
  scheduled_for: Date | string;
  inflight_expiry_date: Date | string;
  inflight_commit_date: Date | string;
  effective_date?: Date | string;
  meta_data?: T;
};

export type MultipleSourcesT = {
  identifier: string;
  /**
   * Percentage, fixed amount, or `left`. Required on a leg unless `precise_distribution`
   * is set for an exact minor-unit value.
   * see @link https://docs.blnkfinance.com/transactions/multiple-destinations#using-precise_distribution-with-precise_amount
   */
  distribution?: Distribution;
  /**
   * Fixed leg amount in minor units. Replaces `distribution` for exact values; the API
   * accepts string values for large integers. Prefer strings for values larger than
   * `Number.MAX_SAFE_INTEGER`.
   */
  precise_distribution?: string | number;
  narration?: string;
};

/** Percentage share of the transaction total, e.g. `"20%"`. */
export type PercentageDistribution = `${number}%`;

/** Remaining balance after other split legs. */
export type LeftDistribution = `left`;

/**
 * Fixed amount in transaction amount units. Matches API `distribution` strings,
 * including decimals such as `"240.23"`. Exponent (`1e3`) and hex (`0x10`)
 * forms are rejected by the SDK validator.
 */
export type FixedAmountDistribution =
  | `${number}`
  | `${number}.${number}`
  | `${number}.${number}${number}`;

export type Distribution =
  | PercentageDistribution
  | LeftDistribution
  | FixedAmountDistribution;

//we can only update transactions with COMMIT or VOID
//create function called commit, that takes in a transaction id and commits it
//do the same for void
//so transaction.commit(id), transaction.commitPartial(id,amount)
export type UpdateTransactionStatus<T extends Record<string, unknown>> = {
  status: InflightStatus;
  /** Human-readable partial commit amount. Omit for full commit. */
  amount?: number;
  /**
   * Partial commit amount in minor units. Omit for full commit. Prefer strings
   * for values larger than `Number.MAX_SAFE_INTEGER`. When both `amount` and
   * `precise_amount` are set, Core uses `precise_amount`.
   */
  precise_amount?: number | string;
  meta_data?: T;
};

/** Optional body for `POST /refund-transaction/{transaction_id}`. */
export interface RefundTransactionRequest {
  /** Process synchronously without queuing. Default: `false`. */
  skip_queue?: boolean;
}

export interface BulkTransactions<T extends Record<string, unknown>> {
  atomic?: boolean;
  inflight?: boolean;
  run_async?: boolean;
  /** Process synchronously without queuing. Default: `false`. */
  skip_queue?: boolean;
  transactions: CreateTransactions<T>[];
}

/** Bulk batch status from `POST /transactions/bulk`. */
export type BulkTransactionStatus = `applied` | `inflight` | `queued`;

/**
 * Response from `POST /transactions/bulk`.
 * Field shapes follow the Blnk Core bulk-transactions reference.
 *
 * @see https://docs.blnkfinance.com/reference/bulk-transactions
 */
export interface BulkTransactionResponse {
  batch_id: string;
  status: BulkTransactionStatus | string;
  /** Present when processing finished synchronously and the batch succeeded. */
  transaction_count?: number;
  /** Present when `run_async` is true (background processing started). */
  message?: string;
}

/** Maximum items per bulk commit or bulk void inflight request. */
export const MAX_BULK_INFLIGHT_ITEMS = 100;

/** One transaction in `POST /transactions/inflight/bulk/commit`. */
export interface BulkCommitInflightItem {
  transaction_id: string;
  /**
   * Optional partial commit amount. When omitted or zero, Core commits the
   * full remaining inflight amount.
   */
  amount?: number;
  /**
   * Optional partial commit amount in minor units. When set, takes precedence
   * over `amount`. Prefer strings for values larger than `Number.MAX_SAFE_INTEGER`.
   */
  precise_amount?: number | string;
}

/** Request body for `POST /transactions/inflight/bulk/commit`. */
export interface BulkCommitInflightRequest {
  transactions: BulkCommitInflightItem[];
}

export type BulkInflightResultStatus = `succeeded` | `failed`;

/** Per-item outcome in `BulkCommitInflightResponse`. */
export interface BulkCommitInflightResult {
  transaction_id: string;
  status: BulkInflightResultStatus | string;
  code?: string;
  message?: string;
}

/**
 * Response from `POST /transactions/inflight/bulk/commit`.
 *
 * @see https://docs.blnkfinance.com/reference/bulk-commit-inflight
 */
export interface BulkCommitInflightResponse {
  succeeded: number;
  failed: number;
  results: BulkCommitInflightResult[];
}

/** Request body for `POST /transactions/inflight/bulk/void`. */
export interface BulkVoidInflightRequest {
  transaction_ids: string[];
}

/** Per-item outcome in `BulkVoidInflightResponse`. */
export interface BulkVoidInflightResult {
  transaction_id: string;
  status: BulkInflightResultStatus | string;
  code?: string;
  message?: string;
}

/**
 * Response from `POST /transactions/inflight/bulk/void`.
 *
 * @see https://docs.blnkfinance.com/reference/bulk-void-inflight
 */
export interface BulkVoidInflightResponse {
  succeeded: number;
  failed: number;
  results: BulkVoidInflightResult[];
}

/** One provider entry in `TransactionLineageResponse.fund_allocation`. */
export type TransactionLineageFundAllocation = Record<
  string,
  string | number | boolean | null
>;

/**
 * Shadow transaction created for fund lineage tracking.
 * Items mirror Core transaction objects; fields vary by lineage type.
 */
export type TransactionLineageShadowTransaction<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  transaction_id: string;
  reference?: string;
  precise_amount?: number | string;
  amount?: number;
  precision?: number;
  currency?: string;
  status?: StatusType | string;
  parent_transaction?: string;
  meta_data?: T;
} & Record<string, unknown>;

/**
 * Response from `GET /transactions/{transaction_id}/lineage`.
 *
 * @see https://docs.blnkfinance.com/reference/get-transaction-lineage
 */
export interface TransactionLineageResponse<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  transaction_id: string;
  /** Present for debits from lineage-enabled balances. Amounts are minor units. */
  fund_allocation?: TransactionLineageFundAllocation[] | null;
  /** Empty when no shadow transactions exist; Core may return `null`. */
  shadow_transactions: TransactionLineageShadowTransaction<T>[] | null;
}

/** Optional query options for `POST /transactions/recover`. */
export interface RecoverQueueRequest {
  /**
   * Minimum age of queued transactions to recover (Go duration string).
   * Examples: `5m`, `10m`, `1h`. Core default: `2m`.
   */
  threshold?: string;
}

/**
 * Response from `POST /transactions/recover`.
 *
 * @see https://docs.blnkfinance.com/reference/queue-recovery
 */
export interface RecoverQueueResponse {
  /** Number of transactions re-enqueued for processing. */
  recovered: number;
  /** Threshold duration Core applied (e.g. `5m0s`). */
  threshold: string;
}
