/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Search} from "../../../../src/blnk/endpoints/search";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";

tap.test(`Issue #34 — Search.startReindex`, async t => {
  t.test(`startReindex posts to search/reindex with empty body`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 202);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.startReindex();

    tt.match(capturedRequest.args(), [[`search/reindex`, {}, `POST`]]);
    tt.equal(response.status, 202);
    tt.end();
  });

  t.test(`startReindex forwards batch_size`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 202);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.startReindex({batch_size: 500});

    tt.match(capturedRequest.args(), [
      [`search/reindex`, {batch_size: 500}, `POST`],
    ]);
    tt.equal(response.status, 202);
    tt.end();
  });

  t.test(`startReindex rejects invalid batch_size`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.startReindex({batch_size: 0});

    tt.match(capturedRequest.args(), []);
    tt.equal(response.status, 400);
    tt.equal(
      response.message,
      `batch_size must be a positive integer if provided`,
    );
    tt.end();
  });
});
