import {MonitorData} from "../../../types/balanceMonitor";
import {BlnkLogger} from "../../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../../types/general";
import {HandleError} from "../../utils/logger";

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
      //add meta_data to this type
      const response = await this.request<MonitorData, MonitorData>(
        `balance-monitors`,
        data,
        `POST`
      );
      return response;
    } catch (error: unknown) {
      this.logger.error(`${this.create.name}`, error);
      return HandleError(error, this.logger, this.formatResponse);
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
      this.logger.error(`${this.get.name}`, error);
      return HandleError(error, this.logger, this.formatResponse);
    }
  }

  async update(id: string, data: MonitorData) {
    try {
      const response = await this.request<MonitorData, MonitorData>(
        `balance-monitors/${id}`,
        data,
        `PUT`
      );
      return response;
    } catch (error) {
      this.logger.error(`${this.update.name}`, error);
      return HandleError(error, this.logger, this.formatResponse);
    }
  }
}
