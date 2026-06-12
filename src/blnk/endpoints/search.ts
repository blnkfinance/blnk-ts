import {BlnkLogger} from "../../types/blnkClient";
import {
  ApiResponse,
  BlnkRequest,
  FormatResponseType,
} from "../../types/general";
import {
  FilterParams,
  FilterRecordByCollection,
  FilterResponse,
  SearchCollection,
  SearchDocumentByCollection,
  SearchParams,
  SearchResponse,
  StartReindexRequest,
  StartReindexResponse,
} from "../../types/search";
import {HandleError} from "../utils/logger";
import {
  ValidateFilterParams,
  ValidateSearchCollection,
  ValidateSearchParams,
  ValidateStartReindexRequest,
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

  async filter<C extends SearchCollection>(
    data: FilterParams,
    collection: C,
  ): Promise<ApiResponse<FilterResponse<FilterRecordByCollection[C]> | null>> {
    try {
      const collectionError = ValidateSearchCollection(collection);
      if (collectionError) {
        return this.formatResponse(400, collectionError, null);
      }

      const paramsError = ValidateFilterParams(data);
      if (paramsError) {
        return this.formatResponse(400, paramsError, null);
      }

      const response = await this.request<
        FilterParams,
        FilterResponse<FilterRecordByCollection[typeof collection]>
      >(`${collection}/filter`, data, `POST`);

      return response;
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.filter.name,
      );
    }
  }

  /**
   * Starts a Typesense reindex from the database.
   *
   * @see https://docs.blnkfinance.com/reference/start-reindex
   */
  async startReindex(options?: StartReindexRequest) {
    try {
      if (options !== undefined) {
        const paramsError = ValidateStartReindexRequest(options);
        if (paramsError) {
          return this.formatResponse(400, paramsError, null);
        }
      }

      const body: StartReindexRequest =
        options?.batch_size !== undefined
          ? {batch_size: options.batch_size}
          : {};

      const response = await this.request<
        StartReindexRequest,
        StartReindexResponse
      >(`search/reindex`, body, `POST`);

      return response;
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.startReindex.name,
      );
    }
  }
}
