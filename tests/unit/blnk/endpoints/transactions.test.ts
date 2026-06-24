/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Transactions} from "../../../../src/blnk/endpoints/transactions";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {BlnkRequest} from "../../../../src/types/general";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {coreCreateTransactionReferenceResponse} from "../../../fixtures/coreCreateTransactionResponse";
import {
  BulkCommitInflightRequest,
  BulkVoidInflightRequest,
  BulkTransactions,
  CreateTransactionResponse,
  CreateTransactions,
  MAX_BULK_CREATE_ITEMS,
  MAX_BULK_INFLIGHT_ITEMS,
  RefundTransactionRequest,
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
      FormatResponse,
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

  t.test(
    `Creates a transaction with precise_amount only (issue #42)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: CreateTransactions<meta_dataT> = {
        precise_amount: 75000,
        currency: `USD`,
        description: `Precise amount transaction`,
        meta_data: {company_name: `Test Company`},
        precision: 100,
        reference: `precise_ref_001`,
        source: `@FundingPool`,
        destination: `bln_recipient`,
      };

      const transaction = await transactions.create<meta_dataT>(data);
      childTest.match(capturedRequest.args(), [[`transactions`, data, `POST`]]);
      childTest.equal(transaction.status, 201);
      childTest.end();
    },
  );

  t.test(
    `Creates a transaction with ISO date strings unchanged (issue #41)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: CreateTransactions<meta_dataT> = {
        amount: 10000,
        currency: `USD`,
        description: `Scheduled inflight transaction`,
        meta_data: {company_name: `Test Company`},
        precision: 100,
        reference: `issue_41_ref_001`,
        source: `@FundingPool`,
        destination: `bln_recipient`,
        inflight: true,
        scheduled_for: `2025-12-31T23:59:59Z`,
        inflight_expiry_date: `2025-08-01T08:00:00Z`,
      };

      const transaction = await transactions.create<meta_dataT>(data);

      childTest.match(capturedRequest.args(), [[`transactions`, data, `POST`]]);
      childTest.equal(transaction.status, 201);
      childTest.end();
    },
  );

  t.test(
    `Creates a transaction with decimal distribution split (issue #41)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: CreateTransactions<meta_dataT> = {
        amount: 1000,
        currency: `USD`,
        description: `Decimal distribution split`,
        meta_data: {company_name: `Test Company`},
        precision: 100,
        reference: `issue_41_ref_002`,
        source: `@FundingPool`,
        destinations: [
          {identifier: `bln_fee`, distribution: `240.23`},
          {identifier: `bln_recipient`, distribution: `left`},
        ],
      };

      const transaction = await transactions.create<meta_dataT>(data);

      childTest.match(capturedRequest.args(), [[`transactions`, data, `POST`]]);
      childTest.equal(transaction.status, 201);
      childTest.end();
    },
  );

  t.test(
    `forwards atomic on split transaction create (issue #5)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: CreateTransactions<meta_dataT> = {
        amount: 1000,
        currency: `USD`,
        description: `Atomic split transaction`,
        meta_data: {company_name: `Test Company`},
        precision: 100,
        reference: `issue_5_atomic_split`,
        source: `@FundingPool`,
        destinations: [
          {identifier: `bln_fee`, distribution: `240.23`},
          {identifier: `bln_recipient`, distribution: `left`},
        ],
        atomic: true,
        skip_queue: true,
      };

      const transaction = await transactions.create<meta_dataT>(data);

      childTest.match(capturedRequest.args(), [[`transactions`, data, `POST`]]);
      childTest.equal(transaction.status, 201);
      childTest.end();
    },
  );

  t.test(`rejects invalid atomic on create (issue #5)`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const data = {
      amount: 1000,
      currency: `USD`,
      description: `Invalid atomic`,
      precision: 100,
      reference: `issue_5_bad_atomic`,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `50%`},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
      atomic: `true`,
    } as unknown as CreateTransactions<meta_dataT>;

    const response = await transactions.create<meta_dataT>(data);

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(response.message, `atomic must be a boolean if provided.`);
    childTest.end();
  });

  t.test(`returns Core create response fields (issue #43)`, async childTest => {
    const coreResponse = coreCreateTransactionReferenceResponse;
    const responseReturningRequest: BlnkRequest = async <R>() => ({
      status: 201,
      message: `Success`,
      data: coreResponse as unknown as R,
    });

    const transactions = new Transactions(
      responseReturningRequest,
      mockLogger,
      FormatResponse,
    );

    const data: CreateTransactions<meta_dataT> = {
      amount: 1250.34,
      currency: `USD`,
      description: `Card payment on Stripe`,
      meta_data: {company_name: `Test Company`},
      precision: 100,
      reference: `ref_2ye281ewiu-1e17-dh17-eh18728hd245`,
      source: `@WorldUSD`,
      destination: `@MyBalance`,
      allow_overdraft: false,
      inflight: false,
    };

    const transaction = await transactions.create<meta_dataT>(data);

    childTest.equal(transaction.status, 201);
    childTest.equal(transaction.data?.hash, coreResponse.hash);
    childTest.equal(
      transaction.data?.parent_transaction,
      coreResponse.parent_transaction,
    );
    childTest.equal(
      transaction.data?.allow_overdraft,
      coreResponse.allow_overdraft,
    );
    childTest.equal(transaction.data?.inflight, coreResponse.inflight);
    childTest.equal(
      transaction.data?.scheduled_for,
      coreResponse.scheduled_for,
    );
    childTest.equal(
      transaction.data?.inflight_expiry_date,
      coreResponse.inflight_expiry_date,
    );
    childTest.equal(
      transaction.data?.inflight_commit_date,
      coreResponse.inflight_commit_date,
    );
    childTest.end();
  });

  t.test(
    `CreateTransactionResponse type includes gap fields (issue #43)`,
    async childTest => {
      const sample: CreateTransactionResponse<meta_dataT> = {
        ...coreCreateTransactionReferenceResponse,
        meta_data: {company_name: `Test Company`},
      };

      childTest.ok(sample.hash);
      childTest.type(sample.parent_transaction, `string`);
      childTest.type(sample.allow_overdraft, `boolean`);
      childTest.ok(sample.inflight_expiry_date);
      childTest.ok(sample.inflight_commit_date);
      childTest.ok(sample.scheduled_for);
      childTest.end();
    },
  );

  t.test(
    `Creates a transaction with #40 fields and serializes dates (issue #40)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const effectiveDate = new Date(`2025-02-15T10:30:00.000Z`);
      const data: CreateTransactions<meta_dataT> = {
        amount: 10000,
        currency: `USD`,
        description: `Backdated skip-queue transaction`,
        meta_data: {company_name: `Test Company`},
        precision: 100,
        reference: `issue_40_ref_001`,
        source: `@FundingPool`,
        destination: `bln_recipient`,
        skip_queue: true,
        effective_date: effectiveDate,
        inflight_commit_date: `2025-06-01T12:00:00Z`,
      };

      const transaction = await transactions.create<meta_dataT>(data);

      childTest.match(capturedRequest.args(), [
        [
          `transactions`,
          {
            ...data,
            effective_date: `2025-02-15T10:30:00Z`,
          },
          `POST`,
        ],
      ]);
      childTest.equal(transaction.status, 201);
      childTest.end();
    },
  );

  t.test(`It should handle missing required fields`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
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
      `Something went wrong`,
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
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
        `Something went wrong`,
      );
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
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
        `meta_data must be a valid object if provided`,
      );
    },
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
      FormatResponse,
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
    `Partial commit forwards precise_amount (issue #45)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: UpdateTransactionStatus<{}> = {
        status: `commit`,
        precise_amount: 50000,
      };

      const transaction = await transactions.updateStatus(id, data);
      childTest.match(capturedRequest.args(), [
        [`transactions/inflight/${id}`, data, `PUT`],
      ]);
      childTest.equal(transaction.status, 200);
      childTest.end();
    },
  );

  t.test(
    `Updates fails for a transaction status with invalid data`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
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
    },
  );

  t.test(
    `updateStatus forwards skip_queue on request (issue #117)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: UpdateTransactionStatus<{}> = {
        status: `commit`,
        skip_queue: true,
      };

      const transaction = await transactions.updateStatus(id, data);
      childTest.match(capturedRequest.args(), [
        [`transactions/inflight/${id}`, data, `PUT`],
      ]);
      childTest.equal(transaction.status, 200);
      childTest.end();
    },
  );

  t.test(
    `updateStatus rejects invalid skip_queue (issue #117)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data = {
        status: `commit`,
        skip_queue: `true`,
      } as unknown as UpdateTransactionStatus<{}>;

      const transaction = await transactions.updateStatus(id, data);
      childTest.match(capturedRequest.args(), []);
      childTest.equal(transaction.status, 400);
      childTest.match(
        transaction.message,
        /skip_queue must be a boolean if provided/,
      );
      childTest.end();
    },
  );
});

tap.test(`GET transaction by id`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
  });

  t.test(`get calls correct endpoint (issue #12)`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const transactionId = `txn_issue12_abc123`;
    const response = await transactions.get(transactionId);
    childTest.match(capturedRequest.args(), [
      [`transactions/${transactionId}`, undefined, `GET`],
    ]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(`get rejects empty transaction id (issue #12)`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const response = await transactions.get(``);
    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(response.message, `transaction id is required`);
    childTest.end();
  });
});

tap.test(`GET transaction lineage`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
  });

  t.test(`getLineage calls correct endpoint (issue #13)`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const transactionId = `txn_issue13_abc123`;
    const response = await transactions.getLineage(transactionId);
    childTest.match(capturedRequest.args(), [
      [`transactions/${transactionId}/lineage`, undefined, `GET`],
    ]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(
    `getLineage rejects empty transaction id (issue #13)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const response = await transactions.getLineage(``);
      childTest.match(capturedRequest.args(), []);
      childTest.equal(response.status, 400);
      childTest.equal(response.message, `transaction id is required`);
      childTest.end();
    },
  );
});

tap.test(`POST recover queued transactions`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
  });

  t.test(`recoverQueue calls default endpoint (issue #17)`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const response = await transactions.recoverQueue();
    childTest.match(capturedRequest.args(), [
      [`transactions/recover`, undefined, `POST`],
    ]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(
    `recoverQueue forwards threshold query param (issue #17)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const response = await transactions.recoverQueue({threshold: `5m`});
      childTest.match(capturedRequest.args(), [
        [`transactions/recover?threshold=5m`, undefined, `POST`],
      ]);
      childTest.equal(response.status, 200);
      childTest.end();
    },
  );

  t.test(
    `recoverQueue rejects invalid threshold before request (issue #17)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const response = await transactions.recoverQueue({threshold: `bogus`});
      childTest.match(capturedRequest.args(), []);
      childTest.equal(response.status, 400);
      childTest.equal(
        response.message,
        `threshold must be a valid duration string (e.g. 5m, 1h).`,
      );
      childTest.end();
    },
  );
});

tap.test(`GET transaction by reference`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
  });

  t.test(
    `getByReference calls correct endpoint (issue #14)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const reference = `ref_issue14_abc123`;
      const response = await transactions.getByReference(reference);
      childTest.match(capturedRequest.args(), [
        [
          `transactions/reference/${encodeURIComponent(reference)}`,
          undefined,
          `GET`,
        ],
      ]);
      childTest.equal(response.status, 200);
      childTest.end();
    },
  );

  t.test(
    `getByReference path-escapes special characters (issue #14)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const reference = `ref/with space?query#hash%25`;
      await transactions.getByReference(reference);
      childTest.match(capturedRequest.args(), [
        [
          `transactions/reference/${encodeURIComponent(reference)}`,
          undefined,
          `GET`,
        ],
      ]);
      childTest.end();
    },
  );

  t.test(
    `getByReference rejects empty reference (issue #14)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const response = await transactions.getByReference(``);
      childTest.match(capturedRequest.args(), []);
      childTest.equal(response.status, 400);
      childTest.equal(response.message, `reference is required`);
      childTest.end();
    },
  );
});

tap.test(`Refunds a transaction`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
  });
  const id = `txn_refund_1234`;

  t.test(
    `refund without body keeps backward-compatible call (issue #46)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const refundResponse = await transactions.refund(id);
      childTest.match(capturedRequest.args(), [
        [`refund-transaction/${id}`, null, `POST`],
      ]);
      childTest.equal(refundResponse.status, 201);
      childTest.end();
    },
  );

  t.test(
    `refund forwards skip_queue on request body (issue #46)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const options = {skip_queue: true};
      const refundResponse = await transactions.refund(id, options);
      childTest.match(capturedRequest.args(), [
        [`refund-transaction/${id}`, options, `POST`],
      ]);
      childTest.equal(refundResponse.status, 201);
      childTest.end();
    },
  );

  t.test(`refund rejects invalid skip_queue (issue #46)`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const refundResponse = await transactions.refund(id, {
      skip_queue: `true`,
    } as unknown as RefundTransactionRequest);
    childTest.match(capturedRequest.args(), []);
    childTest.equal(refundResponse.status, 400);
    childTest.equal(
      refundResponse.message,
      `skip_queue must be a boolean if provided.`,
    );
    childTest.end();
  });
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
      FormatResponse,
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
    childTest.match(capturedRequest.args(), [
      [`transactions/bulk`, data, `POST`],
    ]);
    childTest.equal(bulkResponse.status, 201);
    childTest.end();
  });

  t.test(
    `createBulk serializes date fields on each transaction (issue #40)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const effectiveDate = new Date(`2025-02-15T10:30:00.000Z`);
      const scheduledDate = new Date(`2025-07-01T08:00:00.000Z`);
      const data: BulkTransactions<meta_dataT> = {
        transactions: [
          {
            amount: 1000,
            currency: `USD`,
            description: `Bulk txn with effective_date`,
            meta_data: {department: `sales`, project: `Q4_campaign`},
            precision: 100,
            reference: `bulk_txn_date_001`,
            source: `@source_account_1`,
            destination: `@destination_account_1`,
            effective_date: effectiveDate,
            inflight_commit_date: `2025-06-01T12:00:00Z`,
          },
          {
            amount: 2000,
            currency: `USD`,
            description: `Bulk txn with scheduled_for`,
            meta_data: {department: `marketing`, project: `Q4_campaign`},
            precision: 100,
            reference: `bulk_txn_date_002`,
            source: `@source_account_2`,
            destination: `@destination_account_2`,
            scheduled_for: scheduledDate,
            skip_queue: true,
          },
        ],
      };

      const bulkResponse = await transactions.createBulk<meta_dataT>(data);

      childTest.match(capturedRequest.args(), [
        [
          `transactions/bulk`,
          {
            transactions: [
              {
                ...data.transactions[0],
                effective_date: `2025-02-15T10:30:00Z`,
              },
              {
                ...data.transactions[1],
                scheduled_for: `2025-07-01T08:00:00Z`,
              },
            ],
          },
          `POST`,
        ],
      ]);
      childTest.equal(bulkResponse.status, 201);
      childTest.end();
    },
  );

  t.test(
    `Creates basic bulk transactions without optional flags`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
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
      childTest.match(capturedRequest.args(), [
        [`transactions/bulk`, data, `POST`],
      ]);
      childTest.equal(bulkResponse.status, 201);
      childTest.end();
    },
  );

  t.test(`Should handle empty transactions array`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
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
      FormatResponse,
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
      FormatResponse,
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
    childTest.match(
      response.message,
      /All transactions must have unique references/,
    );
    childTest.end();
  });

  t.test(`Should handle invalid boolean flags`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
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

  t.test(
    `Should handle thrown errors during bulk creation`,
    async childTest => {
      const thirdPartyRequest = createMockBlnkRequest(
        false,
        `Network error occurred`,
      );
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
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
      childTest.match(capturedRequest.args(), [
        [`transactions/bulk`, data, `POST`],
      ]);
      childTest.equal(response.data, null);
      childTest.equal(response.status, 500);
      childTest.equal(response.message, `Network error occurred`);
      childTest.end();
    },
  );

  t.test(
    `Should handle bulk transactions with multiple sources`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
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
      childTest.match(capturedRequest.args(), [
        [`transactions/bulk`, data, `POST`],
      ]);
      childTest.equal(bulkResponse.status, 201);
      childTest.end();
    },
  );

  t.test(
    `createBulk forwards skip_queue on bulk request (issue #44)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: BulkTransactions<meta_dataT> = {
        skip_queue: true,
        transactions: [
          {
            amount: 1000,
            currency: `USD`,
            description: `Bulk txn with skip_queue`,
            meta_data: {department: `sales`, project: `Q4_campaign`},
            precision: 100,
            reference: `bulk_skip_queue_001`,
            source: `@source_account_1`,
            destination: `@destination_account_1`,
          },
          {
            amount: 2000,
            currency: `USD`,
            description: `Bulk txn 2`,
            meta_data: {department: `marketing`, project: `Q4_campaign`},
            precision: 100,
            reference: `bulk_skip_queue_002`,
            source: `@source_account_2`,
            destination: `@destination_account_2`,
          },
        ],
      };

      const bulkResponse = await transactions.createBulk<meta_dataT>(data);

      childTest.match(capturedRequest.args(), [
        [`transactions/bulk`, data, `POST`],
      ]);
      childTest.equal(bulkResponse.status, 201);
      childTest.end();
    },
  );

  t.test(
    `createBulk rejects oversized transactions array (issue #123)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: BulkTransactions<meta_dataT> = {
        transactions: Array.from({length: MAX_BULK_CREATE_ITEMS + 1}, (_, i) => ({
          amount: 1000,
          currency: `USD`,
          description: `Bulk txn ${i}`,
          precision: 100,
          reference: `bulk_max_ref_${i}`,
          source: `@source_account`,
          destination: `@destination_account`,
        })),
      };

      const response = await transactions.createBulk<meta_dataT>(data);
      childTest.match(capturedRequest.args(), []);
      childTest.equal(response.data, null);
      childTest.equal(response.status, 400);
      childTest.match(
        response.message,
        new RegExp(
          `Too many transactions; max is ${MAX_BULK_CREATE_ITEMS}\\.`,
        ),
      );
      childTest.end();
    },
  );
});

tap.test(`Issue #15 — bulkCommitInflight`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
  });

  t.test(`commits inflight transactions with valid data`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const data: BulkCommitInflightRequest = {
      transactions: [
        {transaction_id: `txn_11111111-1111-4111-8111-111111111111`},
        {
          transaction_id: `txn_22222222-2222-4222-8222-222222222222`,
          amount: 40,
        },
        {
          transaction_id: `txn_33333333-3333-4333-8333-333333333333`,
          precise_amount: 125034,
        },
      ],
    };

    const response = await transactions.bulkCommitInflight(data);

    childTest.match(capturedRequest.args(), [
      [`transactions/inflight/bulk/commit`, data, `POST`],
    ]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(`rejects empty transactions array`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await transactions.bulkCommitInflight({transactions: []});

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(response.message, `Transactions array cannot be empty.`);
    childTest.end();
  });

  t.test(`rejects too many transactions`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const items = Array.from({length: MAX_BULK_INFLIGHT_ITEMS + 1}, () => ({
      transaction_id: `txn_test`,
    }));

    const response = await transactions.bulkCommitInflight({
      transactions: items,
    });

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(
      response.message,
      `Too many transactions; max is ${MAX_BULK_INFLIGHT_ITEMS}.`,
    );
    childTest.end();
  });

  t.test(`rejects missing transaction_id`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await transactions.bulkCommitInflight({
      transactions: [{transaction_id: ``}],
    });

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(response.message, `transaction_id is required at index 0.`);
    childTest.end();
  });

  t.test(
    `bulkCommitInflight forwards skip_queue on request (issue #117)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: BulkCommitInflightRequest = {
        skip_queue: true,
        transactions: [
          {transaction_id: `txn_11111111-1111-4111-8111-111111111111`},
        ],
      };

      const response = await transactions.bulkCommitInflight(data);
      childTest.match(capturedRequest.args(), [
        [`transactions/inflight/bulk/commit`, data, `POST`],
      ]);
      childTest.equal(response.status, 200);
      childTest.end();
    },
  );
});

tap.test(`Issue #16 — bulkVoidInflight`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
  });

  t.test(`voids inflight transactions with valid data`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const data: BulkVoidInflightRequest = {
      transaction_ids: [
        `txn_11111111-1111-4111-8111-111111111111`,
        `txn_22222222-2222-4222-8222-222222222222`,
      ],
    };

    const response = await transactions.bulkVoidInflight(data);

    childTest.match(capturedRequest.args(), [
      [`transactions/inflight/bulk/void`, data, `POST`],
    ]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(`rejects empty transaction_ids array`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await transactions.bulkVoidInflight({transaction_ids: []});

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(response.message, `transaction_ids array cannot be empty.`);
    childTest.end();
  });

  t.test(`rejects too many transaction_ids`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const transaction_ids = Array.from(
      {length: MAX_BULK_INFLIGHT_ITEMS + 1},
      () => `txn_test`,
    );

    const response = await transactions.bulkVoidInflight({transaction_ids});

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(
      response.message,
      `Too many transaction_ids; max is ${MAX_BULK_INFLIGHT_ITEMS}.`,
    );
    childTest.end();
  });

  t.test(`rejects missing transaction_id`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const transactions = new Transactions(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await transactions.bulkVoidInflight({
      transaction_ids: [``],
    });

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(response.message, `transaction_id is required at index 0.`);
    childTest.end();
  });

  t.test(
    `bulkVoidInflight forwards skip_queue on request (issue #117)`,
    async childTest => {
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const transactions = new Transactions(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: BulkVoidInflightRequest = {
        skip_queue: true,
        transaction_ids: [`txn_11111111-1111-4111-8111-111111111111`],
      };

      const response = await transactions.bulkVoidInflight(data);
      childTest.match(capturedRequest.args(), [
        [`transactions/inflight/bulk/void`, data, `POST`],
      ]);
      childTest.equal(response.status, 200);
      childTest.end();
    },
  );
});
