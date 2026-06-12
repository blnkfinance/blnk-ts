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

export interface SearchResponse {
  found: number;
  out_of: number;
  page: number;
  request_params: SearchRequestParams;
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

export interface SearchIdentityHit {
  document: SearchIdentityDocument;
  highlights?: unknown[];
  highlight?: Record<string, unknown>;
  text_match?: number;
}

export interface SearchIdentityResponse {
  found: number;
  out_of: number;
  page: number;
  request_params: SearchRequestParams;
  search_time_ms: number;
  facet_counts?: unknown[];
  search_cutoff?: boolean;
  hits: SearchIdentityHit[];
}
