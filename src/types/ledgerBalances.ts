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
  precision: number;
  ledger_id: string;
  identity_id: string;
  balance_id: string;
  indicator: string;
  currency: string;
  created_at: string;
  meta_data?: T;
}
