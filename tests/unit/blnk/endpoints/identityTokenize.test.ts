/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Identity} from "../../../../src/blnk/endpoints/identity";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {
  TokenizeIdentityData,
  TokenizeIdentityResp,
} from "../../../../src/types/identity";

const validData: TokenizeIdentityData = {
  fields: [`firstName`, `emailAddress`],
};

const mockResponse: TokenizeIdentityResp = {
  message: `Fields tokenized successfully`,
};

tap.test(`Issue #23 — Identity.tokenize`, async t => {
  t.test(`tokenize POSTs identities/{id}/tokenize`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.tokenize(`idt_test_123`, validData);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/tokenize`, validData, `POST`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.message, `Fields tokenized successfully`);
    tt.end();
  });

  t.test(`tokenize rejects empty identity id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.tokenize(``, validData);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `identity id is required`);
    tt.end();
  });

  t.test(`tokenize rejects empty fields`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.tokenize(`idt_test_123`, {fields: []});

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `at least one field must be specified`);
    tt.end();
  });

  t.test(`tokenize forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `Identity not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.tokenize(`idt_missing`, validData);

    tt.match(capturedRequest.args(), [
      [`identities/idt_missing/tokenize`, validData, `POST`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
