/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {CreateLedgerBalanceResp} from "../../../src/types/ledgerBalances";
import {
  SearchBalanceDocument,
  SearchTransactionDocument,
} from "../../../src/types/search";
import {CreateTransactionResponse} from "../../../src/types/transactions";

tap.test(`Issue #122 — Core 0.15.0 dropped response fields`, t => {
  t.test(`CreateTransactionResponse accepts response without rate`, tt => {
    const response: CreateTransactionResponse<Record<string, never>> = {
      transaction_id: `txn_test_123`,
      amount: 10,
      precision: 100,
      precise_amount: 1000,
      reference: `ref_001`,
      description: `test`,
      currency: `USD`,
      status: `QUEUED`,
      hash: `0b9c25fb5b00d6c71cb4ca87026bf6dc316e63353d3330deb588bd0b3d74dcc0`,
      parent_transaction: ``,
      allow_overdraft: false,
      inflight: false,
      created_at: `2026-06-24T00:00:00Z`,
      scheduled_for: `0001-01-01T00:00:00Z`,
      inflight_expiry_date: `0001-01-01T00:00:00Z`,
      inflight_commit_date: `0001-01-01T00:00:00Z`,
    };

    tt.equal(response.rate, undefined);
    tt.end();
  });

  t.test(`CreateLedgerBalanceResp accepts response without currency_multiplier`, tt => {
    const response: CreateLedgerBalanceResp<Record<string, never>> = {
      balance: 0,
      version: 0,
      inflight_balance: 0,
      credit_balance: 0,
      inflight_credit_balance: 0,
      debit_balance: 0,
      inflight_debit_balance: 0,
      ledger_id: `ldg_test`,
      identity_id: ``,
      balance_id: `bln_test`,
      indicator: ``,
      currency: `USD`,
      created_at: `2026-06-24T00:00:00Z`,
    };

    tt.equal(response.currency_multiplier, undefined);
    tt.end();
  });

  t.test(`SearchTransactionDocument omits rate`, tt => {
    const document: SearchTransactionDocument = {
      id: `txn_test`,
      transaction_id: `txn_test`,
      status: `APPLIED`,
      created_at: 1781028226,
    };

    tt.equal(`rate` in document, false);
    tt.end();
  });

  t.test(`SearchBalanceDocument omits currency_multiplier`, tt => {
    const document: SearchBalanceDocument = {
      id: `bln_test`,
      balance_id: `bln_test`,
      balance: `0`,
      created_at: 1781222909,
    };

    tt.equal(`currency_multiplier` in document, false);
    tt.end();
  });

  t.end();
});
