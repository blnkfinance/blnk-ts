import {MonitorData, MonitorDataResp} from "../../../types/balanceMonitor";
import {BlnkLogger} from "../../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../../types/general";
import {HandleError} from "../../utils/logger";
import {ValidateMonitorData} from "../../utils/validators/balanceMonitors";

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

  async create(data: MonitorData) {
    try {
      const validatorResponse = ValidateMonitorData(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }
      //add meta_data to this type
      const response = await this.request<MonitorData, MonitorData>(
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

  async get(id: string) {
    try {
      const response = await this.request(
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

  async update(id: string, data: MonitorData) {
    try {
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
