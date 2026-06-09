import {BulkTransactionResponse} from "../../src/types/transactions";

/**
 * Sample `POST /transactions/bulk` response from the Blnk Core API reference.
 * @see https://docs.blnkfinance.com/reference/bulk-transactions
 */
export const coreBulkTransactionReferenceResponse: BulkTransactionResponse = {
  batch_id: `bulk_c62f200b-905f-4983-a349-cadd279234aa`,
  status: `applied`,
  transaction_count: 4,
};

/**
 * Async bulk response when `run_async` is true.
 */
export const coreBulkTransactionAsyncReferenceResponse: BulkTransactionResponse =
  {
    batch_id: `bulk_c62f200b-905f-4983-a349-cadd279234aa`,
    status: `queued`,
    message: `Bulk transaction processing started`,
  };
