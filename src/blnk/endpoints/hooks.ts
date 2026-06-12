import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {CreateHookData, HookResp, UpdateHookData} from "../../types/hooks";
import {HandleError} from "../utils/logger";
import {
  ValidateCreateHookData,
  ValidateUpdateHookData,
} from "../utils/validators/hookValidators";

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

  /**
   * Updates an existing webhook.
   *
   * @see https://docs.blnkfinance.com/reference/update-hooks
   */
  async update(id: string, data: UpdateHookData) {
    try {
      if (!id) {
        return this.formatResponse(400, `hook id is required`, null);
      }

      const validatorResponse = ValidateUpdateHookData(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const response = await this.request<UpdateHookData, HookResp>(
        `hooks/${id}`,
        data,
        `PUT`,
      );

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.update.name,
      );
    }
  }
}
