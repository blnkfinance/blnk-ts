# TypeScript SDK 1.3.0 — Core 0.15.0 gap checklist

**Audit date:** 2026-06-23  
**Baseline:** `blnk-ts` @ `1.1.0` (package.json) vs `blnkfinance/blnk` Core **0.15.0**  
**Sources:** `blnk/api/api.go`, `blnk-docs/changelog/v15-migration.mdx`, `blnk-docs/changelog/blnk-core.mdx` (0.15.0)

**Target release:** SDK **1.3.0** → targets Core **0.15.0**  
**Workflow per item:** implement → unit tests → Postman folder → test on Core 0.15.0 → `blnk-ts` PR → docs (after merge, on `docs/go-ts-sdk-install`)

---

## Summary

| Category | Count | Priority |
|----------|------:|----------|
| Missing methods (0.15.0 new) | 2 | P0 |
| Type / response mismatches (0.15.0) | 6 | P0 |
| Validator gaps (0.15.0) | 3 | P0 |
| Queued inflight behavior (0.15.0) | 4 | P0 |
| Error handling / HTTP client | 2 | P0 |
| Release / docs | 4 | P1 |
| Full route parity (pre-0.15 gaps) | 11 | P2 (confirm scope with Praise) |
| Out of scope | 7 | — |

---

## P0 — Required for 1.3.0 / 0.15.0

### A. Missing methods (new in Core 0.15.0)

| # | Core route | SDK method | Status | Suggested issue title |
|---|------------|------------|--------|------------------------|
| A1 | `DELETE /identities/{id}` | `Identity.delete(id)` | 🚧 In progress | [#116](https://github.com/blnkfinance/blnk-ts/issues/116) |
| A2 | `DELETE /balance-monitors/{id}` | `BalanceMonitor.delete(id)` | 🚧 In progress | [#120](https://github.com/blnkfinance/blnk-ts/issues/120) |

**Acceptance criteria (both):**
- Method calls correct endpoint with `DELETE`
- Request/response types match [delete-identity](https://docs.blnkfinance.com/reference/delete-identity) / [delete-balance-monitor](https://docs.blnkfinance.com/reference/delete-balance-monitor)
- Client-side validation (non-empty id)
- Unit tests (endpoint + validator)
- Postman folder on Core 0.15.0
- README example

**Response shape:** `{ message: string }` with `error_detail` on errors (0.15.0).

---

### B. Type / response mismatches (0.15.0 behavior)

| # | Area | Current SDK | Core 0.15.0 | Fix |
|---|------|-------------|-------------|-----|
| B1 | `Reconciliation.run` | `RunReconResp extends Matcher` | Returns only `{ reconciliation_id }` | ✅ [#121](https://github.com/blnkfinance/blnk-ts/issues/121) |
| B2 | Transaction responses | `CreateTransactionResponse.rate` required | `rate` removed from responses | ✅ [#122](https://github.com/blnkfinance/blnk-ts/issues/122) |
| B3 | Balance responses | `LedgerBalanceResp.currency_multiplier` required | Field removed | ✅ [#122](https://github.com/blnkfinance/blnk-ts/issues/122) |
| B4 | Search hit types | `currency_multiplier?`, `rate?` on documents | Fields removed from responses | ✅ [#122](https://github.com/blnkfinance/blnk-ts/issues/122) |
| B5 | Inflight update response | No `queued` on `CreateTransactionResponse` | Default queued commit/void returns `queued: true` | ✅ [#117](https://github.com/blnkfinance/blnk-ts/issues/117) |
| B6 | Bulk inflight results | `BulkInflightResultStatus = succeeded \| failed` | Results can be `queued` when not using `skip_queue` | ✅ [#117](https://github.com/blnkfinance/blnk-ts/issues/117) |

---

### C. Validator gaps (0.15.0 limits & request fields)

| # | Validator | Current | Core 0.15.0 | Fix |
|---|-----------|---------|-------------|-----|
| C1 | `ValidateBulkTransactions` | No max length | Max **10,000** transactions | ✅ `MAX_BULK_CREATE_ITEMS = 10000` |
| C2 | `ValidateUpdateTransactions` | Rejects `skip_queue` (not in allowedFields) | `skip_queue` supported on inflight commit/void | ✅ [#117](https://github.com/blnkfinance/blnk-ts/issues/117) |
| C3 | Bulk commit/void types | No `skip_queue` on request types | Supported on bulk commit/void | ✅ [#117](https://github.com/blnkfinance/blnk-ts/issues/117) |

**Note:** Bulk commit/void max **100** items is already enforced (`MAX_BULK_INFLIGHT_ITEMS = 100`). ✅

---

### D. Queued inflight (0.15.0 default behavior)

| # | Task | Notes |
|---|------|-------|
| D1 | Document queued default in README | Commit/void/bulk inflight return queued unless `skip_queue: true` | ✅ [#117](https://github.com/blnkfinance/blnk-ts/issues/117) |
| D2 | Integration tests on Core 0.15.0 | Verify default queued response; verify `skip_queue: true` sync path | ✅ [#117](https://github.com/blnkfinance/blnk-ts/issues/117) |
| D3 | Postman folders | Add cases for queued vs sync inflight commit/void | ✅ [#117](https://github.com/blnkfinance/blnk-ts/issues/117) |
| D4 | Reconciliation webhooks note | README/changelog: use `reconciliation.completed` / `reconciliation.failed` webhooks after start |

---

### E. Error handling & HTTP client

| # | Task | Current | Fix |
|---|------|---------|-----|
| E1 | Structured `error_detail` | `parseBlnkApiErrorBody` exists; exposed on `ApiResponse.error` | ✅ Verify all error paths populate `response.error.code`; add tests for 404/409/423 status codes from migration guide |
| E2 | Empty-body success responses | `response.json()` on all 200 responses | Handle empty body on success (DELETE edge cases — see #110 pattern); add regression test |

**Do not** branch on `error` string or `NOT_FOUND:` prefix in SDK code or docs examples for 1.3.0.

---

## P1 — Release & documentation (after P0 code merges)

| # | Task | Owner branch |
|---|------|--------------|
| R1 | Bump `package.json` → **1.3.0** | `blnk-ts` |
| R2 | Update `blnk-docs/changelog/blnk-ts.mdx`: targets Core **0.15.0**, list breaking type changes | `docs/go-ts-sdk-install` |
| R3 | Update `error-handling.mdx` for `error_detail.code` (only when 1.3.0 ships) | `docs/go-ts-sdk-install` |
| R4 | Add method pages: `delete-identity`, `delete-balance-monitor` | `docs/go-ts-sdk-install` |
| R5 | Smoke test: `npm install @blnkfinance/blnk-typescript@1.3.0` + scripts against Core 0.15.0 | local |
| R6 | Coordinate npm tag / release with Jerry/Praise | — |

---

## P2 — Full route parity (pre-0.15 gaps; confirm with Praise)

These Core routes exist in `api.go` but have **no SDK method**. Not called out in the 0.15.0 migration guide; include only if Praise wants full API parity in 1.3.0.

| # | Core route | Suggested SDK method |
|---|------------|---------------------|
| P2-1 | `GET /ledgers` | `Ledgers.list()` |
| P2-2 | `POST /ledgers/filter` | `Ledgers.filter()` |
| P2-3 | `GET /balances` | `LedgerBalances.list()` |
| P2-4 | `POST /balances/filter` | `LedgerBalances.filter()` |
| P2-5 | `GET /balance-monitors/balances/:balance_id` | `BalanceMonitor.listByBalanceId()` |
| P2-6 | `GET /transactions` | `Transactions.list()` |
| P2-7 | `POST /transactions/filter` | `Transactions.filter()` |
| P2-8 | `POST /identities/filter` | `Identity.filter()` |
| P2-9 | `POST /multi-search` | `Search.multiSearch()` |

---

## Out of scope (unless explicitly requested)

| Core route | Reason |
|------------|--------|
| `POST/GET /accounts`, `POST /accounts/filter` | Accounts API not in current SDK surface |
| `GET /mocked-account` | Dev/test helper |
| `GET /backup`, `GET /backup-s3` | Operator/infra; not customer SDK |
| Transaction hash chain | Server config + CLI (`blnk verify-chain`); no SDK method needed |
| Request/upload size caps | Server-side config; document in README only |

---

## Recommended implementation order

1. **A1–A2** — Delete identity, delete balance monitor (new 0.15 endpoints)
2. **B1** — Fix `RunReconResp`
3. **B2–B4** — Remove/optional dropped response fields
4. **C1** — Bulk create 10k max
5. **C2–C3, B5–B6, D1–D3** — Queued inflight + `skip_queue` parity
6. **E1–E2** — Error handling hardening
7. **R1–R6** — Release 1.3.0 + docs pass
8. **P2-* ** — Only if Praise confirms full parity scope
9. **Go SDK** — Same audit after TS 1.3.0 ships

---

## Route coverage matrix (quick reference)

### ✅ Covered today

| Resource | SDK methods |
|----------|-------------|
| Ledgers | `create`, `get`, `update` |
| Balances | `create`, `get`, `getByIndicator`, `getAt`, `createSnapshot`, `updateIdentity`, `getLineage` |
| Balance monitors | `create`, `get`, `list`, `update` |
| Transactions | `create`, `createBulk`, `get`, `getByReference`, `getLineage`, `updateStatus`, `refund`, `bulkCommitInflight`, `bulkVoidInflight`, `recoverQueue` |
| Identities | `create`, `get`, `update`, `list`, tokenize/detokenize helpers |
| Reconciliation | `upload`, `createMatchingRule`, `updateMatchingRule`, `deleteMatchingRule`, `run`, `runInstant`, `get` |
| Search | `search`, `filter`, `startReindex`, `getReindexStatus` |
| Hooks | `create`, `list`, `get`, `update`, `delete` |
| API keys | `create`, `list`, `delete` |
| Metadata | `update` |
| System | `health` |

### ❌ Missing (P0 + P2)

See sections **A** and **P2** above.

---

## GitHub issue templates (copy-paste)

### Issue: Identity.delete

```
Title: feat(identity): add delete (Core 0.15.0)

## Summary
Add `Identity.delete(id)` for `DELETE /identities/{id}` (Core 0.15.0).

## Acceptance criteria
- [ ] Method + types match Core reference
- [ ] Validator: non-empty id
- [ ] Unit tests
- [ ] Postman folder (Core 0.15.0)
- [ ] README example

## Core reference
https://docs.blnkfinance.com/reference/delete-identity
```

### Issue: Fix RunReconResp

```
Title: fix(reconciliation): align run() response with Core 0.15.0

## Summary
`Reconciliation.run()` start response is only `{ reconciliation_id }` in 0.15.0.
Replace `RunReconResp extends Matcher` with `{ reconciliation_id: string }`.

## Acceptance criteria
- [ ] Type fix + unit tests updated
- [ ] README notes webhook flow for results
```

---

## Test environment

- **Core image:** `jerryenebeli/blnk:0.15.0`
- **Start:** `docker compose up -d` in `blnk/`
- **Health:** `http://localhost:5001/health`
- **Postman:** `blnk/postman/Blnk-SDK-Issues-Local-Core-Tests.postman_collection.json`

---

## Slack reply to Praise (suggested)

> Starting TS 1.3.0 / Core 0.15.0 gap audit. Checklist is ready: 2 new DELETE methods, reconciliation response type fix, dropped response fields, bulk 10k validator, queued inflight + skip_queue parity, and error_detail hardening. I'll turn these into GitHub issues and work through them on blnk-ts PRs. Go SDK after TS ships.
