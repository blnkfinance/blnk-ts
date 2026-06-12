import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {UpdateMetadataData, UpdateMetadataResp} from "../../types/metadata";
import {HandleError} from "../utils/logger";
import {ValidateUpdateMetadataData} from "../utils/validators/metadataValidators";

/**
 * Metadata operations for ledgers, transactions, balances, and identities.
 */
export class Metadata {
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
   * Updates metadata for a ledger, transaction, balance, or identity.
   *
   * @see https://docs.blnkfinance.com/reference/update-metadata
   */
  async update(id: string, data: UpdateMetadataData) {
    try {
      const validatorResponse = ValidateUpdateMetadataData(id, data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }

      const response = await this.request<
        UpdateMetadataData,
        UpdateMetadataResp
      >(`${id}/metadata`, data, `POST`);

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
