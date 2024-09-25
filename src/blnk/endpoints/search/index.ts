import {BlnkLogger} from "../../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../../types/general";
import {SearchParams, SearchResponse} from "../../../types/search";
import {HandleError} from "../../utils/logger";

export class Search {
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

  async search(
    data: SearchParams,
    service: `ledgers` | `transactions` | `balances`
  ) {
    try {
      const response = await this.request<SearchParams, SearchResponse>(
        `search/${service}`,
        data,
        `POST`
      );

      return response;
    } catch (error) {
      this.logger.error(`${this.search.name}`, error);
      return HandleError(error, this.logger, this.formatResponse);
    }
  }
}
