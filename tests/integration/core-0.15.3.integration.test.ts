/* eslint-disable n/no-unpublished-import */
/**
 * Live Core 0.15.3 checks for the TypeScript SDK patch.
 * Requires Blnk Core at http://localhost:5001.
 */
import tap from "tap";
import {BlnkErrorCode, BlnkInit} from "../../src";
import {CreateLedgerBalance} from "../../src/types/ledgerBalances";
import {
  BulkTransactions,
  CreateTransactions,
  DryRun,
  RefundTransactionRequest,
  UpdateTransactionStatus,
} from "../../src/types/transactions";
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
  const glBody: CreateLedgerBalance<Record<string, never>> = {
    ledger_id: `general_ledger_id`,
    currency: `USD`,
    indicator,
  };
  const gl = await client.LedgerBalances.create(glBody);
  t.equal(gl.status, 201, `GL create: ${gl.message}`);
  t.equal(gl.data?.indicator, indicator);
  t.equal(gl.data?.ledger_id, `general_ledger_id`);

  const dest = `@SdkTsDest${Date.now()}`;
  const createPreviewBody: DryRun<CreateTransactions<Record<string, never>>> = {
    amount: 25,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`dryrun`, 8),
    description: `SDK dry-run`,
    currency: `USD`,
    source: indicator,
    destination: dest,
    allow_overdraft: true,
    dry_run: true,
  };
  const preview = await client.Transactions.create(createPreviewBody);
  t.equal(preview.status, 200, `dry-run status: ${preview.status}`);
  t.equal(preview.data?.dry_run, true);
  t.equal(preview.data?.would_apply, true);
  t.ok(preview.data?.balances.length);
  t.equal(preview.data !== null && `transaction_id` in preview.data, false);

  const bulkPreviewBody: DryRun<BulkTransactions<Record<string, never>>> = {
    dry_run: true,
    transactions: [
      {
        amount: 10,
        precision: 100,
        reference: GenerateRandomNumbersWithPrefix(`bulk-a`, 8),
        description: `bulk preview 1`,
        currency: `USD`,
        source: indicator,
        destination: dest,
        allow_overdraft: true,
      },
      {
        amount: 15,
        precision: 100,
        reference: GenerateRandomNumbersWithPrefix(`bulk-b`, 8),
        description: `bulk preview 2`,
        currency: `USD`,
        source: indicator,
        destination: dest,
        allow_overdraft: true,
      },
    ],
  };
  const bulkPreview = await client.Transactions.createBulk(bulkPreviewBody);
  t.equal(bulkPreview.status, 200, `bulk dry-run: ${bulkPreview.message}`);
  t.equal(bulkPreview.data?.dry_run, true);
  t.equal(bulkPreview.data?.would_apply, true);

  const postedBody: CreateTransactions<Record<string, never>> = {
    amount: 20,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`posted`, 8),
    description: `SDK posted for refund`,
    currency: `USD`,
    source: indicator,
    destination: dest,
    allow_overdraft: true,
    skip_queue: true,
  };
  const posted = await client.Transactions.create(postedBody);
  t.equal(posted.status, 201, `posted create: ${posted.message}`);
  // A body typed as `CreateTransactions` keeps the posted response type, so
  // `transaction_id` stays directly readable without narrowing.
  const postedId = posted.data?.transaction_id;
  t.ok(postedId);

  const refundPreviewBody: DryRun<RefundTransactionRequest> = {dry_run: true};
  const refundPreview = await client.Transactions.refund(
    postedId as string,
    refundPreviewBody,
  );
  t.equal(
    refundPreview.status,
    200,
    `refund dry-run: ${refundPreview.message}`,
  );
  t.equal(refundPreview.data?.dry_run, true);

  const holdBody: CreateTransactions<Record<string, never>> = {
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
  };
  const hold = await client.Transactions.create(holdBody);
  t.equal(hold.status, 201, `inflight create: ${hold.message}`);
  const holdId = hold.data?.transaction_id;
  t.ok(holdId);

  const inflightPreviewBody: DryRun<
    UpdateTransactionStatus<Record<string, never>>
  > = {
    status: `commit`,
    dry_run: true,
  };
  const inflightPreview = await client.Transactions.updateStatus(
    holdId as string,
    inflightPreviewBody,
  );
  t.equal(
    inflightPreview.status,
    200,
    `inflight dry-run: ${inflightPreview.message}`,
  );
  t.equal(inflightPreview.data?.dry_run, true);
  t.equal(inflightPreview.data?.operation, `commit`);

  const afterInflightPreview = await client.Transactions.get(holdId as string);
  t.equal(afterInflightPreview.data?.status, `INFLIGHT`);

  const commitPreview = await client.Transactions.bulkCommitInflight({
    dry_run: true,
    skip_queue: true,
    transactions: [{transaction_id: holdId as string}],
  });
  t.equal(
    commitPreview.status,
    200,
    `bulk commit dry-run: ${commitPreview.message}`,
  );
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

  const afterVoidPreview = await client.Transactions.get(holdId as string);
  t.equal(afterVoidPreview.data?.status, `INFLIGHT`);

  const hooks = await client.Hooks.list();
  t.ok(
    hooks.status === 200 || hooks.status === 403,
    `hooks list: ${hooks.status}`,
  );

  const negativeBody: CreateTransactions<Record<string, never>> = {
    amount: -1,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`neg`, 8),
    description: `invalid amount`,
    currency: `USD`,
    source: indicator,
    destination: dest,
    allow_overdraft: true,
    skip_queue: true,
  };
  const negative = await client.Transactions.create(negativeBody);
  t.not(negative.status, 201);
  t.equal(
    negative.error?.code,
    BlnkErrorCode.TXN_VALIDATION_ERROR,
    `negative amount: ${negative.error?.code} ${negative.message}`,
  );

  const sameBalanceBody: CreateTransactions<Record<string, never>> = {
    amount: 10,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`same`, 8),
    description: `same source dest`,
    currency: `USD`,
    source: indicator,
    destination: indicator,
    allow_overdraft: true,
    skip_queue: true,
  };
  const sameBalance = await client.Transactions.create(sameBalanceBody);
  t.not(sameBalance.status, 201);
  t.ok(
    sameBalance.error?.code,
    `same-balance code: ${sameBalance.error?.code}`,
  );

  const duplicate = await client.LedgerBalances.create(glBody);
  t.equal(duplicate.status, 409);
  t.equal(duplicate.error?.code, BlnkErrorCode.GEN_CONFLICT);

  t.end();
});
