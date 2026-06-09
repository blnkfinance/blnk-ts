import {BlnkLogger} from "../../types/blnkClient";
import {BlnkRequest, FormatResponseType} from "../../types/general";
import {HealthResponse} from "../../types/system";
import {HandleError} from "../utils/logger";

/**
 * System operations for Blnk Core (health checks, etc.).
 */
export class System {
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
   * Checks whether Blnk Core is running and reachable.
   *
   * @returns Wrapped SDK response; Core payload is `{ status: 'UP' }` on `data`.
   *
   * @example
   * const health = await client.System.health();
   * // health.status === 200
   * // health.data?.status === 'UP'
   */
  async health() {
    try {
      const response = await this.request<undefined, HealthResponse>(
        `health`,
        undefined,
        `GET`,
      );
      return response;
    } catch (error: unknown) {
      return HandleError(
        error,
        this.logger,
        this.formatResponse,
        this.health.name,
      );
    }
  }
}
