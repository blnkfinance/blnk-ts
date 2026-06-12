/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  ValidateCreateBalanceSnapshot,
  ValidateCreateLedgerBalance,
  ValidateGetBalanceAt,
  ValidateGetByIndicator,
  ValidateUpdateBalanceIdentity,
} from "../../../../src/blnk/utils/validators/ledgerBalance";

tap.test(`Issue #8 — ValidateGetByIndicator`, t => {
  t.test(`accepts valid indicator and currency`, tt => {
    tt.equal(ValidateGetByIndicator(`@World`, `USD`), null);
    tt.end();
  });

  t.test(`rejects empty indicator`, tt => {
    tt.equal(ValidateGetByIndicator(``, `USD`), `indicator is required`);
    tt.end();
  });

  t.test(`rejects empty currency`, tt => {
    tt.equal(ValidateGetByIndicator(`@World`, ``), `currency is required`);
    tt.end();
  });

  t.end();
});

tap.test(`Issue #9 — ValidateUpdateBalanceIdentity`, t => {
  t.test(`accepts valid identity_id`, tt => {
    tt.equal(
      ValidateUpdateBalanceIdentity({
        identity_id: `idt_3b63c8da-af29-4cc3-ad38-df17d87456e6`,
      }),
      null,
    );
    tt.end();
  });

  t.test(`rejects missing identity_id`, tt => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tt.equal(
      ValidateUpdateBalanceIdentity({} as any),
      `identity_id is required`,
    );
    tt.end();
  });

  t.test(`rejects empty identity_id`, tt => {
    tt.equal(
      ValidateUpdateBalanceIdentity({identity_id: ``}),
      `identity_id is required`,
    );
    tt.end();
  });

  t.end();
});

tap.test(`Issue #10 — ValidateCreateBalanceSnapshot`, t => {
  t.test(`accepts empty options`, tt => {
    tt.equal(ValidateCreateBalanceSnapshot(undefined), null);
    tt.end();
  });

  t.test(`accepts positive batch_size`, tt => {
    tt.equal(ValidateCreateBalanceSnapshot({batch_size: 500}), null);
    tt.end();
  });

  t.test(`accepts zero batch_size`, tt => {
    tt.equal(ValidateCreateBalanceSnapshot({batch_size: 0}), null);
    tt.end();
  });

  t.test(`rejects negative batch_size`, tt => {
    tt.equal(
      ValidateCreateBalanceSnapshot({batch_size: -1}),
      `batch_size must be positive`,
    );
    tt.end();
  });

  t.end();
});

tap.test(`Issue #47 — ValidateCreateLedgerBalance lineage fields`, t => {
  t.test(`accepts track_fund_lineage and allocation_strategy`, tt => {
    tt.equal(
      ValidateCreateLedgerBalance({
        ledger_id: `ldg_123`,
        currency: `USD`,
        identity_id: `idt_123`,
        track_fund_lineage: true,
        allocation_strategy: `LIFO`,
      }),
      null,
    );
    tt.end();
  });

  t.test(`accepts request without lineage fields`, tt => {
    tt.equal(
      ValidateCreateLedgerBalance({
        ledger_id: `ldg_123`,
        currency: `USD`,
      }),
      null,
    );
    tt.end();
  });

  t.test(`rejects non-boolean track_fund_lineage`, tt => {
    tt.equal(
      ValidateCreateLedgerBalance({
        ledger_id: `ldg_123`,
        currency: `USD`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        track_fund_lineage: `true` as any,
      }),
      `track_fund_lineage must be a boolean if provided`,
    );
    tt.end();
  });

  t.test(`rejects invalid allocation_strategy`, tt => {
    tt.equal(
      ValidateCreateLedgerBalance({
        ledger_id: `ldg_123`,
        currency: `USD`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allocation_strategy: `INVALID` as any,
      }),
      `allocation_strategy must be one of FIFO, LIFO, or PROPORTIONAL`,
    );
    tt.end();
  });

  t.end();
});

tap.test(`Issue #11 — ValidateGetBalanceAt`, t => {
  t.test(`accepts valid timestamp`, tt => {
    tt.equal(ValidateGetBalanceAt({timestamp: `2025-02-24T08:55:26Z`}), null);
    tt.end();
  });

  t.test(`accepts from_source flag`, tt => {
    tt.equal(
      ValidateGetBalanceAt({
        timestamp: `2025-02-24T08:55:26Z`,
        from_source: true,
      }),
      null,
    );
    tt.end();
  });

  t.test(`rejects empty timestamp`, tt => {
    tt.equal(ValidateGetBalanceAt({timestamp: ``}), `timestamp is required`);
    tt.end();
  });

  t.end();
});
