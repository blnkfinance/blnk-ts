/* eslint-disable n/no-unpublished-import */
import {Transactions} from "../../src/blnk/endpoints/transactions";
import tap from "tap";
import {
  CreateTransactionResponse,
  CreateTransactions,
  MultipleSourcesT,
  StatusType,
  UpdateTransactionStatus,
} from "../../src/types/transactions";
import {
  ApiResponse,
  BlnkRequest,
  Currency,
  FormatResponseType,
} from "../../src/types/general";
import {BlnkLogger} from "../../src/types/blnkClient";

class MockTransaction {
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
  async create<T extends Record<string, never>>(
    data: CreateTransactions<T>,
  ): Promise<ApiResponse<CreateTransactionResponse<T> | null>> {
    return {
      status: 200,
      data: {
        ...data,
        ...createDummyTransactionResponse(),
      },
      message: `Success`,
    };
  }
  async updateStatus<T extends Record<string, never>>(
    id: string,
    update: UpdateTransactionStatus<T>,
  ): Promise<ApiResponse<CreateTransactionResponse<T> | null>> {
    return {
      data: {
        ...createDummyTransactionResponse(),
        transaction_id: id,
        ...update,
        status: `COMMIT`,
      },
      message: `Success`,
      status: 200,
    };
  }
  async refund<T extends Record<string, never>>(
    id: string,
  ): Promise<ApiResponse<CreateTransactionResponse<T> | null>> {
    return {
      data: {
        ...createDummyTransactionResponse(),
        transaction_id: id,
      },
      message: `Success`,
      status: 200,
    };
  }
}
// Mock class for Transactions
export const TransactionMock = tap.createMock(
  {Transactions},
  {
    Transactions: MockTransaction,
  },
);

export function createDummyTransactionResponse<
  T extends Record<string, never>,
>(): CreateTransactionResponse<T> {
  return {
    transaction_id: `txn_` + Math.random().toString(36).substr(2, 9),
    amount: 1000,
    precision: 2,
    precise_amount: 100000,
    rate: 0,
    reference: `REF12345`,
    description: `Sample transaction description`,
    currency: `USD` as Currency,
    status: `INFLIGHT` as StatusType,
    source: `source_12345`,
    destination: `destination_67890`,
    sources: [
      {
        identifier: `account1`,
        distribution: `left`,
      },
    ] as MultipleSourcesT[],
    created_at: new Date(),
    meta_data: {} as T,
  };
}
