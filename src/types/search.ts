export interface SearchParams {
  q: string;
  query_by?: string;
  filter_by?: string;
  sort_by?: string;
  page?: number;
  per_page?: number;
}

export interface SearchResponse {
  found: number;
  out_of: number;
  page: number;
  request_params: SearchParams;
  search_time_ms: number;
  hits: Array<{
    document: {
      balance_id: string;
      balance: number;
      credit_balance: number;
      debit_balance: number;
      currency: string;
      precision: number;
      ledger_id: string;
      created_at: string;
      meta_data: unknown | null;
    };
  }>;
}
