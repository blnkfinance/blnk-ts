import {BlnkLogger} from "../../types/blnkClient";
import {
  ApiResponse,
  BlnkRequest,
  FormatResponseType,
} from "../../types/general";
import {
  SearchBalanceDocument,
  SearchCollection,
  SearchDocumentByCollection,
  SearchIdentityDocument,
  SearchLedgerDocument,
  SearchParams,
  SearchResponse,
  SearchTransactionDocument,
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

  async search(
    data: SearchParams,
    service: `ledgers`,
  ): Promise<ApiResponse<SearchResponse<SearchLedgerDocument> | null>>;
  async search(
    data: SearchParams,
    service: `transactions`,
  ): Promise<ApiResponse<SearchResponse<SearchTransactionDocument> | null>>;
  async search(
    data: SearchParams,
    service: `balances`,
  ): Promise<ApiResponse<SearchResponse<SearchBalanceDocument> | null>>;
  async search(
    data: SearchParams,
    service: `identities`,
  ): Promise<ApiResponse<SearchResponse<SearchIdentityDocument> | null>>;
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
