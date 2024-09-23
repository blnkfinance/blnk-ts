import {BlnkClientOptions, BlnkLogger} from "../../src/types/blnkClient";
import {ServicesMap} from "../../src/types/general";
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
    headers: {Authorization: `Bearer mockToken`},
    logger: createMockLogger(),
  };
};

//export const createMockRequest = <T, R>(): BlnkRequest => t.createMock();

export const createMockServices = (): ServicesMap => ({
  Ledgers: TransactionMock.Transactions,
  LedgerBalances: TransactionMock.Transactions,
  Transactions: TransactionMock.Transactions,
});
