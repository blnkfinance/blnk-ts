import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {
  CreateLedgerBalance,
  CreateLedgerBalanceResp,
} from "../../types/ledgerBalances";
import {HandleError} from "../utils/logger";
import {ValidateCreateLedgerBalance} from "../utils/validators/ledgerBalance";

export class LedgerBalances {
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
   * Asynchronously creates a ledger using the provided data.
   *
   * @param data - The data object containing the ledger information to be created takes in a Generic type `T` for meta_data.
   * @returns A promise that resolves with the response data upon successful creation or an error response.
   */
  async create<T extends Record<string, unknown>>(
    data: CreateLedgerBalance<T>
  ) {
    try {
      const error = await ValidateCreateLedgerBalance(data);
      if (error) {
        return this.formatResponse(400, error, null);
      }
      const response = await this.request<
        CreateLedgerBalance<T>,
        CreateLedgerBalanceResp<T>
      >(`balances`, data, `POST`);

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

  async get(id: string) {
    try {
      const response = await this.request(`balances/${id}`, undefined, `GET`);

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
}
