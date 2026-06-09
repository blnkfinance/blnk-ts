/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {System} from "../../../../src/blnk/endpoints/system";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {BlnkRequest} from "../../../../src/types/general";

tap.test(`GET system health`, async t => {
  const mockLogger = createMockLogger();
  let thirdPartyRequest: BlnkRequest;
  t.beforeEach(() => {
    thirdPartyRequest = createMockBlnkRequest(true, undefined, 200);
  });

  t.test(`health calls GET /health (issue #39)`, async childTest => {
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const system = new System(capturedRequest, mockLogger, FormatResponse);

    const response = await system.health();
    childTest.match(capturedRequest.args(), [[`health`, undefined, `GET`]]);
    childTest.equal(response.status, 200);
    childTest.end();
  });

  t.test(`health handles thrown errors (issue #39)`, async childTest => {
    const errorRequest = createMockBlnkRequest(false, `Network error occurred`);
    const capturedRequest = childTest.captureFn(errorRequest);
    const system = new System(capturedRequest, mockLogger, FormatResponse);

    const response = await system.health();
    childTest.match(capturedRequest.args(), [[`health`, undefined, `GET`]]);
    childTest.equal(response.status, 500);
    childTest.equal(response.message, `Network error occurred`);
    childTest.end();
  });
});
