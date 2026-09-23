/* eslint-disable n/no-unpublished-import */
/**
 * Live coverage of list methods against Core list routes
 * (`GET /ledgers`, `GET /balances`, `GET /transactions`,
 * `GET /balance-monitors/balances/:balance_id`). Those routes have been in
 * Core since ~0.14.x; this SDK is aligned with 0.15.4.
 * Gated on `BLNK_E2E=1`.
 *
 * Run: BLNK_E2E=1 npx tap tests/integration/listResources.integration.test.ts
 */
import tap from "tap";
import {randomUUID} from "node:crypto";
import {BlnkInit} from "../../src";
import {CreateLedger} from "../../src/types/ledger";
import {CreateLedgerBalance} from "../../src/types/ledgerBalances";
import {CreateTransactions} from "../../src/types/transactions";
import {MonitorData} from "../../src/types/balanceMonitor";
import {
  BASE_URL,
  BLNK_API_KEY,
  GenerateRandomNumbersWithPrefix,
} from "../utils.test";

const liveEnabled = process.env.BLNK_E2E === `1`;

tap.test(
  `list resources — live Core`,
  {
    skip: liveEnabled ? false : `requires BLNK_E2E=1 and a running Core`,
  },
  async t => {
    const client = BlnkInit(BLNK_API_KEY, {baseUrl: BASE_URL});
    const ledgerName = `TS List ${randomUUID()}`;

    const createdLedger = await client.Ledgers.create({
      name: ledgerName,
    } as CreateLedger<Record<string, never>>);
    t.equal(createdLedger.status, 201, createdLedger.message);
    t.ok(createdLedger.data?.ledger_id);

    const ledgers = await client.Ledgers.list({limit: 10, offset: 0});
    t.equal(ledgers.status, 200, ledgers.message);
    t.ok(Array.isArray(ledgers.data), JSON.stringify(ledgers.data));
    t.ok(
      (ledgers.data ?? []).some(
        row => row.ledger_id === createdLedger.data?.ledger_id,
      ),
      `expected created ledger in list`,
    );

    const createdBalance = await client.LedgerBalances.create({
      ledger_id: createdLedger.data!.ledger_id,
      currency: `USD`,
    } as CreateLedgerBalance<Record<string, never>>);
    t.equal(createdBalance.status, 201, createdBalance.message);
    t.ok(createdBalance.data?.balance_id);

    const balances = await client.LedgerBalances.list({limit: 10, offset: 0});
    t.equal(balances.status, 200, balances.message);
    t.ok(Array.isArray(balances.data), JSON.stringify(balances.data));
    t.ok(
      (balances.data ?? []).some(
        row => row.balance_id === createdBalance.data?.balance_id,
      ),
      `expected created balance in list`,
    );

    const funding = await client.LedgerBalances.create({
      ledger_id: createdLedger.data!.ledger_id,
      currency: `USD`,
    } as CreateLedgerBalance<Record<string, never>>);
    t.equal(funding.status, 201, funding.message);

    const txn = await client.Transactions.create({
      amount: 1,
      precision: 100,
      reference: GenerateRandomNumbersWithPrefix(`list`, 12),
      description: `list e2e`,
      currency: `USD`,
      source: funding.data!.balance_id,
      destination: createdBalance.data!.balance_id,
      skip_queue: true,
      allow_overdraft: true,
    } as CreateTransactions<Record<string, never>>);
    t.ok(txn.status === 201 || txn.status === 200, txn.message);

    const transactions = await client.Transactions.list({limit: 20, offset: 0});
    t.equal(transactions.status, 200, transactions.message);
    t.ok(Array.isArray(transactions.data), JSON.stringify(transactions.data));

    const monitor = await client.BalanceMonitor.create({
      balance_id: createdBalance.data!.balance_id,
      condition: {
        field: `debit_balance`,
        operator: `>`,
        value: 1,
        precision: 100,
      },
    } as MonitorData);
    t.equal(monitor.status, 201, monitor.message);

    const monitors = await client.BalanceMonitor.listByBalanceId(
      createdBalance.data!.balance_id,
    );
    t.equal(monitors.status, 200, monitors.message);
    t.ok(Array.isArray(monitors.data), JSON.stringify(monitors.data));
    t.ok(
      (monitors.data ?? []).some(
        row => row.monitor_id === monitor.data?.monitor_id,
      ),
      `expected created monitor in listByBalanceId`,
    );
  },
);
