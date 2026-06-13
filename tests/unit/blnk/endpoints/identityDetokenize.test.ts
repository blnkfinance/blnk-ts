/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Identity} from "../../../../src/blnk/endpoints/identity";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {
  DetokenizeIdentityData,
  DetokenizeIdentityResp,
} from "../../../../src/types/identity";

const validData: DetokenizeIdentityData = {
  fields: [`FirstName`, `EmailAddress`],
};

const mockResponse: DetokenizeIdentityResp = {
  fields: {
    FirstName: `Jane`,
    EmailAddress: `jane@example.com`,
  },
};

tap.test(`Issue #26 — Identity.detokenize`, async t => {
  t.test(`detokenize POSTs identities/{id}/detokenize`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenize(`idt_test_123`, validData);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/detokenize`, validData, `POST`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.fields.FirstName, `Jane`);
    tt.equal(response.data?.fields.EmailAddress, `jane@example.com`);
    tt.end();
  });

  t.test(`detokenize allows empty fields to detokenize all`, async tt => {
    const mockLogger = createMockLogger();
    const emptyFieldsData: DetokenizeIdentityData = {fields: []};
    const allFieldsResponse: DetokenizeIdentityResp = {
      fields: {
        FirstName: `Jane`,
        EmailAddress: `jane@example.com`,
        PhoneNumber: `+1234567890`,
      },
    };
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: allFieldsResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenize(`idt_test_123`, emptyFieldsData);

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/detokenize`, emptyFieldsData, `POST`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(Object.keys(response.data?.fields ?? {}).length, 3);
    tt.end();
  });

  t.test(`detokenize rejects empty identity id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenize(``, validData);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `identity id is required`);
    tt.end();
  });

  t.test(`detokenize rejects blank field names`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenize(`idt_test_123`, {
      fields: [`FirstName`, `` as `FirstName`],
    });

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `each field must be a non-empty string`);
    tt.end();
  });

  t.test(`detokenize forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 400,
      message: `Field is not tokenized`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const response = await identity.detokenize(`idt_test_123`, {
      fields: [`Street`],
    });

    tt.match(capturedRequest.args(), [
      [`identities/idt_test_123/detokenize`, {fields: [`Street`]}, `POST`],
    ]);
    tt.equal(response.status, 400);
    tt.end();
  });
});
