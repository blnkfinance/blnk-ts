import {ReadStream} from "fs";
import {BlnkLogger} from "../../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../../types/general";
import {HandleError} from "../../utils/logger";
import FormData from "form-data";
import fs from "fs";
import {
  Matcher,
  ReconciliationUploadResp,
  RunReconData,
} from "../../../types/reconciliation";

export class Reconciliation {
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

  async upload(fileInput: string | ReadStream, source: string) {
    try {
      const formData = new FormData();
      // Determine if the input is a file path (string) or a ReadStream
      if (typeof fileInput === `string`) {
        // If a string is passed, assume it's a file path and create a stream
        formData.append(`file`, fs.createReadStream(fileInput));
      } else {
        // If a stream is passed, use it directly
        formData.append(`file`, fileInput);
      }
      formData.append(`source`, source);
      const response = await this.request<FormData, ReconciliationUploadResp>(
        `reconciliation/upload`,
        formData,
        `POST`,
        {
          ...formData.getHeaders(),
        }
      );
      return response;
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.upload.name
      );
    }
  }

  async createMatchingRule(data: Matcher) {
    try {
      const response = await this.request(
        `reconciliation/matching-rules`,
        data,
        `POST`
      );
      return response; //query endpoint and get response data type
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.createMatchingRule.name
      );
    }
  }

  async run(data: RunReconData) {
    try {
      const response = await this.request(`reconciliation/start`, data, `POST`);
      return response;
    } catch (error) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.run.name
      );
    }
  }
}
