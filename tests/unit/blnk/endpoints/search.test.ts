/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Search} from "../../../../src/blnk/endpoints/search";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {SearchParams} from "../../../../src/types/search";

tap.test(`Issue #51 — Search.search identities collection`, async t => {
  t.test(`search forwards identities collection`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const params: SearchParams = {
      q: `jane`,
      query_by: `first_name,last_name,email_address`,
      per_page: 10,
    };

    const response = await search.search(params, `identities`);

    childTest.match(capturedRequest.args(), [
      [`search/identities`, params, `POST`],
    ]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(`search rejects invalid collection`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.search(
      {q: `test`},
      `accounts` as `identities`,
    );

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(
      response.message,
      `collection must be ledgers, transactions, balances, or identities`,
    );
    childTest.end();
  });

  t.test(`search rejects empty q`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.search({q: `   `}, `identities`);

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(response.message, `Field "q" must be filled`);
    childTest.end();
  });

  t.test(`search rejects invalid per_page`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.search({q: `*`, per_page: 500}, `identities`);

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(
      response.message,
      `per_page must be an integer between 1 and 250 if provided`,
    );
    childTest.end();
  });
});
