/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Identity} from "../../../../src/blnk/endpoints/identity";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {DeleteIdentityResp} from "../../../../src/types/identity";

tap.test(`Issue #116 — Identity.delete`, async t => {
  const deleteResponse: DeleteIdentityResp = {
    message: `Identity deleted successfully`,
  };

  t.test(`delete DELETEs identities/{id}`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: deleteResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.delete(`idt_test_123`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123`, undefined, `DELETE`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.message, `Identity deleted successfully`);
    tt.end();
  });

  t.test(`delete URL-encodes identity id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: deleteResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    await identity.delete(`idt_test/special`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test%2Fspecial`, undefined, `DELETE`],
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
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.delete(``);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `identity id is required`);
    tt.end();
  });

  t.test(`delete forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `Identity not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.delete(`idt_missing`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_missing`, undefined, `DELETE`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
