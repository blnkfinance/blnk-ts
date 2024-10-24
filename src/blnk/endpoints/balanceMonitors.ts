import {MonitorData, MonitorDataResp} from "../../types/balanceMonitor";
import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {HandleError} from "../utils/logger";
import {ValidateMonitorData} from "../utils/validators/balanceMonitors";

/**
 * Represents a Balance Monitor that interacts with the balance monitoring system.
 * see @link https://docs.blnkfinance.com/balances/balance-monitoring for more details.
 *
 * @constructor
 * @param {BlnkRequest} request - The request function for API calls.
 * @param {BlnkLogger} logger - The logger for handling logs.
 * @param {FormatResponseType} formatResponse - Function to format api responses.
 * @method create - Creates a new balance monitor with the provided data.
 * @method get - Retrieves a balance monitor by its ID.
 * @method list - Retrieves a list of all balance monitors.
 * @method update - Updates an existing balance monitor with new data.
 * @example
 * const monitor = new BalanceMonitor(requestFunction, loggerInstance, formatResponseFunction);
 * const newMonitorData = { balance_id: '123', condition: { ... } };
 * const createdMonitor = await monitor.create(newMonitorData);
 */
export class BalanceMonitor {
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
   * Asynchronously creates a new balance monitor using the provided data.
   * Validates the monitor data before creation and handles any errors that occur during the process.
   *
   * @param data - The monitor data to be used for creating the balance monitor.
   * @returns A promise that resolves with the created balance monitor data if successful, or an error response if validation fails or an error occurs.
   *
   * @example
   * const newMonitorData: MonitorData = {
   *   condition: { ... },
   *   description: 'Sample description',
   *   balance_id: '12345',
   *   call_back_url: 'https://example.com/callback'
   * };
   * const createdMonitor = await create(newMonitorData);
   */
  async create(data: MonitorData) {
    try {
      const validatorResponse = ValidateMonitorData(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }
      //add meta_data to this type
      const response = await this.request<MonitorData, MonitorDataResp>(
        `balance-monitors`,
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

  /**
   * Asynchronously retrieves monitor data based on the provided ID.
   *
   * @param {string} id - The ID of the monitor to retrieve data for.
   * @returns A promise that resolves to the monitor data response.
   * @throws If an error occurs during the retrieval process, an error response is returned.
   *
   * @example
   * const monitorId = '123';
   * const monitorData = await get(monitorId);
   * // monitorData contains the retrieved monitor data
   */
  async get(id: string) {
    try {
      const response = await this.request<undefined, MonitorDataResp>(
        `balance-monitors/${id}`,
        undefined,
        `GET`
      );

      return response;
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.get.name
      );
    }
  }

  /**
   * Asynchronously retrieves a list of monitor data responses from the server.
   *
   * @returns {Promise<MonitorDataResp[]>}  A promise that resolves with an array of MonitorDataResp objects.
   * @throws {ApiResponse<null>} If an error occurs during the API request, an ApiResponse object with a status code and message is returned.
   *
   * @example
   * const monitorList = await list();
   * // monitorList: MonitorDataResp[]
   */
  async list() {
    try {
      const response = await this.request<undefined, MonitorDataResp[]>(
        `balance-monitors`,
        undefined,
        `GET`
      );
      return response;
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.get.name
      );
    }
  }

  /**
   * Asynchronously updates a monitor data entry identified by the provided ID.
   * Validates the input data using the sdk validation function.
   * If validation fails, returns a formatted response with a 400 status code.
   * If successful, sends a PUT request to update the monitor data and returns the response.
   * Handles any errors that occur during the process and logs them using the internal logger.
   *
   * @param {string} id - The ID of the monitor data entry to update.
   * @param {MonitorData} data - The updated monitor data object.
   * @returns A promise that resolves to the updated monitor data response.
   *
   * @example
   * // Example usage:
   * const updatedData = await update("12345", {
   *   condition: { ... },
   *   description: "Updated description",
   *   balance_id: "67890",
   *   call_back_url: "https://updated-url.com"
   * });
   */
  async update(id: string, data: MonitorData) {
    try {
      const validatorResponse = ValidateMonitorData(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }
      const response = await this.request<MonitorData, MonitorDataResp>(
        `balance-monitors/${id}`,
        data,
        `PUT`
      );
      return response;
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.update.name
      );
    }
  }
}
