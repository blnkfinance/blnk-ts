import {BlnkLogger} from "../../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../../types/general";
import {CreateLedger, CreateLedgerResp} from "../../../types/ledger";
import {HandleError} from "../../utils/logger";

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
      const response = await this.request<CreateLedger<T>, CreateLedgerResp<T>>(
        `ledgers`,
        data,
        `POST`
      );

      return response;
    } catch (error: unknown) {
      this.logger.error(`${this.create.name}`, error);
      return HandleError(error, this.logger, this.formatResponse);
    }
  }

  async getLedger(id: string) {
    return await this.request(`ledgers/${id}`, undefined, `GET`);
  }
}
