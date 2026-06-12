import {BlnkLogger} from "../../types/blnkClient";
import {
  ApiResponse,
  BlnkRequest,
  FormatResponseType,
} from "../../types/general";
import {
  SearchCollection,
  SearchDocumentByCollection,
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

  async search<C extends SearchCollection>(
    data: SearchParams,
    service: C,
  ): Promise<
    ApiResponse<SearchResponse<SearchDocumentByCollection[C]> | null>
  > {
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
        SearchResponse<SearchDocumentByCollection[typeof service]>
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
