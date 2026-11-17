/* eslint-disable n/no-unpublished-import */
/**
 * Live Core 0.15.9 checks for the SDK alignment in this release: monitor
 * `trigger` and partial update, balance `include`, inflight `reference`,
 * `overdraft_limit` and fractional monitor thresholds. These prove the
 * contract against a real server, not a recorder.
 *
 * Gated on `BLNK_E2E=1`. Point it at a Core 0.15.9+ server with
 * `BLNK_BASE_URL` and `BLNK_API_KEY` (the server's `secret_key`).
 *
 * Run:
 *   BLNK_E2E=1 BLNK_BASE_URL=http://localhost:5001/ BLNK_API_KEY=... \
 *     npx tap tests/integration/core-0.15.9.integration.test.ts --disable-coverage
 */
import tap, {Test} from "tap";
import {randomUUID} from "node:crypto";
import {BlnkErrorCode, BlnkInit} from "../../src";
import {CreateLedgerBalance} from "../../src/types/ledgerBalances";
import {MonitorDataResp} from "../../src/types/balanceMonitor";
import {CreateTransactions} from "../../src/types/transactions";
import {BASE_URL, BLNK_API_KEY, postedTransaction} from "../utils.test";

const liveEnabled = process.env.BLNK_E2E === `1`;
const skip = liveEnabled ? false : `requires BLNK_E2E=1 and a running Core`;

const client = BlnkInit(process.env.BLNK_API_KEY ?? BLNK_API_KEY, {
  baseUrl: process.env.BLNK_BASE_URL ?? BASE_URL,
  retryCount: 0,
});

const suffix = () => randomUUID().replace(/-/g, ``).slice(0, 12);

async function createGlBalance(prefix: string): Promise<string> {
  const body: CreateLedgerBalance<Record<string, never>> = {
    ledger_id: `general_ledger_id`,
    currency: `USD`,
    indicator: `@${prefix}${suffix()}`,
  };
  const res = await client.LedgerBalances.create(body);
  if (res.status !== 201 || !res.data) {
    throw new Error(`balance create failed: ${res.status} ${res.message}`);
  }
  return res.data.balance_id;
}

async function getMonitor(id: string): Promise<MonitorDataResp> {
  const res = await client.BalanceMonitor.get(id);
  if (res.status !== 200 || !res.data) {
    throw new Error(`monitor get failed: ${res.status} ${res.message}`);
  }
  return res.data;
}

/** The fixture's threshold: balance > 100.00 at precision 100. */
function assertOriginalCondition(t: Test, m: MonitorDataResp) {
  t.equal(m.condition.field, `balance`);
  t.equal(m.condition.operator, `>`);
  t.equal(m.condition.value, 100);
  t.equal(m.condition.precision, 100);
  t.equal(Number(m.condition.precise_value), 10000);
}

tap.test(
  `Core 0.15.9: monitor partial update keeps omitted fields`,
  {skip},
  async t => {
    const balanceId = await createGlBalance(`SdkTsMon`);
    const created = await client.BalanceMonitor.create({
      balance_id: balanceId,
      description: `original`,
      trigger: `level`,
      condition: {field: `balance`, operator: `>`, value: 100, precision: 100},
    });
    t.equal(created.status, 201, created.message);
    const monitorId = created.data!.monitor_id;

    const fresh = await getMonitor(monitorId);
    t.equal(fresh.trigger, `level`, `create stores the trigger`);
    assertOriginalCondition(t, fresh);

    t.test(
      `description only keeps condition, trigger and balance`,
      async tt => {
        const res = await client.BalanceMonitor.updatePartial(monitorId, {
          description: `renamed`,
        });
        tt.equal(res.status, 200, res.message);
        tt.notOk(res.data?.precision_unchanged);

        const m = await getMonitor(monitorId);
        tt.equal(m.description, `renamed`);
        tt.equal(m.balance_id, balanceId);
        tt.equal(m.trigger, `level`);
        assertOriginalCondition(tt, m);
      },
    );

    t.test(`trigger only keeps the condition`, async tt => {
      const res = await client.BalanceMonitor.updatePartial(monitorId, {
        trigger: `edge`,
      });
      tt.equal(res.status, 200, res.message);

      const m = await getMonitor(monitorId);
      tt.equal(m.trigger, `edge`);
      tt.equal(m.description, `renamed`);
      assertOriginalCondition(tt, m);
    });

    t.test(`precision only is ignored and reported`, async tt => {
      const res = await client.BalanceMonitor.updatePartial(monitorId, {
        condition: {precision: 1000},
      });
      tt.equal(res.status, 200, res.message);
      tt.equal(res.data?.precision_unchanged, true);
      assertOriginalCondition(tt, await getMonitor(monitorId));
    });

    t.test(
      `value only moves the threshold, keeps field and operator`,
      async tt => {
        const res = await client.BalanceMonitor.updatePartial(monitorId, {
          condition: {value: 250},
        });
        tt.equal(res.status, 200, res.message);

        const m = await getMonitor(monitorId);
        tt.equal(m.condition.field, `balance`);
        tt.equal(m.condition.operator, `>`);
        tt.equal(m.condition.value, 250);
        tt.equal(m.condition.precision, 100);
        tt.equal(Number(m.condition.precise_value), 25000);
      },
    );

    t.test(`value 0 sets the threshold to zero`, async tt => {
      const res = await client.BalanceMonitor.updatePartial(monitorId, {
        condition: {value: 0},
      });
      tt.equal(res.status, 200, res.message);

      const m = await getMonitor(monitorId);
      tt.equal(m.condition.field, `balance`);
      tt.equal(m.condition.operator, `>`);
      tt.equal(m.condition.value, 0);
      tt.equal(m.condition.precision, 100);
      tt.equal(Number(m.condition.precise_value), 0);
      tt.equal(m.description, `renamed`);
    });

    t.test(`empty description clears it`, async tt => {
      const res = await client.BalanceMonitor.updatePartial(monitorId, {
        description: ``,
      });
      tt.equal(res.status, 200, res.message);
      tt.notOk((await getMonitor(monitorId)).description);
    });
  },
);

tap.test(`Core 0.15.9: fractional monitor threshold`, {skip}, async t => {
  const balanceId = await createGlBalance(`SdkTsFrac`);
  const created = await client.BalanceMonitor.create({
    balance_id: balanceId,
    condition: {field: `balance`, operator: `<`, value: 100.5, precision: 100},
  });
  t.equal(created.status, 201, created.message);
  const monitorId = created.data!.monitor_id;

  let m = await getMonitor(monitorId);
  t.equal(m.condition.value, 100.5);
  t.equal(Number(m.condition.precise_value), 10050);

  const res = await client.BalanceMonitor.updatePartial(monitorId, {
    condition: {value: 99.99},
  });
  t.equal(res.status, 200, res.message);
  m = await getMonitor(monitorId);
  t.equal(m.condition.value, 99.99);
  t.equal(Number(m.condition.precise_value), 9999);

  const list = await client.BalanceMonitor.listByBalanceId(balanceId);
  t.equal(list.status, 200, list.message);
  t.equal(list.data?.length, 1);
  t.equal(list.data?.[0].condition.value, 99.99);
});

tap.test(`Core 0.15.9: balance include and from_source`, {skip}, async t => {
  const s = suffix();
  const ledger = await client.Ledgers.create({name: `sdk-ts-include-${s}`});
  t.equal(ledger.status, 201, ledger.message);
  const identity = await client.Identity.create({
    identity_type: `individual`,
    first_name: `Include`,
    last_name: `Test`,
    email_address: `include-${s}@example.com`,
  });
  t.equal(identity.status, 201, identity.message);
  const balance = await client.LedgerBalances.create({
    ledger_id: ledger.data!.ledger_id,
    identity_id: identity.data!.identity_id,
    currency: `USD`,
  });
  t.equal(balance.status, 201, balance.message);
  const balanceId = balance.data!.balance_id;

  const plain = await client.LedgerBalances.get(balanceId);
  t.equal(plain.status, 200, plain.message);
  t.notOk(plain.data?.identity, `no identity without include`);
  t.notOk(plain.data?.ledger, `no ledger without include`);

  const full = await client.LedgerBalances.get(balanceId, {
    include: [`identity`, `ledger`],
  });
  t.equal(full.status, 200, full.message);
  t.equal(full.data?.ledger?.name, `sdk-ts-include-${s}`);
  t.equal(full.data?.identity?.first_name, `Include`);
  t.equal(full.data?.identity?.identity_id, identity.data!.identity_id);

  const fromSource = await client.LedgerBalances.get(balanceId, {
    from_source: true,
  });
  t.equal(fromSource.status, 200, `from_source is still accepted`);
  t.equal(fromSource.data?.balance_id, balanceId);
});

tap.test(`Core 0.15.9: inflight reference is idempotent`, {skip}, async t => {
  const hold = await client.Transactions.create({
    amount: 50,
    precision: 100,
    currency: `USD`,
    reference: `inf-${suffix()}`,
    description: `SDK inflight reference`,
    source: `@SdkTsInfSrc${suffix()}`,
    destination: `@SdkTsInfDst${suffix()}`,
    allow_overdraft: true,
    inflight: true,
    skip_queue: true,
  });
  t.equal(hold.status, 201, hold.message);
  const holdTxn = postedTransaction(hold.data);
  t.equal(holdTxn.status, `INFLIGHT`);

  const reference = `settle-${suffix()}`;
  const first = await client.Transactions.updateStatus(holdTxn.transaction_id, {
    status: `commit`,
    amount: 10,
    reference,
    skip_queue: true,
  });
  t.equal(first.status, 200, first.message);
  const firstTxn = postedTransaction(first.data);
  t.equal(firstTxn.status, `APPLIED`);

  const replay = await client.Transactions.updateStatus(
    holdTxn.transaction_id,
    {status: `commit`, amount: 10, reference, skip_queue: true},
  );
  t.equal(replay.status, 200, `same reference and amount replays`);
  t.equal(
    postedTransaction(replay.data).transaction_id,
    firstTxn.transaction_id,
    `the replay returns the original commit`,
  );

  const conflict = await client.Transactions.updateStatus(
    holdTxn.transaction_id,
    {status: `commit`, amount: 20, reference, skip_queue: true},
  );
  t.equal(conflict.status, 409, conflict.message);
  t.equal(conflict.error?.code, BlnkErrorCode.TXN_DUPLICATE_REFERENCE);
});

tap.test(`Core 0.15.9: overdraft_limit is in major units`, {skip}, async t => {
  const source = `@SdkTsOdSrc${suffix()}`;
  const post = (amount: number) => {
    const body: CreateTransactions<Record<string, never>> = {
      amount,
      precision: 100,
      currency: `USD`,
      reference: `od-${suffix()}`,
      description: `SDK overdraft limit`,
      source,
      destination: `@SdkTsOdDst${suffix()}`,
      allow_overdraft: true,
      overdraft_limit: 5, // $5.00
      skip_queue: true,
    };
    return client.Transactions.create(body);
  };

  const within = await post(3);
  t.equal(within.status, 201, within.message);
  const withinTxn = postedTransaction(within.data);
  t.equal(withinTxn.status, `APPLIED`, `-$3.00 is within a $5.00 limit`);
  t.equal(withinTxn.overdraft_limit, 5, `the response echoes overdraft_limit`);

  const beyond = await post(3);
  if (beyond.status === 201) {
    t.equal(
      postedTransaction(beyond.data).status,
      `REJECTED`,
      `-$6.00 exceeds a $5.00 limit`,
    );
  } else {
    t.ok(beyond.status >= 400, `-$6.00 exceeds a $5.00 limit`);
  }

  const balance = await client.LedgerBalances.getByIndicator(source, `USD`);
  t.equal(balance.status, 200, balance.message);
  t.equal(
    Number(balance.data?.balance),
    -300,
    `only the first post moved the balance`,
  );
});
