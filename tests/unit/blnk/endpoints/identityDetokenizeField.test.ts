/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Identity} from "../../../../src/blnk/endpoints/identity";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {DetokenizeIdentityFieldResp} from "../../../../src/types/identity";

const mockResponse: DetokenizeIdentityFieldResp = {
  field: `EmailAddress`,
  value: `jane@example.com`,
};

tap.test(`Issue #25 — Identity.detokenizeField`, async t => {
  t.test(`detokenizeField GETs identities/{id}/detokenize/{field}`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenizeField(
      `idt_test_123`,
      `EmailAddress`,
    );

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/detokenize/EmailAddress`, null, `GET`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.field, `EmailAddress`);
    tt.equal(response.data?.value, `jane@example.com`);
    tt.end();
  });

  t.test(`detokenizeField uses PascalCase struct field name in path`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: {field: `FirstName`, value: `Jane`} as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    await identity.detokenizeField(`idt_test_123`, `FirstName`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/detokenize/FirstName`, null, `GET`],
    ]);
    tt.end();
  });

  t.test(`detokenizeField rejects empty identity id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenizeField(``, `EmailAddress`);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `identity id is required`);
    tt.end();
  });

  t.test(`detokenizeField rejects empty field name`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenizeField(
      `idt_test_123`,
      `` as `EmailAddress`,
    );

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `field name is required`);
    tt.end();
  });

  t.test(`detokenizeField forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 400,
      message: `Field is not tokenized`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenizeField(
      `idt_test_123`,
      `PhoneNumber`,
    );

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/detokenize/PhoneNumber`, null, `GET`],
    ]);
    tt.equal(response.status, 400);
    tt.end();
  });
});
