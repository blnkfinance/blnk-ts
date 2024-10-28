import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {SearchParams, SearchResponse} from "../../types/search";
import {HandleError} from "../utils/logger";

/**
 * Represents a Search class that handles searching functionality.
 * see @link https://docs.blnkfinance.com/search/overview for more details.
 * @constructor
 * @param {BlnkRequest} request - The request function for API calls.
 * @param {BlnkLogger} logger - The logger for handling logs.
 * @param {FormatResponseType} formatResponse - The function for formatting API responses.
 * @method search - Performs a search operation based on the provided data and service type.
 * @param {SearchParams} data - The search parameters.
 * @param {`ledgers` | `transactions` | `balances`} service - The type of service to search within.
 * @returns {Promise<SearchResponse>} - A promise that resolves to the search response.
 * @example
 * const search = new Search(requestFunction, loggerInstance, formatResponseFunction);
 * const searchData = { q: 'search query', page: 1, per_page: 10 };
 * const searchService = 'ledgers';
 * const result = await search.search(searchData, searchService);
 */
export class Search {
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

  async search(
    data: SearchParams,
    service: `ledgers` | `transactions` | `balances`,
  ) {
    try {
      if (!data.q) {
        return this.formatResponse(400, `Field "q" must be filled`, null);
      }
      const response = await this.request<SearchParams, SearchResponse>(
        `search/${service}`,
        data,
        `POST`,
      );

      return response;
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.search.name,
      );
    }
  }
}
