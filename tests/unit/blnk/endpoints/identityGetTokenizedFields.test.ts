/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Identity} from "../../../../src/blnk/endpoints/identity";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {GetTokenizedFieldsResp} from "../../../../src/types/identity";

const mockResponse: GetTokenizedFieldsResp = {
  tokenized_fields: [`FirstName`, `LastName`, `EmailAddress`, `PhoneNumber`],
};

tap.test(`Issue #24 — Identity.getTokenizedFields`, async t => {
  t.test(`getTokenizedFields GETs identities/{id}/tokenized-fields`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.getTokenizedFields(`idt_test_123`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/tokenized-fields`, null, `GET`],
    ]);
    tt.equal(response.status, 200);
    tt.same(response.data?.tokenized_fields, mockResponse.tokenized_fields);
    tt.end();
  });

  t.test(`getTokenizedFields returns empty list for fresh identity`, async tt => {
    const mockLogger = createMockLogger();
    const emptyResponse: GetTokenizedFieldsResp = {tokenized_fields: []};
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: emptyResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.getTokenizedFields(`idt_test_123`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/tokenized-fields`, null, `GET`],
    ]);
    tt.equal(response.status, 200);
    tt.same(response.data?.tokenized_fields, []);
    tt.end();
  });

  t.test(`getTokenizedFields rejects empty identity id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.getTokenizedFields(``);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `identity id is required`);
    tt.end();
  });

  t.test(`getTokenizedFields forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `Identity not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.getTokenizedFields(`idt_missing`);

    tt.match(capturedRequest.args(), [
      [`identities/idt_missing/tokenized-fields`, null, `GET`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
