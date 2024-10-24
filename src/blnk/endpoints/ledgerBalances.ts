import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {
  CreateLedgerBalance,
  CreateLedgerBalanceResp,
} from "../../types/ledgerBalances";
import {HandleError} from "../utils/logger";
import {ValidateCreateLedgerBalance} from "../utils/validators/ledgerBalance";

/**
 * Represents a class for managing ledger balances.
 * see @link https://docs.blnkfinance.com/balances/asset-classes for more details.
 *
 *
 * Provides methods to create and retrieve ledger balances.
 * @constructor
 * @param {BlnkRequest} request - The request function for API calls.
 * @param {BlnkLogger} logger - The logger for handling logs.
 * @param {FormatResponseType} formatResponse - The function for formatting API responses.
 * @example
 * const ledgerBalance = new LedgerBalances(request, logger, formatResponse);
 * const newLedger = await ledgerBalance.create(data);
 * const ledger = await ledgerBalance.get(ledgerId);
 */
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
   * Asynchronously creates a ledger balance using the provided data.
   * see @link https://docs.blnkfinance.com/balances/internal-balances for more details.
   *
   *
   * Validates the data using internal organization's validation function.
   * Handles any errors that occur during the process.
   *
   * @param data - The data object of type CreateLedgerBalance to create the ledger balance.
   * @returns A Promise that resolves to the response of creating the ledger balance.
   *
   * @example
   * const data: CreateLedgerBalance<MyMetaData> = {
   *   ledger_id: '12345',
   *   identity_id: '67890',
   *   currency: 'USD',
   *   meta_data: { key: 'value' }
   * };
   * const response = await create(data);
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
