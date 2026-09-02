/* eslint-disable n/no-unpublished-import */
/**
 * Live Core 0.15.3 checks for the TypeScript SDK patch.
 * Requires Blnk Core at http://localhost:5001.
 */
import tap from "tap";
import {BlnkErrorCode, BlnkInit} from "../../src";
import {CreateLedgerBalance} from "../../src/types/ledgerBalances";
import {CreateTransactions} from "../../src/types/transactions";
import {
  BASE_URL,
  BLNK_API_KEY,
  GenerateRandomNumbersWithPrefix,
} from "../utils.test";

const client = BlnkInit(BLNK_API_KEY, {baseUrl: BASE_URL});

tap.test(`Core 0.15.3 SDK patch`, async t => {
  const health = await client.System.health();
  t.equal(health.status, 200);
  t.equal(health.data?.status, `UP`);

  const indicator = `@SdkTs${Date.now()}`;
  const gl = await client.LedgerBalances.create({
    ledger_id: `general_ledger_id`,
    currency: `USD`,
    indicator,
  } as CreateLedgerBalance<Record<string, never>>);
  t.equal(gl.status, 201, `GL create: ${gl.message}`);
  t.equal(gl.data?.indicator, indicator);
  t.equal(gl.data?.ledger_id, `general_ledger_id`);

  const dest = `@SdkTsDest${Date.now()}`;
  const preview = await client.Transactions.create({
    amount: 25,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`dryrun`, 8),
    description: `SDK dry-run`,
    currency: `USD`,
    source: indicator,
    destination: dest,
    allow_overdraft: true,
    dry_run: true,
  } as CreateTransactions<Record<string, never>> & {dry_run: true});

  t.equal(preview.status, 200, `dry-run status: ${preview.status}`);
  t.equal(preview.data?.dry_run, true);
  t.equal(preview.data?.would_apply, true);
  t.ok(preview.data?.balances?.length);

  const hold = await client.Transactions.create({
    amount: 30,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`hold`, 8),
    description: `SDK inflight hold`,
    currency: `USD`,
    source: indicator,
    destination: dest,
    allow_overdraft: true,
    inflight: true,
    skip_queue: true,
  });
  t.equal(hold.status, 201, `inflight create: ${hold.message}`);
  const holdId = hold.data?.transaction_id;
  t.ok(holdId);

  const commitPreview = await client.Transactions.bulkCommitInflight({
    dry_run: true,
    skip_queue: true,
    transactions: [{transaction_id: holdId as string}],
  });
  t.equal(commitPreview.status, 200, `bulk commit dry-run: ${commitPreview.message}`);
  t.equal(commitPreview.data?.dry_run, true);
  t.equal(commitPreview.data?.would_apply, true);
  t.equal(commitPreview.data?.cumulative, false);

  const afterCommitPreview = await client.Transactions.get(holdId as string);
  t.equal(afterCommitPreview.data?.status, `INFLIGHT`);

  const voidPreview = await client.Transactions.bulkVoidInflight({
    dry_run: true,
    skip_queue: true,
    transaction_ids: [holdId as string],
  });
  t.equal(voidPreview.status, 200, `bulk void dry-run: ${voidPreview.message}`);
  t.equal(voidPreview.data?.dry_run, true);
  t.equal(voidPreview.data?.would_apply, true);

  const afterVoidPreview = await client.Transactions.get(holdId as string);
  t.equal(afterVoidPreview.data?.status, `INFLIGHT`);

  const hooks = await client.Hooks.list();
  t.ok(hooks.status === 200 || hooks.status === 403, `hooks list: ${hooks.status}`);

  const negative = await client.Transactions.create({
    amount: -1,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`neg`, 8),
    description: `invalid amount`,
    currency: `USD`,
    source: indicator,
    destination: dest,
    allow_overdraft: true,
    skip_queue: true,
  });
  t.not(negative.status, 201);
  t.equal(
    negative.error?.code,
    BlnkErrorCode.TXN_VALIDATION_ERROR,
    `negative amount: ${negative.error?.code} ${negative.message}`,
  );

  const sameBalance = await client.Transactions.create({
    amount: 10,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`same`, 8),
    description: `same source dest`,
    currency: `USD`,
    source: indicator,
    destination: indicator,
    allow_overdraft: true,
    skip_queue: true,
  });
  t.not(sameBalance.status, 201);
  t.ok(sameBalance.error?.code, `same-balance code: ${sameBalance.error?.code}`);

  const duplicate = await client.LedgerBalances.create({
    ledger_id: `general_ledger_id`,
    currency: `USD`,
    indicator,
  } as CreateLedgerBalance<Record<string, never>>);
  t.equal(duplicate.status, 409);
  t.equal(duplicate.error?.code, BlnkErrorCode.GEN_CONFLICT);

  t.end();
});
