export interface CreateLedgerBalance<T extends Record<string, unknown>> {
  ledger_id: string;
  identity_id?: string;
  currency: string;
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
  currency_multiplier: number;
  ledger_id: string;
  identity_id: string;
  balance_id: string;
  indicator: string;
  currency: string;
  created_at: string;
  queued_credit_balance?: number;
  queued_debit_balance?: number;
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
