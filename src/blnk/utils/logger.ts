import {BlnkLogger} from "../../types/blnkClient";
import {ApiResponse, FormatResponseType} from "../../types/general";

export const CustomLogger: BlnkLogger = {
  info: (message: string, ...meta: unknown[]) => {
    console.log(`INFO: ${message}`, ...meta);
  },
  error: (message: string, ...meta: unknown[]) => {
    console.error(`ERROR: ${message}`, ...meta);
  },
  debug: (message: string, ...meta: unknown[]) => {
    console.debug(`DEBUG: ${message}`, ...meta);
  },
};

export function HandleError(
  error: unknown,
  logger: BlnkLogger,
  formatResponse: FormatResponseType,
  fnName: string,
): ApiResponse<null> {
  logger.error(fnName, error);
  if (error instanceof Error) {
    return formatResponse(500, error.message, null);
  } else {
    return formatResponse(500, `An unknown error occurred.`, null);
  }
}
