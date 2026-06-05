/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  serializeCreateTransaction,
  serializeTransactionDate,
} from "../../../../src/blnk/utils/transactionSerialization";
import {CreateTransactions} from "../../../../src/types/transactions";

tap.test(`Issue #40 — transaction serialization`, t => {
  t.test(`serializes Date fields to ISO strings`, tt => {
    const effectiveDate = new Date(`2025-02-15T10:30:00.000Z`);
    const data: CreateTransactions<Record<string, never>> = {
      amount: 1000,
      precision: 100,
      reference: `ref_001`,
      description: `Backdated transaction`,
      currency: `USD`,
      source: `@FundingPool`,
      destination: `@Recipient`,
      effective_date: effectiveDate,
      inflight_commit_date: new Date(`2025-06-01T12:00:00.000Z`),
      scheduled_for: new Date(`2025-07-01T08:00:00.000Z`),
      inflight_expiry_date: new Date(`2025-08-01T08:00:00.000Z`),
    };

    const serialized = serializeCreateTransaction(data);

    tt.equal(serialized.effective_date, effectiveDate.toISOString());
    tt.equal(serialized.inflight_commit_date, `2025-06-01T12:00:00.000Z`);
    tt.equal(serialized.scheduled_for, `2025-07-01T08:00:00.000Z`);
    tt.equal(serialized.inflight_expiry_date, `2025-08-01T08:00:00.000Z`);
    tt.end();
  });

  t.test(`passes through ISO date strings unchanged`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      amount: 1000,
      precision: 100,
      reference: `ref_002`,
      description: `Backdated transaction`,
      currency: `USD`,
      source: `@FundingPool`,
      destination: `@Recipient`,
      effective_date: `2025-02-15T10:30:00Z`,
      inflight_commit_date: `2025-06-01T12:00:00Z`,
    };

    const serialized = serializeCreateTransaction(data);

    tt.equal(serialized.effective_date, `2025-02-15T10:30:00Z`);
    tt.equal(serialized.inflight_commit_date, `2025-06-01T12:00:00Z`);
    tt.end();
  });

  t.test(
    `serializeTransactionDate returns undefined for undefined input`,
    tt => {
      tt.equal(serializeTransactionDate(undefined), undefined);
      tt.end();
    },
  );

  t.end();
});
