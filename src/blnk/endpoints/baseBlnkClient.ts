import {BlnkClientOptions, BlnkLogger, FetchType} from "../../types/blnkClient";
import {
  ApiResponse,
  FormatResponseType,
  ServiceInstances,
  ServicesMap,
} from "../../types/general";
import {
  isNodeFormData,
  isStreamingFetchBody,
  isWebFormData,
  nodeFormDataToFetchBody,
} from "../utils/formDataBody";
import {HandleError} from "../utils/logger";
import {ApiKeys} from "./apiKeys";
import {BalanceMonitor} from "./balanceMonitors";
import {Hooks} from "./hooks";
import {Identity} from "./identity";
import {LedgerBalances} from "./ledgerBalances";
import {Ledgers} from "./ledgers";
import {Metadata} from "./metadata";
import {Reconciliation} from "./reconciliation";
import {Search} from "./search";
import {System} from "./system";
import {Transactions} from "./transactions";
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
  private thirdPartyRequest: FetchType;

  constructor(
    apiKey: string,
    options: BlnkClientOptions,
    services: ServicesMap,
    formatResponse: FormatResponseType,
    thirdPartyRequest: FetchType,
  ) {
    if (!options.baseUrl) {
      throw new Error(`baseUrl is required for self-hosted Blnk SDK.`);
    }

    //make sure baseUrl ends with "/"
    if (!options.baseUrl.endsWith(`/`)) {
      options.baseUrl = options.baseUrl + `/`;
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
    headerOptions?: Record<string, string>,
  ): Promise<ApiResponse<R | null>> {
    const controller = new AbortController();
    const timeoutMs = this.options.timeout ?? 3000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let body: BodyInit | undefined;
    const formDataHeaders: Record<string, string> = {};

    if (data) {
      if (isNodeFormData(data)) {
        const converted = nodeFormDataToFetchBody(data);
        body = converted.body as BodyInit;
        Object.assign(formDataHeaders, converted.headers);
      } else if (isWebFormData(data)) {
        body = data;
      } else {
        body = JSON.stringify(data);
      }
    }

    const isMultipart = isNodeFormData(data) || isWebFormData(data);
    const headers: Record<string, string> = {
      "X-Blnk-Key": this.apiKey,
      ...(!isMultipart ? {"content-type": `application/json`} : {}),
      ...headerOptions,
      ...formDataHeaders,
    };

    type FetchInitWithDuplex = RequestInit & {duplex?: `half`};

    const fetchInit: FetchInitWithDuplex = {
      method,
      headers,
      body,
      signal: controller.signal,
    };

    if (isStreamingFetchBody(body)) {
      fetchInit.duplex = `half`;
    }

    try {
      const response = await this.thirdPartyRequest(
        `${this.options.baseUrl}${endpoint}`,
        fetchInit,
      );

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorResult: any = await response.json();
        this.logger.error(
          `Request to ${endpoint} failed with status ${response.status}.`,
        );
        return this.formatResponse<R>(
          response.status,
          response.statusText,
          errorResult,
        );
      }

      const jsonResponse = (await response.json()) as R;
      return this.formatResponse<R>(
        response.status,
        `Success`,
        jsonResponse,
      ) as ApiResponse<R>;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === `AbortError`) {
        this.logger.error(`Request timed out`, {endpoint, timeoutMs});
        return this.formatResponse(
          408,
          `Request timed out after ${timeoutMs}ms`,
          null,
        );
      }

      this.logger.error(`Request failed`, {endpoint, error});
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        `${this.request.name}`,
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
        this.formatResponse,
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

  get System(): System {
    return this.getService<System>(`System`);
  }

  get Metadata(): Metadata {
    return this.getService<Metadata>(`Metadata`);
  }

  get Hooks(): Hooks {
    return this.getService<Hooks>(`Hooks`);
  }

  get ApiKeys(): ApiKeys {
    return this.getService<ApiKeys>(`ApiKeys`);
  }

  get getApiKey() {
    return this.apiKey;
  }
}
