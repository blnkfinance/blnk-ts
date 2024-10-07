/* eslint-disable @typescript-eslint/no-unused-vars */
import {FormatResponse} from "../../src/blnk/utils/httpClient";
import {HandleError} from "../../src/blnk/utils/logger";
import {BlnkClientOptions, BlnkLogger} from "../../src/types/blnkClient";
import {ApiResponse, BlnkRequest, ServicesMap} from "../../src/types/general";
import {TransactionMock} from "./mockTransactions";

/**
 * Manually create a mock logger that adheres to the BlnkLogger interface
 */
export const createMockLogger = (): BlnkLogger => {
  return {
    info: (message: string, ...meta: unknown[]): void => {
      console.log(`Mock Info: ${message}`, ...meta);
    },
    error: (message: string, ...meta: unknown[]): void => {
      console.log(`Mock Error: ${message}`, ...meta);
    },
    debug: (message: string, ...meta: unknown[]): void => {
      console.log(`Mock Debug: ${message}`, ...meta);
    },
  };
};

/**
 * Manually create mock BlnkClientOptions, including the mock logger
 */
export const createMockBlnkClientOptions = (): BlnkClientOptions => {
  return {
    baseUrl: `http://mock-api.com`,
    timeout: 5000,
    logger: createMockLogger(),
  };
};

//export const createMockRequest = <T, R>(): BlnkRequest => t.createMock();

export const createMockServices = (): ServicesMap => ({
  Ledgers: TransactionMock.Transactions,
  LedgerBalances: TransactionMock.Transactions,
  Transactions: TransactionMock.Transactions,
});

// Mock ApiResponse implementation
const mockApiResponse = <T>(
  data: T,
  status = 200,
  message = `Success`
): ApiResponse<T> => {
  return {
    status,
    message,
    data,
  };
};

export const ledgerId = `123456`;

// Mock BlnkRequest implementation
// Factory function for creating mockBlnkRequest
export const createMockBlnkRequest = (
  success: boolean,
  throwError: string | undefined = undefined,
  status = 200
): BlnkRequest => {
  return async <T, R>(
    endpoint: string,
    data: T,
    method: `POST` | `GET` | `PUT` | `DELETE`,
    headerOptions?: Record<string, string>
  ): Promise<ApiResponse<R | null>> => {
    try {
      if (throwError !== undefined) {
        throw new Error(throwError);
      }
      // Simulate success or error based on the success parameter
      if (success) {
        const mockData = {...data, ledger_id: ledgerId} as unknown as R;
        return mockApiResponse<R>(mockData, status);
      } else {
        return mockApiResponse<R | null>(null, 500, `Internal Server Error`);
      }
    } catch (error: unknown) {
      throw new Error(throwError);
    }
  };
};
