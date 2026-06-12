import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {
  CreateHookData,
  DeleteHookResp,
  HookResp,
  ListHooksOptions,
  UpdateHookData,
} from "../../types/hooks";
import {HandleError} from "../utils/logger";
import {
  ValidateCreateHookData,
  ValidateListHooksOptions,
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
   * Lists webhooks, optionally filtered by type.
   *
   * @see https://docs.blnkfinance.com/reference/list-hooks-by-type
   */
  async list(options?: ListHooksOptions) {
    try {
      const validatorResponse = ValidateListHooksOptions(options);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const endpoint =
        options?.type !== undefined ? `hooks?type=${options.type}` : `hooks`;

      const response = await this.request<undefined, HookResp[]>(
        endpoint,
        undefined,
        `GET`,
      );

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.list.name,
      );
    }
  }

  /**
   * Retrieves a webhook by ID.
   *
   * @see https://docs.blnkfinance.com/reference/view-hooks
   */
  async get(id: string) {
    try {
      if (!id) {
        return this.formatResponse(400, `hook id is required`, null);
      }

      const response = await this.request<undefined, HookResp>(
        `hooks/${id}`,
        undefined,
        `GET`,
      );

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.get.name,
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

  /**
   * Deletes a webhook by ID.
   *
   * @see https://docs.blnkfinance.com/reference/delete-hooks
   */
  async delete(id: string) {
    try {
      if (!id) {
        return this.formatResponse(400, `hook id is required`, null);
      }

      const response = await this.request<undefined, DeleteHookResp>(
        `hooks/${id}`,
        undefined,
        `DELETE`,
      );

      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.delete.name,
      );
    }
  }
}
