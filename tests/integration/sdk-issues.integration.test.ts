/* eslint-disable n/no-unpublished-import */
/**
 * Integration tests for SDK changes in issues #40–#46.
 * Requires Blnk Core at http://localhost:5001 (docker compose up in blnk/).
 *
 * Run: npm run test:integration
 */
import tap from "tap";
import {BlnkInit} from "../../src";
import {BlnkClientOptions} from "../../src/types/blnkClient";
import {CreateLedger} from "../../src/types/ledger";
import {CreateLedgerBalance} from "../../src/types/ledgerBalances";
import {
  BulkTransactionResponse,
  BulkTransactions,
  CreateTransactions,
} from "../../src/types/transactions";
import {BASE_URL, GenerateRandomNumbersWithPrefix, Sleep} from "../utils.test";

const clientOptions: BlnkClientOptions = {baseUrl: BASE_URL};
const client = BlnkInit(``, clientOptions);

const baseTxn = {
  precision: 100,
  currency: `USD`,
  description: `SDK integration test`,
  allow_overdraft: true,
};

async function createLedger(name: string) {
  const response = await client.Ledgers.create({name} as CreateLedger<{}>);
  tap.ok(response.status === 201, `ledger create ${name}: ${response.status}`);
  return response.data!.ledger_id;
}

async function createBalance(ledgerId: string) {
  const response = await client.LedgerBalances.create({
    currency: `USD`,
    ledger_id: ledgerId,
    meta_data: {},
  } as CreateLedgerBalance<{}>);
  tap.ok(response.status === 201, `balance create: ${response.status}`);
  return response.data!.balance_id;
}

tap.test(`SDK integration — each added capability vs Blnk Core`, async t => {
  // Issue #39 — System.health
  t.test(`#39 System.health returns UP`, async tt => {
    const response = await client.System.health();
    tt.equal(response.status, 200);
    tt.equal(response.data?.status, `UP`);
    tt.end();
  });

  // Issue #40 — Transactions.create with new Core fields
  t.test(`#40 skip_queue + effective_date`, async tt => {
    const response = await client.Transactions.create({
      ...baseTxn,
      amount: 1000,
      reference: GenerateRandomNumbersWithPrefix(`issue40-skip`, 6),
      source: `@FundingPool`,
      destination: `@Recipient`,
      skip_queue: true,
      effective_date: `2025-02-15T10:30:00Z`,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.equal(response.data?.skip_queue, true);
    tt.equal(response.data?.effective_date, `2025-02-15T10:30:00Z`);
    tt.end();
  });

  t.test(`#40 inflight_commit_date + scheduled_for`, async tt => {
    const response = await client.Transactions.create({
      ...baseTxn,
      amount: 1000,
      reference: GenerateRandomNumbersWithPrefix(`issue40-dates`, 6),
      source: `@FundingPool`,
      destination: `@Recipient`,
      inflight: true,
      inflight_expiry_date: `2026-12-31T23:59:59Z`,
      inflight_commit_date: `2024-04-22T15:28:03+00:00`,
      scheduled_for: `2025-12-31T23:59:59Z`,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.ok(response.data?.transaction_id);
    tt.end();
  });

  t.test(`#40 Transactions.createBulk serializes date fields`, async tt => {
    const response = await client.Transactions.createBulk({
      transactions: [
        {
          ...baseTxn,
          amount: 500,
          reference: GenerateRandomNumbersWithPrefix(`issue40-bulk-1`, 6),
          source: `@FundingPool`,
          destination: `@Recipient`,
          effective_date: `2025-02-15T10:30:00Z`,
          inflight_commit_date: `2025-06-01T12:00:00Z`,
        },
        {
          ...baseTxn,
          amount: 750,
          reference: GenerateRandomNumbersWithPrefix(`issue40-bulk-2`, 6),
          source: `@FundingPool`,
          destination: `@Recipient`,
          scheduled_for: `2025-07-01T08:00:00Z`,
        },
      ],
    } as BulkTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    const bulk = response.data as BulkTransactionResponse;
    tt.equal(bulk?.transaction_count, 2, `Core accepted 2 bulk transactions`);
    tt.ok(bulk?.batch_id, `batch_id returned from Core`);
    tt.type(bulk?.status, `string`, `status returned from Core`);
    tt.end();
  });

  // Issue #41 — ISO date strings + decimal distribution parity
  t.test(`#41 decimal distribution (240.23) + ISO dates`, async tt => {
    const ledgerId = await createLedger(`Issue41 Ledger`);
    const destA = await createBalance(ledgerId);
    const destB = await createBalance(ledgerId);

    const response = await client.Transactions.create({
      ...baseTxn,
      amount: 1000,
      reference: GenerateRandomNumbersWithPrefix(`issue41`, 6),
      source: `@FundingPool`,
      destinations: [
        {identifier: destA, distribution: `240.23`},
        {identifier: destB, distribution: `left`},
      ],
      effective_date: `2024-04-22T15:28:03+00:00`,
      inflight_expiry_date: `2025-08-01T08:00:00Z`,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.ok(response.data?.transaction_id);
    tt.end();
  });

  // Issue #42 — split-transaction validator parity
  t.test(`#42 multiple sources → single destination`, async tt => {
    const ledgerId = await createLedger(`Issue42 Sources`);
    const alice = await createBalance(ledgerId);
    const bob = await createBalance(ledgerId);
    const sarah = await createBalance(ledgerId);
    const destination = await createBalance(ledgerId);

    const response = await client.Transactions.create({
      ...baseTxn,
      amount: 30000,
      reference: GenerateRandomNumbersWithPrefix(`issue42-src`, 6),
      sources: [
        {identifier: alice, distribution: `10%`},
        {identifier: bob, distribution: `20000`},
        {identifier: sarah, distribution: `left`},
      ],
      destination,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.ok(response.data?.transaction_id);
    tt.end();
  });

  t.test(`#42 single source → multiple destinations`, async tt => {
    const ledgerId = await createLedger(`Issue42 Dests`);
    const alice = await createBalance(ledgerId);
    const bob = await createBalance(ledgerId);
    const charlie = await createBalance(ledgerId);
    const source = await createBalance(ledgerId);

    const response = await client.Transactions.create({
      ...baseTxn,
      amount: 30000,
      reference: GenerateRandomNumbersWithPrefix(`issue42-dest`, 6),
      source,
      destinations: [
        {identifier: alice, distribution: `10%`},
        {identifier: bob, distribution: `20000`},
        {identifier: charlie, distribution: `left`},
      ],
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.ok(response.data?.transaction_id);
    tt.end();
  });

  t.test(`#42 precise_distribution legs`, async tt => {
    const ledgerId = await createLedger(`Issue42 Precise`);
    const merchant = await createBalance(ledgerId);
    const fee = await createBalance(ledgerId);

    const response = await client.Transactions.create({
      ...baseTxn,
      amount: 10000,
      reference: GenerateRandomNumbersWithPrefix(`issue42-precise`, 6),
      source: `@FundingPool`,
      destinations: [
        {identifier: merchant, precise_distribution: `9733`},
        {identifier: fee, precise_distribution: `267`},
      ],
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.ok(response.data?.transaction_id);
    tt.end();
  });

  t.test(`#42 precise_amount-only create`, async tt => {
    const ledgerId = await createLedger(`Issue42 PreciseAmt`);
    const destination = await createBalance(ledgerId);

    const response = await client.Transactions.create({
      ...baseTxn,
      precise_amount: 75000,
      reference: GenerateRandomNumbersWithPrefix(`issue42-pamt`, 6),
      source: `@FundingPool`,
      destination,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.ok(response.data?.transaction_id);
    tt.end();
  });

  t.test(`#42 Transactions.updateStatus commit`, async tt => {
    const ledgerId = await createLedger(`Issue42 Inflight`);
    const destination = await createBalance(ledgerId);

    const createResp = await client.Transactions.create({
      ...baseTxn,
      amount: 5000,
      reference: GenerateRandomNumbersWithPrefix(`issue42-inflight`, 6),
      source: `@FundingPool`,
      destination,
      inflight: true,
      inflight_expiry_date: `2026-12-31T23:59:59Z`,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(createResp.status, 201);
    await Sleep(2);

    const commitResp = await client.Transactions.updateStatus(
      createResp.data!.transaction_id,
      {status: `commit`},
    );
    tt.equal(commitResp.status, 200);
    tt.end();
  });

  // Issue #43 — CreateTransactionResponse parity (hash, parent_transaction, inflight)
  t.test(
    `#43 create response includes hash, parent_transaction, inflight`,
    async tt => {
      const response = await client.Transactions.create({
        ...baseTxn,
        amount: 1000,
        reference: GenerateRandomNumbersWithPrefix(`issue43-resp`, 6),
        source: `@FundingPool`,
        destination: `@Recipient`,
        allow_overdraft: false,
        inflight: false,
      } as CreateTransactions<Record<string, never>>);

      tt.equal(response.status, 201);
      tt.ok(response.data?.hash, `hash present`);
      tt.equal(response.data?.hash?.length, 64, `hash is SHA-256 hex`);
      tt.type(response.data?.parent_transaction, `string`);
      tt.equal(response.data?.inflight, false);
      tt.type(response.data?.allow_overdraft, `boolean`);
      tt.equal(response.data?.scheduled_for, `0001-01-01T00:00:00Z`);
      tt.equal(response.data?.inflight_expiry_date, `0001-01-01T00:00:00Z`);
      // Core omits inflight_commit_date when inflight is false
      if (response.data?.inflight_commit_date !== undefined) {
        tt.type(response.data.inflight_commit_date, `string`);
      }
      tt.end();
    },
  );

  // Issue #43 — decimal percentage distributions with precise_amount
  t.test(`#43 decimal percentage split (33.33% / 66.67%)`, async tt => {
    const ledgerId = await createLedger(`Issue43 Ledger`);
    const destA = await createBalance(ledgerId);
    const destB = await createBalance(ledgerId);

    const response = await client.Transactions.create({
      ...baseTxn,
      precise_amount: 30000,
      reference: GenerateRandomNumbersWithPrefix(`issue43`, 6),
      source: `@FundingPool`,
      destinations: [
        {identifier: destA, distribution: `33.33%`},
        {identifier: destB, distribution: `66.67%`},
      ],
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.ok(response.data?.transaction_id);
    tt.end();
  });

  t.test(`#43 mixed decimal % + precise_distribution + left`, async tt => {
    const ledgerId = await createLedger(`Issue43 Mixed`);
    const a = await createBalance(ledgerId);
    const b = await createBalance(ledgerId);
    const c = await createBalance(ledgerId);

    const response = await client.Transactions.create({
      ...baseTxn,
      amount: 30000,
      reference: GenerateRandomNumbersWithPrefix(`issue43-mix`, 6),
      source: `@FundingPool`,
      destinations: [
        {identifier: a, distribution: `33.33%`},
        {identifier: b, precise_distribution: `5000`},
        {identifier: c, distribution: `left`},
      ],
    } as CreateTransactions<Record<string, never>>);

    tt.equal(response.status, 201);
    tt.ok(response.data?.transaction_id);
    tt.end();
  });

  // Issue #44 — BulkTransactionResponse parity + skip_queue on bulk
  t.test(
    `#44 createBulk skip_queue + BulkTransactionResponse shape`,
    async tt => {
      const response = await client.Transactions.createBulk({
        skip_queue: true,
        transactions: [
          {
            ...baseTxn,
            amount: 500,
            reference: GenerateRandomNumbersWithPrefix(`issue44-bulk-1`, 6),
            source: `@FundingPool`,
            destination: `@Recipient`,
          },
          {
            ...baseTxn,
            amount: 750,
            reference: GenerateRandomNumbersWithPrefix(`issue44-bulk-2`, 6),
            source: `@FundingPool`,
            destination: `@Recipient`,
          },
        ],
      } as BulkTransactions<Record<string, never>>);

      tt.equal(response.status, 201);
      const bulk = response.data as BulkTransactionResponse;
      tt.ok(bulk?.batch_id, `batch_id present`);
      tt.type(bulk?.status, `string`, `status present`);
      tt.equal(
        bulk?.transaction_count,
        2,
        `transaction_count matches batch size`,
      );
      tt.end();
    },
  );

  // Issue #45 — partial commit with precise_amount on updateStatus
  t.test(`#45 partial commit with precise_amount`, async tt => {
    const ledgerId = await createLedger(`Issue45 PartialCommit`);
    const destination = await createBalance(ledgerId);

    const createResp = await client.Transactions.create({
      ...baseTxn,
      amount: 1000,
      reference: GenerateRandomNumbersWithPrefix(`issue45-inflight`, 6),
      source: `@FundingPool`,
      destination,
      inflight: true,
      inflight_expiry_date: `2026-12-31T23:59:59Z`,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(createResp.status, 201);
    await Sleep(2);

    const partialCommitResp = await client.Transactions.updateStatus(
      createResp.data!.transaction_id,
      {status: `commit`, precise_amount: 50000},
    );
    tt.equal(partialCommitResp.status, 200);
    tt.equal(partialCommitResp.data?.status, `APPLIED`);
    tt.end();
  });

  // Issue #12 — get transaction by id
  t.test(`#12 get returns created transaction`, async tt => {
    const reference = GenerateRandomNumbersWithPrefix(`issue12-ref`, 6);
    const createResp = await client.Transactions.create({
      ...baseTxn,
      amount: 500,
      reference,
      source: `@FundingPool`,
      destination: `@Recipient`,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(createResp.status, 201);
    const transactionId = createResp.data!.transaction_id;
    tt.ok(transactionId);

    const getResp = await client.Transactions.get(transactionId);
    tt.equal(getResp.status, 200);
    tt.equal(getResp.data?.transaction_id, transactionId);
    tt.equal(getResp.data?.reference, reference);
    tt.equal(getResp.data?.currency, `USD`);
    tt.type(getResp.data?.amount, `number`);
    tt.end();
  });

  // Issue #14 — get transaction by reference
  t.test(`#14 getByReference returns created transaction`, async tt => {
    const reference = GenerateRandomNumbersWithPrefix(`issue14-ref`, 6);
    const createResp = await client.Transactions.create({
      ...baseTxn,
      amount: 500,
      reference,
      source: `@FundingPool`,
      destination: `@Recipient`,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(createResp.status, 201);
    tt.ok(createResp.data?.transaction_id);

    const getResp = await client.Transactions.getByReference(reference);
    tt.equal(getResp.status, 200);
    tt.equal(getResp.data?.transaction_id, createResp.data?.transaction_id);
    tt.equal(getResp.data?.reference, reference);
    tt.equal(getResp.data?.currency, `USD`);
    tt.end();
  });

  // Issue #46 — refund with optional skip_queue body
  t.test(`#46 refund queued vs synchronous skip_queue`, async tt => {
    const ledgerId = await createLedger(`Issue46 Refund`);
    const destination = await createBalance(ledgerId);

    const createResp = await client.Transactions.create({
      ...baseTxn,
      amount: 500,
      reference: GenerateRandomNumbersWithPrefix(`issue46-refund-src`, 6),
      source: `@FundingPool`,
      destination,
      skip_queue: true,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(createResp.status, 201);
    tt.equal(createResp.data?.status, `APPLIED`);
    const originalTxnId = createResp.data!.transaction_id;

    const queuedRefundResp = await client.Transactions.refund(originalTxnId);
    tt.equal(queuedRefundResp.status, 201);
    tt.ok(queuedRefundResp.data?.transaction_id);
    tt.equal(queuedRefundResp.data?.parent_transaction, originalTxnId);

    const createResp2 = await client.Transactions.create({
      ...baseTxn,
      amount: 500,
      reference: GenerateRandomNumbersWithPrefix(`issue46-refund-sync`, 6),
      source: `@FundingPool`,
      destination,
      skip_queue: true,
    } as CreateTransactions<Record<string, never>>);

    tt.equal(createResp2.status, 201);
    const originalTxnId2 = createResp2.data!.transaction_id;

    const syncRefundResp = await client.Transactions.refund(originalTxnId2, {
      skip_queue: true,
    });
    tt.equal(syncRefundResp.status, 201);
    tt.equal(syncRefundResp.data?.status, `APPLIED`);
    tt.equal(syncRefundResp.data?.parent_transaction, originalTxnId2);
    tt.end();
  });

  t.end();
});
