/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../../mocks/blnkClientMocks";
import {BlnkRequest} from "../../../../../src/types/general";
import {Ledgers} from "../../../../../src/blnk/endpoints/ledgers";
import {FormatResponse} from "../../../../../src/blnk/utils/httpClient";
import {CreateLedger} from "../../../../../src/types/ledger";

tap.test(`Ledger Tests`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true);
  });
  type meta_dataT = {company_name: string};

  t.test(`Creates a ledger with valid data`, async tt => {
    const capturedRequest = t.captureFn(thirdPartyRequest);
    const ledger = new Ledgers(capturedRequest, mockLogger, FormatResponse);
    const data: CreateLedger<meta_dataT> = {
      name: `My Ledger`,
      meta_data: {
        company_name: `Test Company`,
      },
    };

    const response = await ledger.create<meta_dataT>(data);
    tt.match(capturedRequest.args(), [[`ledgers`, data, `POST`]]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.name, data.name);
  });

  t.test(`it should handle missing required fields`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgers = new Ledgers(capturedRequest, mockLogger, FormatResponse);

    //using any here to simulate a developer passing in any and missing required data types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      meta_data: {
        company_name: `Test Company`,
      },
    };

    const response = await ledgers.create<{company_name: string}>(data);

    //verify that the request function was called and with the right parameters
    //request won't get called since this fails validation, so we use empty array to compare the captured args
    tt.match(capturedRequest.args(), []);
    tt.equal(response.status, 400, `Response is 400`);
    tt.equal(response.data, null);
  });

  t.test(`it should handle thrown errors gracefully`, async tt => {
    const thirdPartyRequest = createMockBlnkRequest(true, `Network Error`);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const ledgerBalance = new Ledgers(
      capturedRequest,
      mockLogger,
      FormatResponse
    );

    const data: CreateLedger<{company_name: string}> = {
      name: `Test Ledger`,
      meta_data: {
        company_name: `Test Company`,
      },
    };

    const response = await ledgerBalance.create<{company_name: string}>(data);

    //verify that the request function was called and with the right parameters
    tt.match(capturedRequest.args(), [[`ledgers`, data, `POST`]]);

    tt.equal(response.status, 500, `Response is 500`);
    tt.equal(response.data, null);
    tt.equal(response.message, `Network Error`);
  });
});
