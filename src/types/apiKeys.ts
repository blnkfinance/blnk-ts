export interface CreateApiKeyData {
  name: string;
  owner: string;
  scopes: string[];
  /** ISO 8601 expiration timestamp (e.g. `2026-03-11T00:00:00Z`). */
  expires_at: string;
}

export interface ListApiKeysOptions {
  owner?: string;
}

export interface ApiKeyResp {
  api_key_id: string;
  key: string;
  name: string;
  owner_id: string;
  scopes: string[];
  expires_at: string;
  created_at: string;
  last_used_at: string;
  is_revoked: boolean;
  revoked_at?: string;
}

/** Listed API key (raw `key` value is not returned by Core). */
export type ApiKeyListItem = Omit<ApiKeyResp, `key`> & {key?: string};
