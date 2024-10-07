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
