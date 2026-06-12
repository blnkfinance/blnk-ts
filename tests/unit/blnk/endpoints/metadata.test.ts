/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Metadata} from "../../../../src/blnk/endpoints/metadata";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {
  UpdateMetadataData,
  UpdateMetadataResp,
} from "../../../../src/types/metadata";

const validData: UpdateMetadataData = {
  meta_data: {
    project_owner: `Acme LLC`,
    update_status: `Approved`,
  },
};

const mockResponse: UpdateMetadataResp = {
  meta_data: {
    project_owner: `Acme LLC`,
    update_status: `Approved`,
  },
};

tap.test(`Issue #27 — Metadata.update`, async t => {
  t.test(`update POSTs {id}/metadata`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const metadata = new Metadata(capturedRequest, mockLogger, FormatResponse);

    const response = await metadata.update(`ldg_test_123`, validData);

    tt.match(capturedRequest.args(), [
      [`ldg_test_123/metadata`, validData, `POST`],
    ]);
    tt.equal(response.status, 200);
    tt.same(response.data?.meta_data, validData.meta_data);
    tt.end();
  });

  t.test(`update rejects empty id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const metadata = new Metadata(capturedRequest, mockLogger, FormatResponse);

    const response = await metadata.update(``, validData);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `id is required`);
    tt.end();
  });

  t.test(`update rejects invalid meta_data`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const metadata = new Metadata(capturedRequest, mockLogger, FormatResponse);

    const response = await metadata.update(`ldg_test_123`, {
      meta_data: null as unknown as Record<string, unknown>,
    });

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /meta_data/);
    tt.end();
  });

  t.test(`update forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `Entity not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const metadata = new Metadata(capturedRequest, mockLogger, FormatResponse);

    const response = await metadata.update(`ldg_missing`, validData);

    tt.match(capturedRequest.args(), [
      [`ldg_missing/metadata`, validData, `POST`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
