import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {
  CreateTransactionResponse,
  CreateTransactions,
  UpdateTransactionStatus,
} from "../../types/transactions";
import {HandleError} from "../utils/logger";
import {
  ValidateCreateTransactions,
  ValidateUpdateTransactions,
} from "../utils/validators/transactionValidators";

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
   *
   * This method sends a PUT request to update the status of a transaction specified by its ID.
   * The transaction can only be updated to either `COMMIT` or `VOID` statuses.
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
}
