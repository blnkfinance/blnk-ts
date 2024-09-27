import {BlnkLogger} from "../../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../../types/general";
import {CreateLedger, CreateLedgerResp} from "../../../types/ledger";
import {HandleError} from "../../utils/logger";
import {ValidateCreateLedger} from "../../utils/validators/ledgerValidators";

export class Ledgers {
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
   * @param data - The data object containing the ledger information to be created takes in a Generic type for meta_data.
   * @returns A promise that resolves with the response data upon successful creation or an error response.
   */
  async create<T extends Record<string, unknown>>(data: CreateLedger<T>) {
    try {
      const error = await ValidateCreateLedger(data);
      if (error) {
        return this.formatResponse(400, error, null);
      }
      const response = await this.request<CreateLedger<T>, CreateLedgerResp<T>>(
        `ledgers`,
        data,
        `POST`
      );

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

  async getLedger(id: string) {
    return await this.request(`ledgers/${id}`, undefined, `GET`);
  }
}
