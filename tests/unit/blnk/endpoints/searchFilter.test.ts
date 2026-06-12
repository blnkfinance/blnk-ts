/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Search} from "../../../../src/blnk/endpoints/search";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {FilterParams} from "../../../../src/types/search";

tap.test(`Issue #33 — Search.filter`, async t => {
  t.test(`filter forwards transactions collection`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const params: FilterParams = {
      filters: [{field: `status`, operator: `eq`, value: `APPLIED`}],
      logical_operator: `and`,
      sort_by: `created_at`,
      sort_order: `desc`,
      include_count: true,
      limit: 20,
      offset: 0,
    };

    const response = await search.filter(params, `transactions`);

    childTest.match(capturedRequest.args(), [
      [`transactions/filter`, params, `POST`],
    ]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(`filter forwards ledgers collection`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const params: FilterParams = {
      filters: [{field: `name`, operator: `like`, value: `%General%`}],
    };

    const response = await search.filter(params, `ledgers`);

    childTest.match(capturedRequest.args(), [
      [`ledgers/filter`, params, `POST`],
    ]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(`filter rejects invalid collection`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.filter(
      {filters: [{field: `status`, operator: `eq`, value: `APPLIED`}]},
      `accounts` as `transactions`,
    );

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.end();
  });

  t.test(`filter rejects missing filter value`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.filter(
      {filters: [{field: `status`, operator: `eq`}]},
      `transactions`,
    );

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(
      response.message,
      `filters[0].value is required for operator "eq"`,
    );
    childTest.end();
  });

  t.test(`filter rejects invalid limit`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.filter(
      {
        filters: [{field: `status`, operator: `eq`, value: `APPLIED`}],
        limit: 500,
      },
      `transactions`,
    );

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(
      response.message,
      `limit must be an integer between 1 and 100 if provided`,
    );
    childTest.end();
  });
});
