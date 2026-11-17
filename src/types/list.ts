/**
 * Pagination for Core list routes (`GET /ledgers`, `GET /balances`,
 * `GET /transactions`). Sent as query parameters.
 *
 * Unset fields fall back to Core defaults: `limit=10` and `offset=0` on
 * ledgers and balances, `limit=20` and `offset=0` on transactions.
 */
export interface ListOptions {
  /** Page size, at least 1. */
  limit?: number;
  /** Rows to skip, at least 0. */
  offset?: number;
}
