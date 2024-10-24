import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {CreateLedger, CreateLedgerResp} from "../../types/ledger";
import {HandleError} from "../utils/logger";
import {ValidateCreateLedger} from "../utils/validators/ledgerValidators";

/**
 * Represents a class for managing ledger operations.
 * see @link https://docs.blnkfinance.com/ledgers/money-movement-map and @link https://docs.blnkfinance.com/home/install#3-create-your-first-ledger for more details.
 *
 *
 * @constructor
 * @param {BlnkRequest} request - The request function for API calls.
 * @param {BlnkLogger} logger - The logger for handling logs.
 * @param {FormatResponseType} formatResponse - The function for formatting API responses.
 * @method create - Creates a new ledger entry.
 * @param {CreateLedger<T>} data - The data for creating the ledger.
 * @returns {Promise<ApiResponse<CreateLedgerResp<T> | null>>} The response of the create operation.
 * @method getLedger - Retrieves a ledger entry by ID.
 * @param {string} id - The ID of the ledger entry to retrieve.
 * @returns {Promise<ApiResponse<CreateLedgerResp<T> | null>>} The response of the get operation.
 * @example
 * const ledgers = new Ledgers(requestFunction, loggerInstance, formatResponseFunction);
 * const newLedger = await ledgers.create({ name: 'New Ledger' });
 * const retrievedLedger = await ledgers.get('ledger_id');
 */
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
   * Asynchronously creates a ledger using the provided data after validation.
   *
   * @param data - The data object containing the ledger information to be created.
   * @returns A promise that resolves to the response object of the created ledger.
   *
   * @example
   * const ledgerData = { name: 'Sample Ledger', meta_data: { key: 'value' } };
   * const createdLedger = await ledgers.create(ledgerData);
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

  async get<T extends Record<string, unknown>>(id: string) {
    return await this.request<undefined, CreateLedgerResp<T>>(
      `ledgers/${id}`,
      undefined,
      `GET`
    );
  }
}
