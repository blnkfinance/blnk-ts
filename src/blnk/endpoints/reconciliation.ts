import {ReadStream} from "fs";
import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {HandleError} from "../utils/logger";
import fs from "fs";
import {
  Matcher,
  ReconciliationUploadResp,
  RunReconData,
  RunReconResp,
} from "../../types/reconciliation";
import {ValidateMatcher} from "../utils/validators/reconciliationValidator";
import FormData1 from "form-data";
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
      const formData = new FormData1();
      // Determine if the input is a file path (string) or a ReadStream
      if (typeof fileInput === `string`) {
        // If a string is passed, assume it's a file path and create a stream
        //check if file path exists
        if (!fs.existsSync(fileInput)) {
          return this.formatResponse(
            404,
            `File does not exist at path: ${fileInput}`,
            null
          );
        }
        //get the buf
        formData.append(`file`, fs.createReadStream(fileInput));
      } else {
        // If a stream is passed, use it directly
        //check if readstream is valid
        if (!fileInput.readable) {
          return this.formatResponse(400, `Invalid read stream provided`, null);
        }
        formData.append(`file`, fileInput);
      }

      formData.append(`source`, source);
      const response = await this.request<{}, ReconciliationUploadResp>(
        `reconciliation/upload`,
        formData,
        `POST`,
        {
          "content-type": `multipart/form-data;boundary=${formData.getBoundary()}`,
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
      const validatorResponse = await ValidateMatcher(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }
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
      const response = await this.request<RunReconData, RunReconResp>(
        `reconciliation/start`,
        data,
        `POST`
      );
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
