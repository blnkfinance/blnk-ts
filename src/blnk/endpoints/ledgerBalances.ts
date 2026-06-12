import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {
  BalanceLineageResponse,
  CreateBalanceSnapshotRequest,
  CreateBalanceSnapshotResponse,
  CreateLedgerBalance,
  CreateLedgerBalanceResp,
  GetBalanceAtRequest,
  GetBalanceAtResponse,
  GetBalanceRequest,
  UpdateBalanceIdentity,
  UpdateBalanceIdentityResponse,
} from "../../types/ledgerBalances";
import {HandleError} from "../utils/logger";
import {
  ValidateCreateBalanceSnapshot,
  ValidateCreateLedgerBalance,
  ValidateGetBalance,
  ValidateGetBalanceAt,
  ValidateGetByIndicator,
  ValidateUpdateBalanceIdentity,
} from "../utils/validators/ledgerBalance";

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
    formatResponse: FormatResponseType,
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
    data: CreateLedgerBalance<T>,
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
        this.create.name,
      );
    }
  }

  /**
   * Retrieves a balance by its ID.
   *
   * Pass `{ from_source: true }` to reconstruct the balance from transactions
   * instead of snapshots (`GET /balances/{balance_id}?from_source=true`).
   *
   * @see https://docs.blnkfinance.com/reference/balance-from-source
   *
   * @example
   * const response = await ledgerBalances.get(
   *   'bln_5ce86029-3c2e-4e2a-aae2-7fb931ca4c4f',
   *   { from_source: true },
   * );
   */
  async get<T extends Record<string, unknown>>(
    id: string,
    options?: GetBalanceRequest,
  ) {
    try {
      if (options !== undefined) {
        const error = ValidateGetBalance(options);
        if (error) {
          return this.formatResponse(400, error, null);
        }
      }

      let endpoint = `balances/${id}`;
      if (options?.from_source) {
        endpoint += `?from_source=true`;
      }

      const response = await this.request<
        undefined,
        CreateLedgerBalanceResp<T>
      >(endpoint, undefined, `GET`);

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
   * Retrieves a balance by its indicator and currency.
   *
   * @see https://docs.blnkfinance.com/reference/get-balance-by-indicator
   *
   * @example
   * const response = await ledgerBalances.getByIndicator('@World', 'USD');
   */
  async getByIndicator<T extends Record<string, unknown>>(
    indicator: string,
    currency: string,
  ) {
    try {
      const error = ValidateGetByIndicator(indicator, currency);
      if (error) {
        return this.formatResponse(400, error, null);
      }

      const response = await this.request<
        undefined,
        CreateLedgerBalanceResp<T>
      >(
        `balances/indicator/${encodeURIComponent(indicator)}/currency/${encodeURIComponent(currency)}`,
        undefined,
        `GET`,
      );

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.getByIndicator.name,
      );
    }
  }

  /**
   * Updates the identity linked to a balance.
   *
   * @see https://docs.blnkfinance.com/reference/update-balance-identity
   *
   * @example
   * const response = await ledgerBalances.updateIdentity(
   *   'bln_5ce86029-3c2e-4e2a-aae2-7fb931ca4c4f',
   *   { identity_id: 'idt_3b63c8da-af29-4cc3-ad38-df17d87456e6' },
   * );
   */
  async updateIdentity(balanceId: string, data: UpdateBalanceIdentity) {
    try {
      if (!balanceId) {
        return this.formatResponse(400, `balance id is required`, null);
      }

      const error = ValidateUpdateBalanceIdentity(data);
      if (error) {
        return this.formatResponse(400, error, null);
      }

      const response = await this.request<
        UpdateBalanceIdentity,
        UpdateBalanceIdentityResponse
      >(`balances/${balanceId}/identity`, data, `PUT`);

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.updateIdentity.name,
      );
    }
  }

  /**
   * Triggers daily balance snapshots in batches.
   *
   * @see https://docs.blnkfinance.com/reference/balances-snapshots
   *
   * @example
   * const response = await ledgerBalances.createSnapshot({ batch_size: 500 });
   * // response.data.message
   */
  async createSnapshot(options?: CreateBalanceSnapshotRequest) {
    try {
      if (options !== undefined) {
        const error = ValidateCreateBalanceSnapshot(options);
        if (error) {
          return this.formatResponse(400, error, null);
        }
      }

      const endpoint =
        options?.batch_size && options.batch_size > 0
          ? `balances-snapshots?batch_size=${options.batch_size}`
          : `balances-snapshots`;

      const response = await this.request<
        undefined,
        CreateBalanceSnapshotResponse
      >(endpoint, undefined, `POST`);

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.createSnapshot.name,
      );
    }
  }

  /**
   * Retrieves a balance's state at a specific point in time.
   *
   * @see https://docs.blnkfinance.com/reference/historical-balances
   *
   * @example
   * const response = await ledgerBalances.getAt(
   *   'bln_5ce86029-3c2e-4e2a-aae2-7fb931ca4c4f',
   *   { timestamp: '2025-02-24T08:55:26Z', from_source: true },
   * );
   */
  async getAt(balanceId: string, options: GetBalanceAtRequest) {
    try {
      if (!balanceId) {
        return this.formatResponse(400, `balance id is required`, null);
      }

      const error = ValidateGetBalanceAt(options);
      if (error) {
        return this.formatResponse(400, error, null);
      }

      let endpoint = `balances/${balanceId}/at?timestamp=${encodeURIComponent(options.timestamp)}`;
      if (options.from_source) {
        endpoint += `&from_source=true`;
      }

      const response = await this.request<undefined, GetBalanceAtResponse>(
        endpoint,
        undefined,
        `GET`,
      );

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.getAt.name,
      );
    }
  }

  /**
   * Retrieves fund lineage for a balance (provider breakdown when lineage is enabled).
   *
   * @see https://docs.blnkfinance.com/reference/get-balance-lineage
   *
   * @example
   * const response = await ledgerBalances.getLineage(
   *   'bln_5ce86029-3c2e-4e2a-aae2-7fb931ca4c4f',
   * );
   */
  async getLineage(balanceId: string) {
    try {
      if (!balanceId) {
        return this.formatResponse(400, `balance id is required`, null);
      }

      const response = await this.request<undefined, BalanceLineageResponse>(
        `balances/${balanceId}/lineage`,
        undefined,
        `GET`,
      );

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
}
