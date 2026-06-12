/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Search} from "../../../../src/blnk/endpoints/search";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {ReindexProgress} from "../../../../src/types/search";

tap.test(`Issue #35 — Search.getReindexStatus`, async t => {
  t.test(`getReindexStatus GETs search/reindex`, async tt => {
    const mockLogger = createMockLogger();
    const progress: ReindexProgress = {
      status: `in_progress`,
      phase: `indexing_transactions`,
      total_records: 100,
      processed_records: 50,
      started_at: `2026-06-12T02:03:08.81867638Z`,
    };
    const thirdPartyRequest = async <T, R>(
      endpoint: string,
      data: T,
      method: `POST` | `GET` | `PUT` | `DELETE`,
    ) => ({
      status: 200,
      message: `Success`,
      data: progress as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.getReindexStatus();

    tt.match(capturedRequest.args(), [[`search/reindex`, undefined, `GET`]]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.status, `in_progress`);
    tt.equal(response.data?.phase, `indexing_transactions`);
    tt.end();
  });

  t.test(`getReindexStatus forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <T, R>(
      endpoint: string,
      data: T,
      method: `POST` | `GET` | `PUT` | `DELETE`,
    ) => ({
      status: 404,
      message: `No reindex operation has been started`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const search = new Search(capturedRequest, mockLogger, FormatResponse);

    const response = await search.getReindexStatus();

    tt.match(capturedRequest.args(), [[`search/reindex`, undefined, `GET`]]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
