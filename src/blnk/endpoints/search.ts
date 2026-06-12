import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {
  SearchCollection,
  SearchIdentityResponse,
  SearchParams,
  SearchResponse,
} from "../../types/search";
import {HandleError} from "../utils/logger";
import {
  ValidateSearchCollection,
  ValidateSearchParams,
} from "../utils/validators/searchValidators";

/**
 * Represents a Search class that handles searching functionality.
 * see @link https://docs.blnkfinance.com/search/overview for more details.
 * @constructor
 * @param {BlnkRequest} request - The request function for API calls.
 * @param {BlnkLogger} logger - The logger for handling logs.
 * @param {FormatResponseType} formatResponse - The function for formatting API responses.
 * @method search - Performs a search operation based on the provided data and service type.
 * @param {SearchParams} data - The search parameters.
 * @param {SearchCollection} service - The collection to search (`ledgers`, `transactions`, `balances`, or `identities`).
 * @returns {Promise<SearchResponse | SearchIdentityResponse>} - A promise that resolves to the search response.
 * @example
 * const search = new Search(requestFunction, loggerInstance, formatResponseFunction);
 * const searchData = { q: 'jane', query_by: 'first_name,last_name,email_address', page: 1, per_page: 10 };
 * const result = await search.search(searchData, 'identities');
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

  async search(data: SearchParams, service: SearchCollection) {
    try {
      const collectionError = ValidateSearchCollection(service);
      if (collectionError) {
        return this.formatResponse(400, collectionError, null);
      }

      const paramsError = ValidateSearchParams(data);
      if (paramsError) {
        return this.formatResponse(400, paramsError, null);
      }

      const response = await this.request<
        SearchParams,
        SearchResponse | SearchIdentityResponse
      >(`search/${service}`, data, `POST`);

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
