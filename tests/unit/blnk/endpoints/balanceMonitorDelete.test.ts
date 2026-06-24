/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {BalanceMonitor} from "../../../../src/blnk/endpoints/balanceMonitors";
import {Blnk} from "../../../../src/blnk/endpoints/baseBlnkClient";
import {
  createMockBlnkClientOptions,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {DeleteBalanceMonitorResp} from "../../../../src/types/balanceMonitor";

tap.test(`Issue #120 — BalanceMonitor.delete`, async t => {
  const deleteResponse: DeleteBalanceMonitorResp = {
    message: `BalanceMonitor deleted successfully`,
  };

  t.test(`delete DELETEs balance-monitors/{id}`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: deleteResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await balanceMonitor.delete(`mon_test_123`);

    tt.match(capturedRequest.args(), [
      [`balance-monitors/mon_test_123`, undefined, `DELETE`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.message, `BalanceMonitor deleted successfully`);
    tt.end();
  });

  t.test(`delete URL-encodes monitor id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: deleteResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    await balanceMonitor.delete(`mon_test/special`);

    tt.match(capturedRequest.args(), [
      [`balance-monitors/mon_test%2Fspecial`, undefined, `DELETE`],
    ]);
    tt.end();
  });

  t.test(`delete returns 400 for empty id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: deleteResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await balanceMonitor.delete(``);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `monitor id is required`);
    tt.end();
  });

  t.test(`delete forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `Balance monitor not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await balanceMonitor.delete(`mon_missing`);

    tt.match(capturedRequest.args(), [
      [`balance-monitors/mon_missing`, undefined, `DELETE`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });

  t.test(
    `Issue #118 — delete succeeds on 200 OK with empty body`,
    async tt => {
      const emptyBodyFetch = async () =>
        ({
          ok: true,
          status: 200,
          statusText: `OK`,
          json: async () => {
            throw new SyntaxError(`Unexpected end of JSON input`);
          },
          text: async () => ``,
          headers: new Headers(),
        }) as unknown as Response;

      const blnk = new Blnk(
        `test-key`,
        createMockBlnkClientOptions(),
        {BalanceMonitor},
        FormatResponse,
        emptyBodyFetch,
      );

      const response = await blnk.BalanceMonitor.delete(`mon_test_123`);

      tt.equal(response.status, 200);
      tt.equal(response.message, `Success`);
      tt.equal(response.data, null);
      tt.end();
    },
  );
});
