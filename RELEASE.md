# Release Notes

## v1.4.0

v1.4.0 targets **Blnk Core 0.15.3**. v1.3.0 shipped Core 0.15.0 parity; this release adds dry-run previews, General Ledger `indicator` on create, refund narration/metadata, and named Core error codes.

See [Dry-run transactions](https://docs.blnkfinance.com/transactions/dry-run) and the [Core changelog](https://docs.blnkfinance.com/changelog/blnk-core).

### Transactions

- **`dry_run`** — Optional on `Transactions.create`, `createBulk`, `refund`, `updateStatus`, `bulkCommitInflight`, and `bulkVoidInflight`. Core returns HTTP 200 with a preview (`would_apply`, `rejection`, `balances`). Nothing is written; `reference` is not consumed. Typed as `TransactionPreview` / `BulkTransactionPreview`. [Guide](https://docs.blnkfinance.com/transactions/dry-run)

- **`Transactions.refund`** — Accepts `description` and `meta_data` in addition to `skip_queue`. Empty description inherits the original; metadata is merged onto the inherited copy. [Reference](https://docs.blnkfinance.com/reference/refund-transaction)

### Balances

- **`LedgerBalances.create`** — Optional `indicator` (must start with `@`, no spaces) when `ledger_id` is `"general_ledger_id"`. Duplicate indicator + currency returns `409` / `GEN_CONFLICT`. [Guide](https://docs.blnkfinance.com/balances/internal-balances)

### Hooks

- **`Hooks.list()`** — `type` remains optional. Omitting it lists PRE and POST hooks (`GET /hooks`).

### Errors

- **`BlnkErrorCode`** — Exported constants for `TXN_INVALID_AMOUNT`, `GEN_CONFLICT`, and `TXN_VALIDATION_ERROR`. Core 0.15.3 uses `TXN_VALIDATION_ERROR` for negative amounts and for source equal to destination; duplicate GL indicators return `GEN_CONFLICT`. Branch on `response.error?.code`. [Guide](https://docs.blnkfinance.com/advanced/error-codes)

## v1.2.0

v1.2.0 extends the SDK beyond ledger, balance, and transaction APIs. **v1.1.0** closed the Core parity gap for those domains; this release adds search, reconciliation, identity, metadata, hooks, and API key management, plus a modernized HTTP client.

It also hardens the client layer: native `fetch`, configurable timeouts and retries, typed API errors, and redacted logging.

### Search

- **`Search.search(params, collection)`** — Full-text search via Typesense. Now supports the `identities` collection and typed `SearchResponse` per collection. [Guide](https://docs.blnkfinance.com/search/overview) · [Guide: collections](https://docs.blnkfinance.com/search/typesense/introduction#searchable-collections)

- **`Search.filter(params, collection)`** — Structured DB filters via `POST /{collection}/filter`. [Guide](https://docs.blnkfinance.com/search/db/filtering)

- **`Search.startReindex(options?)`** — Rebuilds the Typesense index from the database via `POST /search/reindex`. [Reference](https://docs.blnkfinance.com/reference/start-reindex) · [Guide](https://docs.blnkfinance.com/search/typesense/reindex)

- **`Search.getReindexStatus()`** — Returns reindex progress via `GET /search/reindex`. [Reference](https://docs.blnkfinance.com/reference/get-reindex)

### Reconciliation

- **`Reconciliation.updateMatchingRule(id, data)`** — Updates a matching rule via `PUT /reconciliation/matching-rules/{rule_id}`. [Reference](https://docs.blnkfinance.com/reference/update-matching-rule) · [Guide](https://docs.blnkfinance.com/reconciliations/matching-rules)

- **`Reconciliation.deleteMatchingRule(id)`** — Deletes a matching rule via `DELETE /reconciliation/matching-rules/{rule_id}`. [Reference](https://docs.blnkfinance.com/reference/delete-matching-rule)

- **`Reconciliation.get(id)`** — Returns reconciliation status and counts via `GET /reconciliation/{reconciliation_id}`. [Reference](https://docs.blnkfinance.com/reference/get-reconciliations) · [Guide](https://docs.blnkfinance.com/reconciliations/overview)

- **`Reconciliation.runInstant(data)`** — Runs inline reconciliation via `POST /reconciliation/start-instant`. [Reference](https://docs.blnkfinance.com/reference/instant-reconciliation) · [Guide](https://docs.blnkfinance.com/reconciliations/overview#option-2-instant-reconciliation)

### Identity

- **`Identity.create`** — Accepts optional caller-supplied `identity_id` (`idt_` + UUID) and ISO 8601 `dob`. Validation relaxed to match Core field optionality. [Reference](https://docs.blnkfinance.com/reference/create-identity) · [Guide](https://docs.blnkfinance.com/identity/overview)

- **`Identity.getTokenizedFields(id)`** — Lists tokenized PII fields via `GET /identities/{identity_id}/tokenized-fields`. [Reference](https://docs.blnkfinance.com/reference/get-tokenized-fields)

- **`Identity.tokenizeField(id, field)`** — Tokenizes one PII field via `POST /identities/{identity_id}/tokenize/{field}`. [Reference](https://docs.blnkfinance.com/reference/tokenize-field)

- **`Identity.tokenize(id, { fields })`** — Tokenizes multiple PII fields via `POST /identities/{identity_id}/tokenize`. [Reference](https://docs.blnkfinance.com/reference/tokenize-identity) · [Guide](https://docs.blnkfinance.com/identities/pii-tokenization)

- **`Identity.detokenize(id, { fields })`** — Detokenizes PII fields via `POST /identities/{identity_id}/detokenize`. [Reference](https://docs.blnkfinance.com/reference/detokenize-identity)

- **`Identity.detokenizeField(id, field)`** — Detokenizes one field via `GET /identities/{identity_id}/detokenize/{field}`. [Reference](https://docs.blnkfinance.com/reference/detokenize-field)

### Metadata

- **`Metadata.update(id, { meta_data })`** — Adds or updates metadata on a ledger, balance, transaction, or identity via `POST /{id}/metadata`. [Reference](https://docs.blnkfinance.com/reference/update-metadata) · [Guide](https://docs.blnkfinance.com/metadata/update-metadata)

### Hooks

- **`Hooks.create(data)`** — Registers a pre- or post-transaction webhook via `POST /hooks`. [Reference](https://docs.blnkfinance.com/reference/create-hooks) · [Guide](https://docs.blnkfinance.com/hooks/create-hooks)

- **`Hooks.list({ type? })`** — Lists hooks via `GET /hooks`. [Reference](https://docs.blnkfinance.com/reference/list-hooks-by-type)

- **`Hooks.get(id)`** — Returns hook details via `GET /hooks/{id}`. [Reference](https://docs.blnkfinance.com/reference/view-hooks)

- **`Hooks.update(id, data)`** — Updates a hook via `PUT /hooks/{id}`. [Reference](https://docs.blnkfinance.com/reference/update-hooks)

- **`Hooks.delete(id)`** — Deletes a hook via `DELETE /hooks/{id}`. [Reference](https://docs.blnkfinance.com/reference/delete-hooks)

### API Keys

- **`ApiKeys.create(data)`** — Creates a scoped API key via `POST /api-keys`. [Reference](https://docs.blnkfinance.com/reference/create-api-key) · [Guide](https://docs.blnkfinance.com/advanced/secure-blnk#authentication-methods)

- **`ApiKeys.list({ owner? })`** — Lists API keys via `GET /api-keys`. [Reference](https://docs.blnkfinance.com/reference/get-api-key)

- **`ApiKeys.delete(id, { owner? })`** — Revokes an API key via `DELETE /api-keys/{id}`. [Reference](https://docs.blnkfinance.com/reference/delete-api-key)

### Client

- **Native `fetch`** — Replaces `node-fetch`; requires Node.js 18+. [Guide](https://docs.blnkfinance.com/home/install)

- **`BlnkClientOptions`** — New `retryCount` and `retryDelayMs`; default HTTP timeout is 10s. Retries apply only to idempotent `GET` requests. Exported constants: `DEFAULT_TIMEOUT_MS`, `DEFAULT_RETRY_COUNT`, `DEFAULT_RETRY_DELAY_MS`.

- **Typed API errors** — `parseBlnkApiErrorBody` exported from the package entry point for structured `error_detail` parsing.

- **Safe logging** — Request/response log metadata redacts API keys and sensitive fields.

- **Empty API key** — `X-Blnk-Key` header is omitted when the API key is an empty string.

- **204 No Content** — Shared request layer no longer attempts JSON parsing on `204`/`205` responses.

### Breaking changes since v1.1.0

**Runtime and HTTP**

- **`node-fetch` removed** — SDK uses `globalThis.fetch`. Minimum Node.js version is **18** (`engines.node` in `package.json`).
- **`fetchType` renamed to `FetchType`** — Now `typeof fetch` instead of `node-fetch` types.
- **`Blnk.getApiKey` removed** — The public getter on the client instance is no longer exposed.
- **Default timeout** — Explicit default is **10s** (`DEFAULT_TIMEOUT_MS`). Previously the client defaulted to 3s despite a comment referencing 30s.

**Search**

- **`Search.search`** — `identities` is now a valid collection. `SearchResponse` is generic per collection; the default type argument is `SearchBalanceDocument`.

**Identity**

- **`Identity.create` validation** — Only `identity_type` is required; other fields are optional and validated only when provided.
