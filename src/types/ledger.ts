export interface CreateLedger<T extends Record<string, any>> {
    name: string;
    meta_data?: T
}

export interface CreateLedgerResp<T extends Record<string, any>> {
    ledger_id: string,
    name: string,
    created_at: string,
    meta_data: T
}

export interface CreateLedgerRespCamel<T extends Record<string, any>> {
    ledgerId: string,
    name: string,
    createdAt: string
    meta_data: T
}