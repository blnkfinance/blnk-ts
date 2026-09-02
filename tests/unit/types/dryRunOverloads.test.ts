/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Transactions} from "../../../src/blnk/endpoints/transactions";
import {
  BulkCommitInflightRequest,
  BulkCommitInflightResponse,
  BulkTransactionPreview,
  BulkTransactionResponse,
  BulkTransactions,
  BulkVoidInflightRequest,
  BulkVoidInflightResponse,
  CreateTransactions,
  RefundTransactionRequest,
  TransactionPreview,
  UpdateTransactionStatus,
} from "../../../src/types/transactions";

type HasTransactionId<T> = T extends {transaction_id: string} ? true : false;
type HasDryRunFlag<T> = T extends {dry_run: true} ? true : false;
function assertType<_T extends true>() {}

const createBody: CreateTransactions<Record<string, never>> = {
  amount: 10,
  precision: 100,
  reference: `ref_overloads`,
  description: `overload check`,
  currency: `USD`,
  source: `@Source`,
  destination: `@Dest`,
};

/** Compile-time only. Not invoked at runtime. */
export function checkDryRunOverloads(
  transactions: Transactions,
  runtimeDryRun: boolean,
): void {
  const literalTrue = transactions.create({
    ...createBody,
    dry_run: true,
  });
  type LiteralTrueData = NonNullable<Awaited<typeof literalTrue>[`data`]>;
  assertType<HasDryRunFlag<LiteralTrueData>>();
  assertType<HasTransactionId<LiteralTrueData> extends true ? false : true>();

  const literalFalse = transactions.create({
    ...createBody,
    dry_run: false,
  });
  type LiteralFalseData = NonNullable<Awaited<typeof literalFalse>[`data`]>;
  assertType<HasTransactionId<LiteralFalseData>>();
  assertType<HasDryRunFlag<LiteralFalseData> extends true ? false : true>();

  const omitted = transactions.create({
    amount: 10,
    precision: 100,
    reference: `ref_omitted`,
    description: `overload check`,
    currency: `USD`,
    source: `@Source`,
    destination: `@Dest`,
  });
  type OmittedData = NonNullable<Awaited<typeof omitted>[`data`]>;
  assertType<HasTransactionId<OmittedData>>();
  assertType<HasDryRunFlag<OmittedData> extends true ? false : true>();

  const runtime = transactions.create({
    amount: 10,
    precision: 100,
    reference: `ref_runtime`,
    description: `overload check`,
    currency: `USD`,
    source: `@Source`,
    destination: `@Dest`,
    dry_run: runtimeDryRun,
  });
  type RuntimeData = NonNullable<Awaited<typeof runtime>[`data`]>;
  assertType<Extract<RuntimeData, {dry_run: true}> extends never ? false : true>();
  assertType<
    Extract<RuntimeData, {transaction_id: string}> extends never ? false : true
  >();

  const exported: CreateTransactions<Record<string, never>> = {
    ...createBody,
    dry_run: true,
  };
  const fromExported = transactions.create(exported);
  type ExportedData = NonNullable<Awaited<typeof fromExported>[`data`]>;
  assertType<
    Extract<ExportedData, {dry_run: true}> extends never ? false : true
  >();
  assertType<
    Extract<ExportedData, {transaction_id: string}> extends never ? false : true
  >();

  const refundTrue = transactions.refund(`txn_1`, {
    dry_run: true,
  } satisfies RefundTransactionRequest);
  type RefundTrueData = NonNullable<Awaited<typeof refundTrue>[`data`]>;
  assertType<HasDryRunFlag<RefundTrueData>>();

  const inflightTrue = transactions.updateStatus(`txn_1`, {
    status: `commit`,
    dry_run: true,
  } satisfies UpdateTransactionStatus<Record<string, never>>);
  type InflightTrueData = NonNullable<Awaited<typeof inflightTrue>[`data`]>;
  assertType<HasDryRunFlag<InflightTrueData>>();

  const bulkTrue = transactions.createBulk({
    dry_run: true,
    transactions: [createBody],
  } satisfies BulkTransactions<Record<string, never>>);
  type BulkTrueData = NonNullable<Awaited<typeof bulkTrue>[`data`]>;
  assertType<HasDryRunFlag<BulkTrueData>>();
  assertType<
    BulkTrueData extends BulkTransactionPreview
      ? true
      : BulkTrueData extends BulkTransactionResponse
        ? false
        : false
  >();

  const commitTrue = transactions.bulkCommitInflight({
    dry_run: true,
    transactions: [{transaction_id: `txn_1`}],
  } satisfies BulkCommitInflightRequest);
  type CommitTrueData = NonNullable<Awaited<typeof commitTrue>[`data`]>;
  assertType<HasDryRunFlag<CommitTrueData>>();
  assertType<
    CommitTrueData extends BulkTransactionPreview
      ? BulkCommitInflightResponse extends CommitTrueData
        ? false
        : true
      : false
  >();

  const voidTrue = transactions.bulkVoidInflight({
    dry_run: true,
    transaction_ids: [`txn_1`],
  } satisfies BulkVoidInflightRequest);
  type VoidTrueData = NonNullable<Awaited<typeof voidTrue>[`data`]>;
  assertType<HasDryRunFlag<VoidTrueData>>();
  assertType<
    VoidTrueData extends BulkTransactionPreview
      ? BulkVoidInflightResponse extends VoidTrueData
        ? false
        : true
      : false
  >();
}

tap.test(`dry-run overload inference on exported request types`, t => {
  t.pass(`literal true is preview; omitted/false is posted; boolean is union`);
  t.end();
});
