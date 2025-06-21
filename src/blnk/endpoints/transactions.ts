import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {
  BulkTransactionResponse,
  BulkTransactions,
  CreateTransactionResponse,
  CreateTransactions,
  UpdateTransactionStatus,
} from "../../types/transactions";
import {HandleError} from "../utils/logger";
import {
  ValidateBulkTransactions,
  ValidateCreateTransactions,
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
    formatResponse: FormatResponseType
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

      const response = await this.request<
        CreateTransactions<T>,
        CreateTransactionResponse<T>
      >(`transactions`, data, `POST`);

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
        this.create.name
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
    update: UpdateTransactionStatus<T>
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
        this.updateStatus.name
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
   * @returns A promise that resolves with the response of the refund transaction.
   * @throws If an error occurs during the refund process, an error response is returned.
   *
   * @example
   * const transactionId = "123456";
   * const refundResponse = await refund<MyMetaDataType>(transactionId);
   */
  async refund<T extends Record<string, never>>(id: string) {
    try {
      const response = await this.request<null, CreateTransactionResponse<T>>(
        `refund-transaction/${id}`,
        null,
        `POST`
      );
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.refund.name
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
   *   - transactions: Array of transaction objects to be created
   * 
   * @returns {Promise<BulkTransactionResponse<T>>} A promise that resolves to the response
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
  async createBulk<T extends Record<string, unknown>>(data: BulkTransactions<T>) {
    try {
      const validatorResponse = ValidateBulkTransactions(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const response = await this.request<
        BulkTransactions<T>,
        BulkTransactionResponse<T>
      >(`transactions/bulk`, data, `POST`);

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
        this.createBulk.name
      );
    }
  }
}
