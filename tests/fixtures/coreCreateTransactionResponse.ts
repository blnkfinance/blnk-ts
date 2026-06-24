import {CreateTransactionResponse} from "../../src/types/transactions";

/**
 * Sample `POST /transactions` response from the Blnk Core API reference.
 * @see https://docs.blnkfinance.com/reference/create-transaction
 */
export const coreCreateTransactionReferenceResponse: CreateTransactionResponse<
  Record<string, never>
> = {
  amount: 1250.34,
  precision: 100,
  precise_amount: 125034,
  transaction_id: `txn_c4e70eb8-e4d6-4e04-a2e2-92a43b969e0c`,
  parent_transaction: ``,
  source: `bln_f344b673-e855-4bda-b769-3e94a02c1941`,
  destination: `bln_d5cbde84-d20a-485b-8ce8-6677d782c3a1`,
  reference: `ref_2ye281ewiu-1e17-dh17-eh18728hd245`,
  currency: `USD`,
  description: `Card payment on Stripe`,
  status: `QUEUED`,
  hash: `0b9c25fb5b00d6c71cb4ca87026bf6dc316e63353d3330deb588bd0b3d74dcc0`,
  allow_overdraft: false,
  inflight: false,
  created_at: `2024-11-26T09:33:35.265582042Z`,
  scheduled_for: `0001-01-01T00:00:00Z`,
  inflight_expiry_date: `0001-01-01T00:00:00Z`,
  inflight_commit_date: `0001-01-01T00:00:00Z`,
};
