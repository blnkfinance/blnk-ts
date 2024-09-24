import {BlnkClientOptions, BlnkLogger} from "../../types/blnkClient";
import {
  ApiResponse,
  FormatResponseType,
  ServiceInstances,
  ServicesMap,
} from "../../types/general";
import {HandleError} from "../utils/logger";
import {BalanceMonitor} from "./balanceMonitors";
import {LedgerBalances} from "./ledgerBalances";
import {Ledgers} from "./ledgers";
import {Reconciliation} from "./reconciliation";
import {Transactions} from "./transactions";

export class Blnk {
  private apiKey: string;
  private options: Omit<BlnkClientOptions, `logger`>;
  private logger: BlnkLogger;
  private services: ServicesMap;
  private serviceInstances: ServiceInstances = {}; // Cache initialized services
  private formatResponse: FormatResponseType;
  private thirdPartyRequest: typeof fetch;

  constructor(
    apiKey: string,
    options: BlnkClientOptions,
    services: ServicesMap,
    formatResponse: FormatResponseType,
    thirdPartyRequest: typeof fetch
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

    this.logger = logger;
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
      "Content-Type": `application/json`,
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
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal, // Handle timeout
        }
      );

      if (!response.ok) {
        const errorResult = await response.json();
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
      return HandleError(error, this.logger, this.formatResponse);
    } finally {
      clearTimeout(timeoutId);
    }
  }

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

  get getApiKey() {
    return this.apiKey;
  }
}
