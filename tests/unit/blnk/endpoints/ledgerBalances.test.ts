/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {LedgerBalances} from "../../../../src/blnk/endpoints/ledgerBalances";
import {
  createMockLogger,
  createMockBlnkRequest,
  ledgerId,
} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {CreateLedgerBalance} from "../../../../src/types/ledgerBalances";

tap.test(`Ledger Balance Tests`, t => {
  const mockLogger = createMockLogger();

  t.test(
    `it should create a ledger balance when valid data is provided`,
    async tt => {
      const thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
      const capturedRequest = tt.captureFn(thirdPartyRequest);
      const ledgerBalance = new LedgerBalances(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: CreateLedgerBalance<{company_name: string}> = {
        currency: `USD`,
        ledger_id: ledgerId,
        meta_data: {
          company_name: `Test Company`,
        },
      };

      const response = await ledgerBalance.create<{company_name: string}>(data);

      //verify that the request function was called and with the right parameters
      tt.match(capturedRequest.args(), [
        [
          `balances`,
          {
            currency: `USD`,
            ledger_id: ledgerId,
            meta_data: {
              company_name: `Test Company`,
            },
          },
          `POST`,
        ],
      ]);
      tt.equal(response.status, 201, `Response is 201`);
      tt.equal(response.data?.ledger_id, ledgerId);
      tt.end();
    },
  );
  t.test(`it should handle missing optional fields`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const data: CreateLedgerBalance<{company_name: string}> = {
      currency: `USD`,
      ledger_id: ledgerId,
      meta_data: {
        company_name: `Test Company`,
      },
    };

    const response = await ledgerBalance.create<{company_name: string}>(data);

    //verify that the request function was called and with the right parameters
    tt.match(capturedRequest.args(), [
      [
        `balances`,
        {
          currency: `USD`,
          ledger_id: `123456`,
          meta_data: {
            company_name: `Test Company`,
          },
        },
        `POST`,
      ],
    ]);
    tt.equal(response.status, 201, `Response is 200`);
    tt.equal(response.data?.identity_id, undefined);
    tt.end();
  });
  t.test(`it should handle missing required fields`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    //using any here to simulate a developer passing in any and missing required data types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      currency: `USD`,
      meta_data: {
        company_name: `Test Company`,
      },
    };

    const response = await ledgerBalance.create<{company_name: string}>(data);

    //verify that the request function was called and with the right parameters
    //request won't get called since this fails validation, so we use empty array to compare the captured args
    tt.match(capturedRequest.args(), []);
    tt.equal(response.status, 400, `Response is 500`);
    tt.equal(response.data, null);
    tt.end();
  });
  t.test(`it should handle thrown during balance creation`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, `Network Error`);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const data: CreateLedgerBalance<{company_name: string}> = {
      currency: `USD`,
      ledger_id: ledgerId,
      meta_data: {
        company_name: `Test Company`,
      },
    };

    const response = await ledgerBalance.create<{company_name: string}>(data);

    //verify that the request function was called and with the right parameters
    tt.match(capturedRequest.args(), [[`balances`, data, `POST`]]);

    tt.equal(response.status, 500, `Response is 500`);
    tt.equal(response.data, null);
    tt.equal(response.message, `Network Error`);
    tt.end();
  });
  t.test(`it should handle meta_data if it is not an object`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    //allow any for this line, so we can test what happens if a dev passes in a data type for meta_data that doesnt meet the requirements for Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      currency: `USD`,
      ledger_id: ledgerId,
      meta_data: 5,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await ledgerBalance.create<any>(data);

    //verify that the request function was called and with the right parameters
    tt.match(capturedRequest.args(), []);

    tt.equal(response.status, 400, `Response is 400`);
    tt.equal(response.data, null);
    tt.equal(response.message, `meta_data must be a valid object if provided`);
    tt.end();
  });

  t.test(`getLineage calls correct endpoint (issue #7)`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const balanceId = `bln_5ce86029-3c2e-4e2a-aae2-7fb931ca4c4f`;
    const response = await ledgerBalance.getLineage(balanceId);

    tt.match(capturedRequest.args(), [
      [`balances/${balanceId}/lineage`, undefined, `GET`],
    ]);
    tt.equal(response.status, 200);
    tt.end();
  });

  t.test(`getLineage rejects empty balance id (issue #7)`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const response = await ledgerBalance.getLineage(``);

    tt.match(capturedRequest.args(), []);
    tt.equal(response.status, 400);
    tt.equal(response.message, `balance id is required`);
    tt.end();
  });

  t.test(`getByIndicator calls correct endpoint (issue #8)`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const indicator = `@World`;
    const currency = `USD`;
    const response = await ledgerBalance.getByIndicator(indicator, currency);

    tt.match(capturedRequest.args(), [
      [
        `balances/indicator/${encodeURIComponent(indicator)}/currency/${encodeURIComponent(currency)}`,
        undefined,
        `GET`,
      ],
    ]);
    tt.equal(response.status, 200);
    tt.end();
  });

  t.test(
    `getByIndicator path-escapes special characters (issue #8)`,
    async tt => {
      const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
      const capturedRequest = tt.captureFn(thirdPartyRequest);
      const ledgerBalance = new LedgerBalances(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const indicator = `@user/name`;
      const currency = `USD/EUR`;
      await ledgerBalance.getByIndicator(indicator, currency);

      tt.match(capturedRequest.args(), [
        [
          `balances/indicator/${encodeURIComponent(indicator)}/currency/${encodeURIComponent(currency)}`,
          undefined,
          `GET`,
        ],
      ]);
      tt.end();
    },
  );

  t.test(`getByIndicator rejects empty indicator (issue #8)`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const response = await ledgerBalance.getByIndicator(``, `USD`);

    tt.match(capturedRequest.args(), []);
    tt.equal(response.status, 400);
    tt.equal(response.message, `indicator is required`);
    tt.end();
  });

  t.test(`getByIndicator rejects empty currency (issue #8)`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const response = await ledgerBalance.getByIndicator(`@World`, ``);

    tt.match(capturedRequest.args(), []);
    tt.equal(response.status, 400);
    tt.equal(response.message, `currency is required`);
    tt.end();
  });

  t.test(
    `updateIdentity calls PUT /balances/{id}/identity (issue #9)`,
    async tt => {
      const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
      const capturedRequest = tt.captureFn(thirdPartyRequest);
      const ledgerBalance = new LedgerBalances(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const balanceId = `bln_5ce86029-3c2e-4e2a-aae2-7fb931ca4c4f`;
      const data = {identity_id: `idt_3b63c8da-af29-4cc3-ad38-df17d87456e6`};
      const response = await ledgerBalance.updateIdentity(balanceId, data);

      tt.match(capturedRequest.args(), [
        [`balances/${balanceId}/identity`, data, `PUT`],
      ]);
      tt.equal(response.status, 200);
      tt.end();
    },
  );

  t.test(`updateIdentity rejects empty balance id (issue #9)`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const response = await ledgerBalance.updateIdentity(``, {
      identity_id: `idt_3b63c8da-af29-4cc3-ad38-df17d87456e6`,
    });

    tt.match(capturedRequest.args(), []);
    tt.equal(response.status, 400);
    tt.equal(response.message, `balance id is required`);
    tt.end();
  });

  t.test(`updateIdentity rejects missing identity_id (issue #9)`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await ledgerBalance.updateIdentity(`bln_123`, {} as any);

    tt.match(capturedRequest.args(), []);
    tt.equal(response.status, 400);
    tt.equal(response.message, `identity_id is required`);
    tt.end();
  });

  t.end();
});
