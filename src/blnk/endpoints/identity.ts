import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {IdentityData, IdentityDataResponse} from "../../types/identity";
import {HandleError} from "../utils/logger";
import {ValidateIdentity} from "../utils/validators/identityValidators";

export class Identity {
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

  async create<T extends Record<string, unknown>>(data: IdentityData<T>) {
    try {
      const validatorResponse = ValidateIdentity(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }
      const response = await this.request<
        IdentityData<T>,
        IdentityDataResponse<T>
      >(`identities`, data, `POST`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.create.name
      );
    }
  }

  async get<T extends Record<string, unknown>>(id: string) {
    try {
      const response = await this.request<null, IdentityDataResponse<T>>(
        `identities/${id}`,
        null,
        `GET`
      );
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.get.name
      );
    }
  }

  async list() {
    try {
      const response = await this.request<
        null,
        IdentityDataResponse<Record<string, unknown>>[]
      >(`identities`, null, `GET`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.list.name
      );
    }
  }

  async update<T extends Record<string, unknown>>(
    id: string,
    data: IdentityData<T>
  ) {
    try {
      const validatorResponse = ValidateIdentity(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }
      const response = await this.request<
        IdentityData<T>,
        IdentityDataResponse<T>
      >(`identities/${id}`, data, `PUT`);
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.update.name
      );
    }
  }
}
