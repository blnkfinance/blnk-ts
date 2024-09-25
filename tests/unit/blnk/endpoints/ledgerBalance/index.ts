/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {LedgerBalances} from "../../../../../src/blnk/endpoints/ledgerBalances";
import {
  createMockLogger,
  createMockBlnkRequest,
  ledgerId,
} from "../../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../../src/blnk/utils/httpClient";
import {CreateLedgerBalance} from "../../../../../src/types/ledgerBalances";

tap.test(`Ledger Balance Tests`, t => {
  const mockLogger = createMockLogger();
  t.beforeEach(() => {});

  t.test(
    `it should create a ledger balance when valid data is provided`,
    async tt => {
      const thirdPartyRequest = createMockBlnkRequest(true);
      const capturedRequest = tt.captureFn(thirdPartyRequest);
      const ledgerBalance = new LedgerBalances(
        capturedRequest,
        mockLogger,
        FormatResponse
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
      tt.equal(response.status, 200, `Response is 200`);
      tt.equal(response.data?.ledger_id, ledgerId);
      tt.end();
    }
  );
  t.test(`it should handle missing optional fields`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new LedgerBalances(
      capturedRequest,
      mockLogger,
      FormatResponse
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
    tt.equal(response.status, 200, `Response is 200`);
    tt.equal(response.data?.identity_id, undefined);
    tt.end();
  });
  t.end();
});
