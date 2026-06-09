/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  coreBulkTransactionAsyncReferenceResponse,
  coreBulkTransactionReferenceResponse,
} from "../../fixtures/coreBulkTransactionResponse";
import {BulkTransactionResponse} from "../../../src/types/transactions";

tap.test(`Issue #44 — BulkTransactionResponse API parity`, t => {
  t.test(`accepts Core API reference sync bulk response`, tt => {
    const response: BulkTransactionResponse =
      coreBulkTransactionReferenceResponse;

    tt.equal(response.batch_id, `bulk_c62f200b-905f-4983-a349-cadd279234aa`);
    tt.equal(response.status, `applied`);
    tt.equal(response.transaction_count, 4);
    tt.end();
  });

  t.test(`accepts Core API reference async bulk response`, tt => {
    const response: BulkTransactionResponse =
      coreBulkTransactionAsyncReferenceResponse;

    tt.equal(response.batch_id, `bulk_c62f200b-905f-4983-a349-cadd279234aa`);
    tt.equal(response.status, `queued`);
    tt.equal(response.message, `Bulk transaction processing started`);
    tt.end();
  });

  t.test(`batch_id field is present on reference response`, tt => {
    tt.ok(coreBulkTransactionReferenceResponse.batch_id);
    tt.end();
  });

  t.test(`status field is present on reference response`, tt => {
    tt.type(coreBulkTransactionReferenceResponse.status, `string`);
    tt.end();
  });

  t.test(`transaction_count is optional on async response`, tt => {
    tt.equal(
      coreBulkTransactionAsyncReferenceResponse.transaction_count,
      undefined,
    );
    tt.end();
  });

  t.test(`accepts inflight bulk status`, tt => {
    const inflightResponse: BulkTransactionResponse = {
      batch_id: `bulk_4192d961-5b0e-46ca-bf2f-9386763057f8`,
      status: `inflight`,
      transaction_count: 2,
    };

    tt.equal(inflightResponse.status, `inflight`);
    tt.equal(inflightResponse.transaction_count, 2);
    tt.end();
  });

  t.end();
});
