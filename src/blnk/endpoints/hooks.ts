import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {CreateHookData, HookResp} from "../../types/hooks";
import {HandleError} from "../utils/logger";
import {ValidateCreateHookData} from "../utils/validators/hookValidators";

/**
 * Webhook management operations (master key required on Core).
 */
export class Hooks {
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
   * Registers a new webhook.
   *
   * @see https://docs.blnkfinance.com/reference/create-hooks
   */
  async create(data: CreateHookData) {
    try {
      const validatorResponse = ValidateCreateHookData(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const response = await this.request<CreateHookData, HookResp>(
        `hooks`,
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
