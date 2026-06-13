/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Identity} from "../../../../src/blnk/endpoints/identity";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {TokenizeIdentityFieldResp} from "../../../../src/types/identity";

const mockResponse: TokenizeIdentityFieldResp = {
  message: `Field tokenized successfully`,
};

tap.test(`Issue #22 — Identity.tokenizeField`, async t => {
  t.test(`tokenizeField POSTs identities/{id}/tokenize/{field}`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.tokenizeField(`idt_test_123`, `FirstName`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/tokenize/FirstName`, null, `POST`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.message, `Field tokenized successfully`);
    tt.end();
  });

  t.test(`tokenizeField uses PascalCase struct field name in path`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    await identity.tokenizeField(`idt_test_123`, `EmailAddress`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/tokenize/EmailAddress`, null, `POST`],
    ]);
    tt.end();
  });

  t.test(`tokenizeField rejects empty identity id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.tokenizeField(``, `FirstName`);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `identity id is required`);
    tt.end();
  });

  t.test(`tokenizeField rejects empty field name`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.tokenizeField(
      `idt_test_123`,
      `` as `FirstName`,
    );

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `field name is required`);
    tt.end();
  });

  t.test(`tokenizeField forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 409,
      message: `Field already tokenized`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.tokenizeField(`idt_test_123`, `FirstName`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/tokenize/FirstName`, null, `POST`],
    ]);
    tt.equal(response.status, 409);
    tt.end();
  });
});
