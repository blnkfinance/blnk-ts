import {BlnkLogger} from "../../types/blnkClient";
import {ApiKeyResp, CreateApiKeyData} from "../../types/apiKeys";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {HandleError} from "../utils/logger";
import {ValidateCreateApiKeyData} from "../utils/validators/apiKeyValidators";

/**
 * API key management operations (master key or `api-keys:write` scope required).
 */
export class ApiKeys {
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

  /**
   * Creates a new API key with scoped permissions.
   *
   * @see https://docs.blnkfinance.com/reference/create-api-key
   */
  async create(data: CreateApiKeyData) {
    try {
      const validatorResponse = ValidateCreateApiKeyData(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const response = await this.request<CreateApiKeyData, ApiKeyResp>(
        `api-keys`,
        data,
        `POST`,
      );

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.create.name,
      );
    }
  }
}
