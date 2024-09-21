import { BlnkLogger } from "../../types/blnkClient";

export const CustomLogger: BlnkLogger = {
    info: (message: string, ...meta: any[]) => {
        console.log(`INFO: ${message}`, ...meta);
    },
    error: (message: string, ...meta: any[]) => {
        console.error(`ERROR: ${message}`, ...meta);
    },
    debug: (message: string, ...meta: any[]) => {
        console.debug(`DEBUG: ${message}`, ...meta);
    }
};
  