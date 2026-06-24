/** Fund allocation strategy when `track_fund_lineage` is enabled. */
export type AllocationStrategy = `FIFO` | `LIFO` | `PROPORTIONAL`;

export interface CreateLedgerBalance<T extends Record<string, unknown>> {
  ledger_id: string;
  identity_id?: string;
  currency: string;
  /** Enables fund lineage tracking. Requires `identity_id`. */
  track_fund_lineage?: boolean;
  /** How tagged provider funds are allocated when spending. Defaults to `FIFO`. */
  allocation_strategy?: AllocationStrategy;
  meta_data?: T;
}

export interface CreateLedgerBalanceResp<T extends Record<string, unknown>> {
  balance: number;
  version: number;
  inflight_balance: number;
  credit_balance: number;
  inflight_credit_balance: number;
  debit_balance: number;
  inflight_debit_balance: number;
  /** Removed from Core 0.15.0 balance responses. */
  currency_multiplier?: number;
  ledger_id: string;
  identity_id: string;
  balance_id: string;
  indicator: string;
  currency: string;
  created_at: string;
  queued_credit_balance?: number;
  queued_debit_balance?: number;
  track_fund_lineage?: boolean;
  allocation_strategy?: AllocationStrategy;
  meta_data?: T;
}

/** Per-provider fund breakdown in `BalanceLineageResponse.providers`. */
export interface LineageProviderBreakdown {
  provider: string;
  /** Total received from this provider, in minor units. */
  amount: string | number;
  /** Still available from this provider, in minor units. */
  available: string | number;
  /** Already spent from this provider, in minor units. */
  spent: string | number;
  shadow_balance_id: string;
}

/**
 * Response from `GET /balances/{balance_id}/lineage`.
 *
 * @see https://docs.blnkfinance.com/reference/get-balance-lineage
 */
export interface BalanceLineageResponse {
  balance_id: string;
  aggregate_balance_id: string;
  /** Total lineage-tracked funds available, in minor units. */
  total_with_lineage: string | number;
  providers: LineageProviderBreakdown[];
}

/** Request body for `PUT /balances/{id}/identity`. */
export interface UpdateBalanceIdentity {
  identity_id: string;
}

/** Response from `PUT /balances/{id}/identity`. */
export interface UpdateBalanceIdentityResponse {
  message: string;
}

/** Optional request for `POST /balances-snapshots`. */
export interface CreateBalanceSnapshotRequest {
  /** Balances processed per batch. Omit or zero uses the server default (1000). */
  batch_size?: number;
}

/** Response from `POST /balances-snapshots`. */
export interface CreateBalanceSnapshotResponse {
  message: string;
}

/** Balance amounts in `GetBalanceAtResponse.balance`. */
export interface HistoricalBalanceDetails {
  balance: string | number;
  balance_id: string;
  credit_balance: string | number;
  currency: string;
  debit_balance: string | number;
}

/** Options for `GET /balances/{balance_id}`. */
export interface GetBalanceRequest {
  /** Reconstruct balance from transactions instead of snapshots when true. */
  from_source?: boolean;
}

/** Options for `GET /balances/{balance_id}/at`. */
export interface GetBalanceAtRequest {
  /** ISO 8601 timestamp (RFC3339), e.g. `2025-02-24T08:55:26Z`. */
  timestamp: string;
  /** Reconstruct from transactions instead of snapshots when true. */
  from_source?: boolean;
}

/** Response from `GET /balances/{balance_id}/at`. */
export interface GetBalanceAtResponse {
  balance: HistoricalBalanceDetails;
  timestamp: string;
  from_source: boolean;
}
