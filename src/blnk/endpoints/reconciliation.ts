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

/**
 * Represents a class for handling reconciliation operations.
 * see @link https://docs.blnkfinance.com/reconciliations/overview for more details
 * @constructor
 * @param {BlnkRequest} request - Function for making API requests.
 * @param {BlnkLogger} logger - Logger for handling errors and logs.
 * @param {FormatResponseType} formatResponse - Function for formatting API response.
 * @method upload - Uploads a file for reconciliation.
 * @returns {Promise<ApiResponse<ReconciliationUploadResp | null>>} - The API response after uploading.
 * @method createMatchingRule - Creates a matching rule for reconciliation.
 * @param {Matcher} data - Data containing the matching rule details.
 * @returns {Promise<ApiResponse<RunReconResp | null>>} - The API response after creating the matching rule.
 * @method run - Initiates a reconciliation run.
 * @param {RunReconData} data - Data required to start the reconciliation run.
 * @returns {Promise<ApiResponse<RunReconResp | null>>} - The API response after starting the reconciliation run.
 * @example
 * const reconciliation = new Reconciliation(requestFunction, loggerInstance, formatResponseFunction);
 * const uploadResponse = await reconciliation.upload('file.txt', 'sourceA');
 * const ruleResponse = await reconciliation.createMatchingRule(matcherData);
 * const runResponse = await reconciliation.run(runData);
 */
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

  /**
   * Uploads a file for reconciliation.
   * see @link https://docs.blnkfinance.com/reconciliations/external-data for more details on the requirements for the file
   *
   * @param {string | ReadStream} fileInput - The file to upload, either a file path or a ReadStream.
   * @param {string} source - The source of the file can be any name you want but should describe the actual source e.g 'local', 'stripe', 'internal' etc.
   * @returns A promise that resolves to the reconciliation upload response(the upload_id returned should be stored as it will be needed when running reconciliation).
   *
   * @example
   * upload('path/to/file.txt', 'sourceA');
   * @example
   * upload(fs.createReadStream('path/to/file.txt'), 'sourceB');
   */
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

  /**
   * Asynchronously creates a matching rule using the provided data.
   * see @link https://docs.blnkfinance.com/reconciliations/matching-rules for more details.
   *
   * Validates the data using the internal organization's Matcher validator.
   * If validation fails, returns a formatted response with a 400 status code.
   * Sends a POST request to the 'reconciliation/matching-rules' endpoint with the data.
   * Returns the response data type from the endpoint query.
   * Handles any errors that occur during the process using the internal organization's error handler.
   *
   * @param data - The Matcher object containing name, description, and criteria.
   * @returns The response data type from the matching rule creation endpoint(the matching rule id returned should be saved as it will be needed when running reconciliation).
   *
   * @example
   * const newMatchingRule = {
   *   name: "Rule 1",
   *   description: "Description of Rule 1",
   *   criteria: [{ field: "field1", operator: "equals", allowable_drift: 0.1 }]
   * };
   * const createdRule = await createMatchingRule(newMatchingRule);
   */
  async createMatchingRule(data: Matcher) {
    try {
      const validatorResponse = await ValidateMatcher(data);
      if (validatorResponse) {
        return this.formatResponse(400, validatorResponse, null);
      }
      const response = await this.request<Matcher, RunReconResp>(
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

  /**
   * Asynchronously runs a reconciliation process with the provided data.
   * see @link https://docs.blnkfinance.com/reconciliations/strategies for more details.
   *
   * @param data - The data needed to start the reconciliation process.
   * @returns A promise that resolves with the reconciliation response.
   * @throws If an error occurs during the reconciliation process, an error response is returned.
   *
   * @example
   * const reconciliationData: RunReconData = {
   *   upload_id: "123",
   *   strategy: "specific_strategy",
   *   dry_run: false,
   *   grouping_criteria: "criteria_field",
   *   matching_rule_ids: ["rule_id_1", "rule_id_2"]
   * };
   * const reconciliationResponse = await reconciliationService.run(reconciliationData);
   */
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
