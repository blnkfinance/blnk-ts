/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  BulkTransactionPreview,
  TransactionPreview,
} from "../../../src/types/transactions";

tap.test(`Core 0.15.3 dry-run preview types`, t => {
  t.test(`accepts a create dry-run preview`, tt => {
    const preview: TransactionPreview = {
      dry_run: true,
      would_apply: true,
      status: `APPLIED`,
      reference: `ref_card_settle_4821`,
      currency: `USD`,
      amount: 120,
      precise_amount: `12000`,
      precision: 100,
      balances: [
        {
          balance_id: `bln_source`,
          role: `source`,
          currency: `USD`,
          current_balance: `50000`,
          resulting_balance: `38000`,
        },
        {
          balance_id: `bln_dest`,
          role: `destination`,
          currency: `USD`,
          current_balance: `0`,
          resulting_balance: `12000`,
        },
      ],
    };

    tt.equal(preview.dry_run, true);
    tt.equal(preview.would_apply, true);
    tt.end();
  });

  t.test(`accepts a rejected preview`, tt => {
    const preview: TransactionPreview = {
      dry_run: true,
      would_apply: false,
      rejection: {
        code: `TXN_INSUFFICIENT_FUNDS`,
        reason: `insufficient_funds`,
        message: `insufficient funds in source balance`,
      },
      currency: `USD`,
      amount: 120,
      precise_amount: `12000`,
      precision: 100,
      balances: [],
    };

    tt.equal(preview.would_apply, false);
    tt.equal(preview.rejection?.code, `TXN_INSUFFICIENT_FUNDS`);
    tt.end();
  });

  t.test(`accepts a bulk dry-run preview`, tt => {
    const preview: BulkTransactionPreview = {
      dry_run: true,
      would_apply: true,
      cumulative: false,
      atomic: false,
      results: [],
    };

    tt.equal(preview.dry_run, true);
    tt.equal(preview.cumulative, false);
    tt.end();
  });

  t.test(`accepts a bulk inflight dry-run preview`, tt => {
    const preview: BulkTransactionPreview = {
      dry_run: true,
      would_apply: true,
      cumulative: false,
      results: [
        {
          dry_run: true,
          would_apply: true,
          operation: `commit`,
          currency: `USD`,
          amount: 50,
          precise_amount: `5000`,
          precision: 100,
          balances: [],
        },
      ],
    };

    tt.equal(preview.results[0]?.operation, `commit`);
    tt.equal(preview.cumulative, false);
    tt.end();
  });

  t.end();
});
