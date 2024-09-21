export interface CreateLedger<T extends Record<string, unknown>> {
  name: string;
  meta_data?: T;
}

export interface CreateLedgerResp<T extends Record<string, unknown>> {
  ledger_id: string;
  name: string;
  created_at: string;
  meta_data: T;
}

export interface CreateLedgerRespCamel<T extends Record<string, unknown>> {
  ledgerId: string;
  name: string;
  createdAt: string;
  meta_data: T;
}
