import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {
  BulkCommitInflightRequest,
  BulkCommitInflightResponse,
  BulkVoidInflightRequest,
  BulkVoidInflightResponse,
  BulkTransactionResponse,
  BulkTransactions,
  CreateTransactionResponse,
  CreateTransactions,
  RefundTransactionRequest,
  TransactionLineageResponse,
  UpdateTransactionStatus,
} from "../../types/transactions";
import {HandleError} from "../utils/logger";
import {serializeCreateTransaction} from "../utils/transactionSerialization";
import {
  ValidateBulkCommitInflight,
  ValidateBulkVoidInflight,
  ValidateBulkTransactions,
  ValidateCreateTransactions,
  ValidateRefundTransaction,
  ValidateUpdateTransactions,
} from "../utils/validators/transactionValidators";

/**
 * Represents a Transactions class that handles requests, logging, and response formatting.
 * see @link https://docs.blnkfinance.com/transactions/statuses
 * @constructor
 * @param {BlnkRequest} request - The function for making API requests.
 * @param {BlnkLogger} logger - The logger for logging information, errors, and optionally debug messages.
 * @param {FormatResponseType} formatResponse - The function for formatting API response data.
 * @method create - Creates a new transaction with the provided data.
 * @method createBulk - Creates multiple transactions in a single request with the provided data.
 * @method updateStatus - Updates the status of a transaction with the provided data.
 * @method bulkCommitInflight - Commits multiple inflight transactions in one request.
 * @method refund - Refunds a transaction with the provided data.
 * @example
 * const transactions = new Transactions(requestFunction, loggerInstance, formatResponseFunction);
 * const createResponse = await transactions.create(transactionData);
 * const bulkResponse = await transactions.createBulk(bulkTransactionData);
 * const updateStatusResponse = await transactions.updateStatus(updateData);
 * const refundResponse = await transactions.refund(refundData);
 */
export class Transactions {
  private request: BlnkRequest;
  private logger: BlnkLogger;
  private formatResponse: FormatResponseType;

  constructor(
    request: BlnkRequest,
    logger: BlnkLogger,
    formatResponse: FormatResponseType,
  ) {
    this.request = request;
    this.logger = logger;
    this.formatResponse = formatResponse;
  }

  /**
   * Asynchronously creates a new transaction.
   *
   * @param data - The data object containing transaction details to be created.
   * @returns A promise that resolves with the response data of the created transaction.
   * @throws An error if the creation process encounters any issues.
   *
   * @example
   * const transactionData = {
   *   amount: 100,
   *   precision: 2,
   *   reference: 'REF123',
   *   description: 'Sample transaction',
   *   currency: 'USD',
   *   inflight: true,
   *   inflight_expiry_date: new Date('2022-12-31'),
   *   meta_data: { key: 'value' }
   * };
   * const createdTransaction = await create(transactionData);
   */
  async create<T extends Record<string, unknown>>(data: CreateTransactions<T>) {
    try {
      //if data has inflight set to true, make sure inflight_expiry_date is set
      const validatorResponse = ValidateCreateTransactions(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const payload = serializeCreateTransaction(data);

      const response = await this.request<
        CreateTransactions<T>,
        CreateTransactionResponse<T>
      >(`transactions`, payload, `POST`);

      if (response.data === null) {
        // Handle the error case
        this.logger.error(`error heree`);
        return response;
      }

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.create.name,
      );
    }
  }

  /**
   * Updates the status of a transaction.
   * see @link https://docs.blnkfinance.com/transactions/statuses for more information
   *
   * This method sends a PUT request to update the status of a transaction specified by its ID.
   * The transaction can only be updated to either `commit` or `void` statuses.
   *
   * @template T - A generic type that extends a record with no properties. This type is used
   * to define the meta_data structure for the transaction.
   *
   * @param {string} id - The unique identifier of the transaction to be updated or parent id in the case of multiple transactions.
   * @param {UpdateTransactionStatus} update - An object containing the status to which
   * the transaction will be updated. The `status` property must be either `COMMIT` or `VOID`.
   * Optionally, an `amount` can be provided to specify the transaction amount.
   *
   * @returns {Promise<CreateTransactionResponse<T>>} A promise that resolves to the response
   * from the server after updating the transaction status.
   *
   * @throws {Error} Throws an error if the request fails, which will be logged using the
   * configured logger, and handled by the `HandleError` function.
   *
   *  @example
   * // Update the status of a transaction with ID '123'
   * const updateData = {
   *   status: 'commit',
   *   amount: 100,
   *   meta_data: { key: 'value' }
   * };
   * const result = await updateStatus('123', updateData);
   */
  async updateStatus<T extends Record<string, never>>(
    id: string,
    update: UpdateTransactionStatus<T>,
  ) {
    try {
      const validatorResponse = ValidateUpdateTransactions(update);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }
      const response = await this.request<
        UpdateTransactionStatus<T>,
        CreateTransactionResponse<T>
      >(`transactions/inflight/${id}`, update, `PUT`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.updateStatus.name,
      );
    }
  }

  /**
   * Sometimes, you need to refund a transaction. Blnk allows you to process a refund using the transaction_id of the original transaction.

      Refunds only happen on transactions that have been applied. This means that the participating balances have been updated with the transaction amount from the original transaction.

      When you refund a transaction, Blnk creates a new transaction record and switches the source and destination balances of the original transaction — debiting the amount from the balance that initially received it and crediting it to the balance that initially sent it..
      see @link https://docs.blnkfinance.com/transactions/refunds
   *
   * @param id - The ID of the transaction to be refunded.
   * @param options - Optional refund options (`skip_queue` for synchronous processing).
   * @returns A promise that resolves with the response of the refund transaction.
   * @throws If an error occurs during the refund process, an error response is returned.
   *
   * @example
   * const transactionId = "123456";
   * const refundResponse = await Transactions.refund(transactionId);
   * const syncRefund = await Transactions.refund(transactionId, { skip_queue: true });
   */
  async refund<T extends Record<string, never>>(
    id: string,
    options?: RefundTransactionRequest,
  ) {
    try {
      if (options !== undefined) {
        const validatorResponse = ValidateRefundTransaction(options);
        if (validatorResponse) {
          return this.formatResponse(400, validatorResponse, null);
        }
      }

      const response = await this.request<
        RefundTransactionRequest | null,
        CreateTransactionResponse<T>
      >(`refund-transaction/${id}`, options ?? null, `POST`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.refund.name,
      );
    }
  }

  /**
   * Submits multiple transaction records in a single request using the bulk transactions API.
   *
   * The bulk transactions API enables clients to submit multiple transaction records at once,
   * providing better performance and atomic transaction processing when needed.
   *
   * @template T - A generic type that extends a record with unknown properties. This type is used
   * to define the meta_data structure for the transactions.
   *
   * @param {BulkTransactions<T>} data - The bulk transaction data containing:
   *   - atomic: Optional boolean to ensure all transactions succeed or fail together
   *   - inflight: Optional boolean to create inflight transactions
   *   - run_async: Optional boolean to process transactions asynchronously
   *   - skip_queue: Optional boolean to process without queuing
   *   - transactions: Array of transaction objects to be created
   *
   * @returns {Promise<BulkTransactionResponse>} A promise that resolves to the response
   * from the server after processing the bulk transactions.
   *
   * @throws {Error} Throws an error if the request fails, which will be logged using the
   * configured logger, and handled by the `HandleError` function.
   *
   * @example
   * const bulkData = {
   *   atomic: true,
   *   inflight: true,
   *   run_async: true,
   *   transactions: [
   *     {
   *       amount: 358.90,
   *       precision: 100,
   *       reference: "unique_reference_1",
   *       description: "Transaction description",
   *       currency: "NGN",
   *       source: "@source_account",
   *       allow_overdraft: true,
   *       destination: "@destination_account"
   *     },
   *     {
   *       amount: 358.90,
   *       precision: 100,
   *       reference: "unique_reference_2",
   *       description: "Transaction description",
   *       currency: "NGN",
   *       source: "@source_account",
   *       allow_overdraft: true,
   *       destination: "@destination_account"
   *     }
   *   ]
   * };
   * const result = await createBulk(bulkData);
   */
  /**
   * Retrieves a transaction by its ID.
   *
   * @param transactionId - The unique ID of the transaction to retrieve.
   * @returns A promise that resolves with the transaction matching the ID.
   *
   * @example
   * const response = await transactions.get('txn_04551509-d7d3-4eab-a1fd-2eb12809b5a4');
   */
  async get<T extends Record<string, unknown>>(transactionId: string) {
    try {
      if (!transactionId) {
        return this.formatResponse(400, `transaction id is required`, null);
      }

      const response = await this.request<
        undefined,
        CreateTransactionResponse<T>
      >(`transactions/${transactionId}`, undefined, `GET`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.get.name,
      );
    }
  }

  /**
   * Retrieves a transaction by its reference.
   *
   * @param reference - The unique reference of the transaction to retrieve.
   * @returns A promise that resolves with the transaction matching the reference.
   *
   * @example
   * const response = await transactions.getByReference('ref_04551509-d7d3-4eab-a1fd-2eb12809b5a4');
   */
  async getByReference<T extends Record<string, unknown>>(reference: string) {
    try {
      if (!reference) {
        return this.formatResponse(400, `reference is required`, null);
      }

      const response = await this.request<
        undefined,
        CreateTransactionResponse<T>
      >(
        `transactions/reference/${encodeURIComponent(reference)}`,
        undefined,
        `GET`,
      );
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.getByReference.name,
      );
    }
  }

  /**
   * Retrieves fund lineage for a transaction (allocation and shadow transactions).
   *
   * @see https://docs.blnkfinance.com/reference/get-transaction-lineage
   *
   * @example
   * const response = await transactions.getLineage('txn_8d2ce2f0-0d75-4a91-9d43-2ad2c2e6b9ad');
   */
  async getLineage<T extends Record<string, unknown>>(transactionId: string) {
    try {
      if (!transactionId) {
        return this.formatResponse(400, `transaction id is required`, null);
      }

      const response = await this.request<
        undefined,
        TransactionLineageResponse<T>
      >(`transactions/${transactionId}/lineage`, undefined, `GET`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.getLineage.name,
      );
    }
  }

  /**
   * Commits multiple independently-created inflight transactions in one call.
   *
   * @see https://docs.blnkfinance.com/reference/bulk-commit-inflight
   *
   * @example
   * const response = await blnk.Transactions.bulkCommitInflight({
   *   transactions: [
   *     { transaction_id: 'txn_11111111-1111-4111-8111-111111111111' },
   *     { transaction_id: 'txn_22222222-2222-4222-8222-222222222222', amount: 40 },
   *   ],
   * });
   */
  async bulkCommitInflight(data: BulkCommitInflightRequest) {
    try {
      const validatorResponse = ValidateBulkCommitInflight(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const response = await this.request<
        BulkCommitInflightRequest,
        BulkCommitInflightResponse
      >(`transactions/inflight/bulk/commit`, data, `POST`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.bulkCommitInflight.name,
      );
    }
  }

  /**
   * Voids multiple independently-created inflight transactions in one call.
   *
   * @see https://docs.blnkfinance.com/reference/bulk-void-inflight
   *
   * @example
   * const response = await blnk.Transactions.bulkVoidInflight({
   *   transaction_ids: [
   *     'txn_11111111-1111-4111-8111-111111111111',
   *     'txn_22222222-2222-4222-8222-222222222222',
   *   ],
   * });
   */
  async bulkVoidInflight(data: BulkVoidInflightRequest) {
    try {
      const validatorResponse = ValidateBulkVoidInflight(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const response = await this.request<
        BulkVoidInflightRequest,
        BulkVoidInflightResponse
      >(`transactions/inflight/bulk/void`, data, `POST`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.bulkVoidInflight.name,
      );
    }
  }

  async createBulk<T extends Record<string, unknown>>(
    data: BulkTransactions<T>,
  ) {
    try {
      const validatorResponse = ValidateBulkTransactions(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const payload: BulkTransactions<T> = {
        ...data,
        transactions: data.transactions.map(serializeCreateTransaction),
      };

      const response = await this.request<
        BulkTransactions<T>,
        BulkTransactionResponse
      >(`transactions/bulk`, payload, `POST`);

      if (response.data === null) {
        // Handle the error case
        this.logger.error(`Error processing bulk transactions`);
        return response;
      }

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.createBulk.name,
      );
    }
  }
}
