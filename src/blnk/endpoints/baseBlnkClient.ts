import {
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_TIMEOUT_MS,
} from "../constants/clientDefaults";
import {BlnkClientOptions, BlnkLogger, FetchType} from "../../types/blnkClient";
import {
  ApiResponse,
  FormatResponseType,
  ServiceInstances,
  ServicesMap,
} from "../../types/general";
import {parseBlnkApiErrorBody} from "../../types/errors";
import {
  isNodeFormData,
  isStreamingFetchBody,
  isWebFormData,
  nodeFormDataToFetchBody,
} from "../utils/formDataBody";
import {HandleError} from "../utils/logger";
import {
  isRetryableFetchError,
  isRetryableHttpMethod,
  isRetryableHttpStatus,
  normalizeRetryCount,
  normalizeRetryDelayMs,
  retryDelayForAttempt,
  sleep,
} from "../utils/requestRetry";
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
      timeout: DEFAULT_TIMEOUT_MS,
      retryCount: DEFAULT_RETRY_COUNT,
      retryDelayMs: DEFAULT_RETRY_DELAY_MS,
      ...restOptions,
    };
    this.options.retryCount = normalizeRetryCount(this.options.retryCount);
    this.options.retryDelayMs = normalizeRetryDelayMs(this.options.retryDelayMs);

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
    const timeoutMs = this.options.timeout ?? DEFAULT_TIMEOUT_MS;
    const maxAttempts = normalizeRetryCount(this.options.retryCount);
    const retryDelayMs = normalizeRetryDelayMs(this.options.retryDelayMs);

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
    const canRetry =
      !isMultipart && maxAttempts > 1 && isRetryableHttpMethod(method);
    const headers: Record<string, string> = {
      "X-Blnk-Key": this.apiKey,
      ...(!isMultipart ? {"content-type": `application/json`} : {}),
      ...headerOptions,
      ...formDataHeaders,
    };

    type FetchInitWithDuplex = RequestInit & {duplex?: `half`};

    const url = `${this.options.baseUrl}${endpoint}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        const delayMs = retryDelayForAttempt(attempt - 1, retryDelayMs);
        this.logger.info(`Retrying request to ${endpoint}`, {
          attempt,
          maxAttempts,
          delayMs,
        });
        await sleep(delayMs);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
        const response = await this.thirdPartyRequest(url, fetchInit);

        if (!response.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errorResult: any = await response.json();
          const structuredError = parseBlnkApiErrorBody(errorResult);

          if (
            canRetry &&
            isRetryableHttpStatus(response.status) &&
            attempt < maxAttempts
          ) {
            this.logger.info(
              `Request to ${endpoint} failed with status ${response.status}; retrying.`,
            );
            continue;
          }

          this.logger.error(
            `Request to ${endpoint} failed with status ${response.status}.`,
          );
          return this.formatResponse<R>(
            response.status,
            structuredError?.message ?? response.statusText,
            errorResult,
            structuredError,
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
          // Timeouts are intentionally not retried to avoid duplicate mutating calls.
          this.logger.error(`Request timed out`, {endpoint, timeoutMs});
          return this.formatResponse(
            408,
            `Request timed out after ${timeoutMs}ms`,
            null,
          );
        }

        if (canRetry && isRetryableFetchError(error) && attempt < maxAttempts) {
          this.logger.info(`Request to ${endpoint} failed; retrying.`, {
            error,
          });
          continue;
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

    return this.formatResponse(
      500,
      `Request failed after ${maxAttempts} attempts`,
      null,
    );
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
