/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Transactions} from "../../../../src/blnk/endpoints/transactions";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {BlnkRequest} from "../../../../src/types/general";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {
  BulkTransactions,
  CreateTransactions,
  UpdateTransactionStatus,
} from "../../../../src/types/transactions";

tap.test(`Creates a transaction`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
  });
  type meta_dataT = {company_name: string};

  t.test(`Creates a transaction with valid data`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: CreateTransactions<meta_dataT> = {
      amount: 10000,
      currency: `USD`,
      description: `Test transaction`,
      meta_data: {company_name: `Test Company`},
      precision: 100,
      reference: `1234567890`,
    };
    const transaction = await transactions.create<meta_dataT>(data);
    childTest.match(capturedRequest.args(), [[`transactions`, data, `POST`]]);
    childTest.equal(transaction.data?.amount, data.amount);
    childTest.equal(transaction.data?.currency, data.currency);
    childTest.equal(transaction.data?.description, data.description);
    childTest.end();
  });

  t.test(`It should handle missing required fields`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    //we cast to any here so we can simulate a js user forgetting to put in a compulsory field, since by default Typescript should catch this during development
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      currency: `USD`,
      description: `Test transaction`,
      meta_data: {company_name: `Test Company`},
      precision: 100,
      amount: 10000,
    };
    const response = await transactions.create<meta_dataT>(data);

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.data, null);
    childTest.equal(response.status, 400);
    childTest.end();
  });

  t.test(`it should handle thrown errors during creation`, async childTest => {
    const thirdPartyRequest = createMockBlnkRequest(
      false,
      `Something went wrong`
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: CreateTransactions<meta_dataT> = {
      amount: 10000,
      currency: `USD`,
      description: `Test transaction`,
      meta_data: {company_name: `Test Company`},
      precision: 100,
      reference: `1234567890`,
    };

    const response = await transactions.create<meta_dataT>(data);

    childTest.match(capturedRequest.args(), [[`transactions`, data, `POST`]]);
    childTest.equal(response.data, null);
    childTest.equal(response.status, 500);
    childTest.equal(response.message, `Something went wrong`);
    childTest.end();
  });

  t.test(
    `it should handle meta_data if it is not an object`,
    async childTest => {
      const thirdPartyRequest = createMockBlnkRequest(
        false,
        `Something went wrong`
      );
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse
      );

      //we cast to any here so we can simulate a js user forgetting to put in a compulsory field, since by default Typescript should catch this during development
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {
        amount: 10000,
        currency: `USD`,
        description: `Test transaction`,
        meta_data: `Test Company`,
        precision: 100,
        reference: `1234567890`,
      };

      const response = await transactions.create<meta_dataT>(data);
      childTest.match(capturedRequest.args(), []);
      childTest.equal(response.data, null);
      childTest.equal(response.status, 400);
      childTest.equal(
        response.message,
        `meta_data must be a valid object if provided`
      );
    }
  );
});

tap.test(`Updates a transaction`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
  });
  const id = `1234`;
  t.test(`Updates a transaction status with valid data`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: UpdateTransactionStatus<{}> = {
      status: `commit`,
    };

    const transaction = await transactions.updateStatus(id, data);
    childTest.match(capturedRequest.args(), [
      [`transactions/inflight/${id}`, data, `PUT`],
    ]);
    childTest.equal(transaction.status, 200);
    childTest.end();
  });

  t.test(
    `Updates fails for a transaction status with invalid data`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {
        status: `commit`,
        meta_data: `Test Company`,
      };

      const transaction = await transactions.updateStatus(id, data);
      childTest.match(capturedRequest.args(), []);
      childTest.equal(transaction.data, null);
      childTest.equal(transaction.status, 400);
    }
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
tap.test(`Creates bulk transactions`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
  });
  type meta_dataT = {department: string; project: string};

  t.test(`Creates bulk transactions with valid data`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: BulkTransactions<meta_dataT> = {
      atomic: true,
      inflight: false,
      run_async: false,
      transactions: [
        {
          amount: 1000,
          currency: `USD`,
          description: `Test transaction 1`,
          meta_data: {department: `sales`, project: `Q4_campaign`},
          precision: 100,
          reference: `bulk_txn_001`,
          source: `@source_account_1`,
          destination: `@destination_account_1`,
        },
        {
          amount: 2000,
          currency: `USD`,
          description: `Test transaction 2`,
          meta_data: {department: `marketing`, project: `Q4_campaign`},
          precision: 100,
          reference: `bulk_txn_002`,
          source: `@source_account_2`,
          destination: `@destination_account_2`,
        },
      ],
    };

    const bulkResponse = await transactions.createBulk<meta_dataT>(data);
    childTest.match(capturedRequest.args(), [[`transactions/bulk`, data, `POST`]]);
    childTest.equal(bulkResponse.status, 201);
    childTest.end();
  });

  t.test(`Creates basic bulk transactions without optional flags`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: BulkTransactions<meta_dataT> = {
      transactions: [
        {
          amount: 1500,
          currency: `USD`,
          description: `Basic bulk transaction`,
          precision: 100,
          reference: `basic_bulk_txn_001`,
          source: `@source_account`,
          destination: `@destination_account`,
        },
      ],
    };

    const bulkResponse = await transactions.createBulk<meta_dataT>(data);
    childTest.match(capturedRequest.args(), [[`transactions/bulk`, data, `POST`]]);
    childTest.equal(bulkResponse.status, 201);
    childTest.end();
  });

  t.test(`Should handle empty transactions array`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: BulkTransactions<meta_dataT> = {
      atomic: true,
      transactions: [],
    };

    const response = await transactions.createBulk<meta_dataT>(data);
    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.data, null);
    childTest.equal(response.status, 400);
    childTest.match(response.message, /Transactions array cannot be empty/);
    childTest.end();
  });

  t.test(`Should handle invalid transaction data in bulk`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      atomic: true,
      transactions: [
        {
          amount: 1000,
          currency: `USD`,
          description: `Valid transaction`,
          precision: 100,
          reference: `valid_txn_001`,
          source: `@source_account`,
          destination: `@destination_account`,
        },
        {
          // Missing required fields
          amount: 2000,
          currency: `USD`,
          // missing description
          precision: 100,
          reference: `invalid_txn_002`,
        },
      ],
    };

    const response = await transactions.createBulk<meta_dataT>(data);
    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.data, null);
    childTest.equal(response.status, 400);
    childTest.match(response.message, /Transaction at index 1:/);
    childTest.end();
  });

  t.test(`Should handle duplicate references in bulk`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: BulkTransactions<meta_dataT> = {
      atomic: true,
      transactions: [
        {
          amount: 1000,
          currency: `USD`,
          description: `Transaction 1`,
          precision: 100,
          reference: `duplicate_ref`,
          source: `@source_account_1`,
          destination: `@destination_account_1`,
        },
        {
          amount: 2000,
          currency: `USD`,
          description: `Transaction 2`,
          precision: 100,
          reference: `duplicate_ref`, // Same reference as above
          source: `@source_account_2`,
          destination: `@destination_account_2`,
        },
      ],
    };

    const response = await transactions.createBulk<meta_dataT>(data);
    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.data, null);
    childTest.equal(response.status, 400);
    childTest.match(response.message, /All transactions must have unique references/);
    childTest.end();
  });

  t.test(`Should handle invalid boolean flags`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      atomic: `true`, // Should be boolean, not string
      transactions: [
        {
          amount: 1000,
          currency: `USD`,
          description: `Test transaction`,
          precision: 100,
          reference: `test_txn_001`,
          source: `@source_account`,
          destination: `@destination_account`,
        },
      ],
    };

    const response = await transactions.createBulk<meta_dataT>(data);
    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.data, null);
    childTest.equal(response.status, 400);
    childTest.match(response.message, /Atomic must be a boolean if provided/);
    childTest.end();
  });

  t.test(`Should handle thrown errors during bulk creation`, async childTest => {
    const thirdPartyRequest = createMockBlnkRequest(
      false,
      `Network error occurred`
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: BulkTransactions<meta_dataT> = {
      atomic: true,
      transactions: [
        {
          amount: 1000,
          currency: `USD`,
          description: `Test transaction`,
          precision: 100,
          reference: `test_txn_001`,
          source: `@source_account`,
          destination: `@destination_account`,
        },
      ],
    };

    const response = await transactions.createBulk<meta_dataT>(data);
    childTest.match(capturedRequest.args(), [[`transactions/bulk`, data, `POST`]]);
    childTest.equal(response.data, null);
    childTest.equal(response.status, 500);
    childTest.equal(response.message, `Network error occurred`);
    childTest.end();
  });

  t.test(`Should handle bulk transactions with multiple sources`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: BulkTransactions<meta_dataT> = {
      atomic: false,
      transactions: [
        {
          amount: 10000,
          currency: `USD`,
          description: `Multi-source transaction`,
          precision: 100,
          reference: `multi_source_txn_001`,
          sources: [
            {
              identifier: `@source_account_1`,
              distribution: `60%`,
              narration: `Primary source`,
            },
            {
              identifier: `@source_account_2`,
              distribution: `40%`,
              narration: `Secondary source`,
            },
          ],
          destination: `@destination_account`,
        },
      ],
    };

    const bulkResponse = await transactions.createBulk<meta_dataT>(data);
    childTest.match(capturedRequest.args(), [[`transactions/bulk`, data, `POST`]]);
    childTest.equal(bulkResponse.status, 201);
    childTest.end();
  });
});
