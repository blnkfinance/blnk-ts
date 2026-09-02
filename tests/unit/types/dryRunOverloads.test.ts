/* eslint-disable n/no-unpublished-import */
/**
 * Compile-time contract for `dry_run`.
 *
 * Two properties must hold together:
 *  1. Backwards compatibility — a request typed with a plain request type
 *     (no `dry_run`) still resolves to the posted response, so existing code
 *     reading `data.transaction_id` keeps compiling.
 *  2. Soundness — a preview is never typed as a posted transaction. `dry_run`
 *     is the literal `false` on the plain request types, so a preview must be
 *     requested through `DryRun<T>` (or an inline `dry_run: true`), and a
 *     runtime boolean widens the result to the posted-or-preview union.
 *
 * These assertions fail `tsc --noEmit`, not the runtime suite.
 */
import tap from "tap";
import {Transactions} from "../../../src/blnk/endpoints/transactions";
import {
  BulkCommitInflightRequest,
  BulkTransactionPreview,
  BulkTransactionResponse,
  BulkTransactions,
  BulkVoidInflightRequest,
  CreateTransactionResponse,
  CreateTransactions,
  DryRun,
  RefundTransactionRequest,
  TransactionPreview,
  UpdateTransactionStatus,
} from "../../../src/types/transactions";

type HasTransactionId<T> = T extends {transaction_id: string} ? true : false;
type HasDryRunFlag<T> = T extends {dry_run: true} ? true : false;
type Data<R> = Awaited<R> extends {data: infer D} ? NonNullable<D> : never;
function assertType<_T extends true>() {}

type Meta = Record<string, never>;

const createBody: CreateTransactions<Meta> = {
  amount: 10,
  precision: 100,
  reference: `ref_overloads`,
  description: `overload check`,
  currency: `USD`,
  source: `@Source`,
  destination: `@Dest`,
};

/**
 * Regression for the 1.4.0 review: adding `dry_run` must not turn ordinary
 * calls into a union. Each block reads a posted-only field directly, which
 * only compiles while the default request type maps to the posted response.
 */
export async function checkPostedRequestsStayPosted(
  transactions: Transactions,
): Promise<void> {
  const created = await transactions.create(createBody);
  type CreatedData = Data<typeof created>;
  assertType<HasTransactionId<CreatedData>>();
  assertType<HasDryRunFlag<CreatedData> extends true ? false : true>();
  if (created.data) {
    const id: string = created.data.transaction_id;
    void id;
  }

  const updateBody: UpdateTransactionStatus<Meta> = {status: `commit`};
  const committed = await transactions.updateStatus(`txn_1`, updateBody);
  if (committed.data) {
    const id: string = committed.data.transaction_id;
    void id;
  }

  const refundBody: RefundTransactionRequest = {skip_queue: true};
  const refunded = await transactions.refund<Meta>(`txn_1`, refundBody);
  if (refunded.data) {
    const id: string = refunded.data.transaction_id;
    void id;
  }

  const noOptionsRefund = await transactions.refund<Meta>(`txn_1`);
  if (noOptionsRefund.data) {
    const id: string = noOptionsRefund.data.transaction_id;
    void id;
  }

  const bulkBody: BulkTransactions<Meta> = {transactions: [createBody]};
  const bulk = await transactions.createBulk(bulkBody);
  if (bulk.data) {
    const batchId: string = bulk.data.batch_id;
    void batchId;
  }

  const commitBody: BulkCommitInflightRequest = {
    transactions: [{transaction_id: `txn_1`}],
  };
  const committedBulk = await transactions.bulkCommitInflight(commitBody);
  if (committedBulk.data) {
    const succeeded: number = committedBulk.data.succeeded;
    void succeeded;
  }

  const voidBody: BulkVoidInflightRequest = {transaction_ids: [`txn_1`]};
  const voidedBulk = await transactions.bulkVoidInflight(voidBody);
  if (voidedBulk.data) {
    const succeeded: number = voidedBulk.data.succeeded;
    void succeeded;
  }
}

/** A preview must never be typed as a posted transaction. */
export function checkDryRunRequestsArePreviews(
  transactions: Transactions,
): void {
  const inlineTrue = transactions.create({...createBody, dry_run: true});
  type InlineTrueData = Data<typeof inlineTrue>;
  assertType<HasDryRunFlag<InlineTrueData>>();
  assertType<HasTransactionId<InlineTrueData> extends true ? false : true>();
  assertType<InlineTrueData extends TransactionPreview ? true : false>();

  const typedDryRun: DryRun<CreateTransactions<Meta>> = {
    ...createBody,
    dry_run: true,
  };
  const fromTypedDryRun = transactions.create(typedDryRun);
  assertType<HasDryRunFlag<Data<typeof fromTypedDryRun>>>();

  const literalFalse = transactions.create({...createBody, dry_run: false});
  type LiteralFalseData = Data<typeof literalFalse>;
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
  type OmittedData = Data<typeof omitted>;
  assertType<HasTransactionId<OmittedData>>();
  assertType<HasDryRunFlag<OmittedData> extends true ? false : true>();

  const refundPreview = transactions.refund(`txn_1`, {dry_run: true});
  assertType<HasDryRunFlag<Data<typeof refundPreview>>>();

  const inflightPreview = transactions.updateStatus(`txn_1`, {
    status: `commit`,
    dry_run: true,
  });
  assertType<HasDryRunFlag<Data<typeof inflightPreview>>>();

  const bulkPreview = transactions.createBulk({
    dry_run: true,
    transactions: [createBody],
  });
  type BulkPreviewData = Data<typeof bulkPreview>;
  assertType<HasDryRunFlag<BulkPreviewData>>();
  assertType<BulkPreviewData extends BulkTransactionPreview ? true : false>();
  assertType<BulkTransactionResponse extends BulkPreviewData ? false : true>();

  const commitPreview = transactions.bulkCommitInflight({
    dry_run: true,
    transactions: [{transaction_id: `txn_1`}],
  });
  type CommitPreviewData = Data<typeof commitPreview>;
  assertType<HasDryRunFlag<CommitPreviewData>>();
  assertType<CommitPreviewData extends BulkTransactionPreview ? true : false>();

  const voidPreview = transactions.bulkVoidInflight({
    dry_run: true,
    transaction_ids: [`txn_1`],
  });
  type VoidPreviewData = Data<typeof voidPreview>;
  assertType<HasDryRunFlag<VoidPreviewData>>();
  assertType<VoidPreviewData extends BulkTransactionPreview ? true : false>();
}

/**
 * A `dry_run` value only known at runtime widens the result to the
 * posted-or-preview union, so posted-only fields require a narrow first.
 */
export async function checkRuntimeBooleanWidensToUnion(
  transactions: Transactions,
  runtimeDryRun: boolean,
): Promise<void> {
  const runtime = await transactions.create({
    ...createBody,
    dry_run: runtimeDryRun,
  });
  type RuntimeData = Data<typeof runtime>;
  assertType<
    Extract<RuntimeData, TransactionPreview> extends never ? false : true
  >();
  assertType<
    Extract<RuntimeData, {transaction_id: string}> extends never ? false : true
  >();

  if (runtime.data) {
    // @ts-expect-error a runtime dry_run must be narrowed before reading posted-only fields
    void runtime.data.transaction_id;

    if (`transaction_id` in runtime.data) {
      const id: string = runtime.data.transaction_id;
      void id;
    } else {
      const flag: true = runtime.data.dry_run;
      void flag;
    }
  }
}

/** `dry_run: true` is not assignable to the posted request types. */
export function checkDryRunIsDiscriminated(): void {
  const posted: CreateTransactions<Meta> = {
    ...createBody,
    // @ts-expect-error previews must use DryRun<CreateTransactions<T>>
    dry_run: true,
  };
  void posted;

  const previewOnly: DryRun<CreateTransactions<Meta>> = {
    ...createBody,
    dry_run: true,
  };
  void previewOnly;

  // A preview response carries no posted-transaction fields.
  assertType<
    TransactionPreview extends CreateTransactionResponse<Meta> ? false : true
  >();
}

tap.test(`dry-run overload inference on exported request types`, t => {
  t.pass(
    `posted request types stay posted; dry_run: true previews; boolean unions`,
  );
  t.end();
});
