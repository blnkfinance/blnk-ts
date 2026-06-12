export interface SearchParams {
  q: string;
  query_by?: string;
  filter_by?: string;
  sort_by?: string;
  page?: number;
  per_page?: number;
}

/** Collection names supported by `Search.search`. */
export type SearchCollection =
  | `ledgers`
  | `transactions`
  | `balances`
  | `identities`;

/** Request params echoed by Typesense (may include `collection_name`). */
export interface SearchRequestParams extends SearchParams {
  collection_name?: string;
}

export interface SearchHit<TDocument> {
  document: TDocument;
  highlights?: unknown[];
  highlight?: Record<string, unknown>;
  text_match?: number;
}

export interface SearchGroupedHit<TDocument> {
  group_key?: string[];
  hits: SearchHit<TDocument>[];
}

export interface SearchResponse<TDocument> {
  found: number;
  out_of: number;
  page: number;
  request_params: SearchRequestParams;
  search_time_ms: number;
  facet_counts?: unknown[];
  search_cutoff?: boolean;
  hits: SearchHit<TDocument>[];
  grouped_hits?: SearchGroupedHit<TDocument>[];
}

/** Ledger document shape returned by `POST /search/ledgers`. */
export interface SearchLedgerDocument {
  id: string;
  ledger_id: string;
  name: string;
  /** Typesense-indexed creation time (Unix timestamp seconds). */
  created_at: number;
  meta_data?: Record<string, unknown> | null;
}

/** Balance document shape returned by `POST /search/balances`. */
export interface SearchBalanceDocument {
  id: string;
  balance_id: string;
  balance: string;
  credit_balance?: string;
  debit_balance?: string;
  inflight_balance?: string;
  inflight_credit_balance?: string;
  inflight_debit_balance?: string;
  currency?: string;
  precision?: number;
  ledger_id?: string;
  identity_id?: string;
  indicator?: string;
  version?: number;
  allocation_strategy?: string;
  track_fund_lineage?: boolean;
  currency_multiplier?: number;
  inflight_expires_at?: number;
  /** Typesense-indexed creation time (Unix timestamp seconds). */
  created_at: number;
  meta_data?: Record<string, unknown> | null;
}

/** Transaction document shape returned by `POST /search/transactions`. */
export interface SearchTransactionDocument {
  id: string;
  transaction_id: string;
  amount?: number;
  amount_string?: string;
  precise_amount?: string;
  precision?: number;
  source?: string;
  destination?: string;
  reference?: string;
  description?: string;
  currency?: string;
  status?: string;
  hash?: string;
  parent_transaction?: string;
  atomic?: boolean;
  inflight?: boolean;
  allow_overdraft?: boolean;
  overdraft_limit?: number;
  skip_queue?: boolean;
  rate?: number;
  /** Typesense-indexed creation time (Unix timestamp seconds). */
  created_at: number;
  scheduled_for?: number;
  inflight_expiry_date?: number;
  effective_date?: number;
  meta_data?: Record<string, unknown> | null;
}

/** Identity document shape returned by `POST /search/identities`. */
export interface SearchIdentityDocument {
  id: string;
  identity_id: string;
  identity_type: string;
  organization_name?: string;
  category?: string;
  first_name?: string;
  last_name?: string;
  other_names?: string;
  gender?: string;
  email_address?: string;
  phone_number?: string;
  nationality?: string;
  street?: string;
  country?: string;
  state?: string;
  post_code?: string;
  city?: string;
  /** Typesense-indexed date of birth (Unix timestamp seconds). */
  dob?: number;
  /** Typesense-indexed creation time (Unix timestamp seconds). */
  created_at: number;
  meta_data?: Record<string, unknown> | null;
}

export type SearchDocumentByCollection = {
  ledgers: SearchLedgerDocument;
  transactions: SearchTransactionDocument;
  balances: SearchBalanceDocument;
  identities: SearchIdentityDocument;
};

export type SearchResponseByCollection = {
  [K in SearchCollection]: SearchResponse<SearchDocumentByCollection[K]>;
};

export type SearchIdentityHit = SearchHit<SearchIdentityDocument>;
export type SearchIdentityResponse = SearchResponse<SearchIdentityDocument>;
export type SearchLedgerResponse = SearchResponse<SearchLedgerDocument>;
export type SearchBalanceResponse = SearchResponse<SearchBalanceDocument>;
export type SearchTransactionResponse =
  SearchResponse<SearchTransactionDocument>;
