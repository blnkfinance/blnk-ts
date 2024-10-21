import {BlnkClientOptions, BlnkLogger, fetchType} from "../../types/blnkClient";
import {
  ApiResponse,
  FormatResponseType,
  ServiceInstances,
  ServicesMap,
} from "../../types/general";
import {HandleError} from "../utils/logger";
import {BalanceMonitor} from "./balanceMonitors";
import {Identity} from "./identity";
import {LedgerBalances} from "./ledgerBalances";
import {Ledgers} from "./ledgers";
import {Reconciliation} from "./reconciliation";
import {Search} from "./search";
import {Transactions} from "./transactions";
import FormData from "form-data";

/**
 * Blnk class for interacting with the Blnk API services.
 *
 * Makes requests to specified endpoints using provided data and methods.
 * Caches initialized services for efficient usage.
 *
 * @example
 * const services = {
      Ledgers,
      LedgerBalances,
      Transactions,
      BalanceMonitor,
      Reconciliation,
      Search,
      Identity,
    }
 * const blnk = new Blnk(apiKey, options, services, formatResponse, thirdPartyRequest);
 * const ledgersService = blnk.Ledgers;
 * const ledgersData = await ledgersService.getLedgersData();
 */
export class Blnk {
  private apiKey: string;
  private options: Omit<BlnkClientOptions, `logger`>;
  private logger: BlnkLogger;
  private services: ServicesMap;
  private serviceInstances: ServiceInstances = {}; // Cache initialized services
  private formatResponse: FormatResponseType;
  private thirdPartyRequest: fetchType;

  constructor(
    apiKey: string,
    options: BlnkClientOptions,
    services: ServicesMap,
    formatResponse: FormatResponseType,
    thirdPartyRequest: fetchType
  ) {
    if (!options.baseUrl) {
      throw new Error(`baseUrl is required for self-hosted Blnk SDK.`);
    }

    this.apiKey = apiKey;
    const {logger, ...restOptions} = options;
    this.options = {
      timeout: 3000, //default timeout value in ms(30 seconds)
      ...restOptions, //merge the provided options with defaults
    };

    if (logger === undefined) {
      this.logger = console;
    } else {
      this.logger = logger;
    }
    this.services = services;
    this.formatResponse = formatResponse;
    this.thirdPartyRequest = thirdPartyRequest;
  }

  /**
   * Makes a request to the specified endpoint using the provided data and method.
   *
   * @param endpoint The endpoint to send the request to. should be "endpoint" to '/' at the beginning.
   * @param data The data to be sent with the request.
   * @param method The HTTP method for the request (POST, GET, PUT, DELETE).
   * @returns A Promise that resolves to an ApiResponse object containing the response data or null in case of an error.
   */
  private async request<T, R>(
    endpoint: string,
    data: T,
    method: `POST` | `GET` | `PUT` | `DELETE`,
    headerOptions?: Record<string, string>
  ): Promise<ApiResponse<R | null>> {
    const headers = {
      "content-type": `application/json`,
      "X-Blnk-Key": this.apiKey,
      ...headerOptions,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.options.timeout
    );

    try {
      this.logger.info(`Making request`, {endpoint, data, headers, method});
      const response = await this.thirdPartyRequest(
        `${this.options.baseUrl}${endpoint}`,
        {
          method,
          headers,
          body: data
            ? data instanceof FormData
              ? data
              : JSON.stringify(data)
            : undefined,
        }
      );

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorResult: any = await response.json();
        this.logger.error(
          `Request to ${endpoint} failed with status ${response.status}.`
        );
        return this.formatResponse<R>(
          response.status,
          response.statusText,
          errorResult
        );
      }

      const jsonResponse = (await response.json()) as R;
      return this.formatResponse<R>(
        response.status,
        `Success`,
        jsonResponse
      ) as ApiResponse<R>;
    } catch (error: unknown) {
      this.logger.error(`Request failed`, {endpoint, error});
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        `${this.request.name}`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Retrieves a registered service by name and returns an instance of that service.
   * Throws an error if the service is not registered.
   *
   * @param serviceName - The name of the service to retrieve.
   * @returns An instance of the requested service.
   *
   * @example
   * // Retrieve the 'Ledgers' service
   * const ledgersService = getService<Ledgers>('Ledgers');
   *
   * @example
   * // Retrieve the 'Transactions' service
   * const transactionsService = getService<Transactions>('Transactions');
   */
  private getService<T>(serviceName: string): T {
    if (!this.services[serviceName]) {
      throw new Error(`Service ${serviceName} is not registered`);
    }

    if (!this.serviceInstances[serviceName]) {
      this.serviceInstances[serviceName] = new this.services[serviceName](
        this.request.bind(this),
        this.logger,
        this.formatResponse
      );
    }

    return this.serviceInstances[serviceName] as T;
  }

  get Ledgers(): Ledgers {
    return this.getService<Ledgers>(`Ledgers`);
  }

  get LedgerBalances(): LedgerBalances {
    return this.getService<LedgerBalances>(`LedgerBalances`);
  }

  get Transactions(): Transactions {
    return this.getService<Transactions>(`Transactions`);
  }

  get BalanceMonitor(): BalanceMonitor {
    return this.getService<BalanceMonitor>(`BalanceMonitor`);
  }

  get Reconciliation(): Reconciliation {
    return this.getService<Reconciliation>(`Reconciliation`);
  }

  get Search(): Search {
    return this.getService<Search>(`Search`);
  }

  get Identity(): Identity {
    return this.getService<Identity>(`Identity`);
  }

  get getApiKey() {
    return this.apiKey;
  }
}
