import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {IdentityData, IdentityDataResponse} from "../../types/identity";
import {HandleError} from "../utils/logger";
import {ValidateIdentity} from "../utils/validators/identityValidators";

/**
 * Represents an Identity class that handles operations related to identity data.
 * see @link https://docs.blnkfinance.com/identity/overview for more information.
 *
 * @constructor
 * @param {BlnkRequest} request - The request function for API calls.
 * @param {BlnkLogger} logger - The logger for handling logs.
 * @param {FormatResponseType} formatResponse - The function for formatting API responses.
 * @method create - Creates a new identity record.
 * @method get - Retrieves an identity record by ID.
 * @method list - Retrieves a list of identity records.
 * @method update - Updates an existing identity record.
 * @returns {Promise<ApiResponse>} - The response from the API call.
 * @example
 * const identity = new Identity(requestFunction, loggerInstance, formatResponseFunction);
 * const newIdentity = await identity.create(identityData);
 * const retrievedIdentity = await identity.get("12345");
 * const identityList = await identity.list();
 * const updatedIdentity = await identity.update("12345", updatedData);
 */
export class Identity {
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
   * Asynchronously creates a new identity using the provided data after validating it.
   * If the data is valid, sends a POST request to the 'identities' endpoint.
   * Returns the response from the request if successful.
   * Handles any errors that occur during the process.
   *
   * @param data - The identity data to be created.
   * @returns The response from the 'identities' endpoint or an error response.
   *
   * @example
   * const newData: IdentityData<meta_data> = { ... };
   * const identityService = new IdentityService();
   * const createdIdentity = await identityService.create(newData);
   */
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
        this.create.name,
      );
    }
  }

  /**
   * Asynchronously retrieves identity data based on the provided ID.
   *
   * @param id - The ID of the identity to retrieve.
   * @returns A promise that resolves with the identity data response.
   *
   * @example
   * const identityService = new IdentityService();
   * const retrievedIdentity = await identityService.get<MyCustomData>("12345");
   */
  async get<T extends Record<string, unknown>>(id: string) {
    try {
      const response = await this.request<null, IdentityDataResponse<T>>(
        `identities/${id}`,
        null,
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
   * Asynchronously retrieves a list of identity data.
   *
   * @returns {Promise<IdentityDataResponse<Record<string, unknown>>[]>} A promise that resolves to an array of identity data responses.
   *
   * @example
   * const identityService = new IdentityService();
   * const identityList = await identityService.list();
   */
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
        this.list.name,
      );
    }
  }

  /**
   * Asynchronously updates an identity record with the provided data.
   * Validates the identity data before updating.
   *
   * @param id - The unique identifier of the identity record to update.
   * @param data - The updated identity data to replace the existing record.
   * @returns The updated identity data response if successful, or an error response.
   *
   * @example
   * const identityService = new IdentityService();
   * const updatedIdentity = await identityService.update("unique_id", {
   *   identity_type: "individual",
   *   first_name: "John",
   *   last_name: "Doe",
   *   dob: new Date("1990-01-01"),
   *   gender: "male",
   *   email_address: "john.doe@example.com",
   *   phone_number: "1234567890",
   *   nationality: "US",
   *   category: "category",
   *   street: "123 Street",
   *   country: "USA",
   *   state: "CA",
   *   post_code: "12345",
   *   city: "City",
   *   meta_data: { additional_info: "info" }
   * });
   */
  async update<T extends Record<string, unknown>>(
    id: string,
    data: IdentityData<T>,
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
        this.update.name,
      );
    }
  }
}
