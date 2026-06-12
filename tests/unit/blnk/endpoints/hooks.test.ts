/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Hooks} from "../../../../src/blnk/endpoints/hooks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {
  CreateHookData,
  DeleteHookResp,
  HookResp,
  UpdateHookData,
} from "../../../../src/types/hooks";

const validData: CreateHookData = {
  name: `Pre-transaction validation`,
  url: `https://api.example.com/validate`,
  type: `PRE_TRANSACTION`,
  active: true,
  timeout: 30,
  retry_count: 3,
};

const mockResponse: HookResp = {
  id: `hk_test_123`,
  name: validData.name,
  url: validData.url,
  type: validData.type,
  active: validData.active,
  timeout: validData.timeout,
  retry_count: validData.retry_count,
  created_at: `2026-06-12T04:50:00.000Z`,
  last_run: `0001-01-01T00:00:00Z`,
  last_success: false,
};

tap.test(`Issue #28 — Hooks.create`, async t => {
  t.test(`create POSTs hooks`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 201,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.create(validData);

    tt.match(capturedRequest.args(), [[`hooks`, validData, `POST`]]);
    tt.equal(response.status, 201);
    tt.equal(response.data?.id, `hk_test_123`);
    tt.equal(response.data?.type, `PRE_TRANSACTION`);
    tt.end();
  });

  t.test(`create returns 400 for invalid payload`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 201,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.create({
      ...validData,
      type: `INVALID` as CreateHookData[`type`],
    });

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /type/);
    tt.end();
  });

  t.test(`create forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 403,
      message: `hook management requires master key`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.create(validData);

    tt.match(capturedRequest.args(), [[`hooks`, validData, `POST`]]);
    tt.equal(response.status, 403);
    tt.end();
  });
});

tap.test(`Issue #31 — Hooks.list`, async t => {
  t.test(`list GETs hooks without type filter`, async tt => {
    const mockLogger = createMockLogger();
    const listResponse = [mockResponse];
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: listResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.list();

    tt.match(capturedRequest.args(), [[`hooks`, undefined, `GET`]]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.length, 1);
    tt.equal(response.data?.[0]?.id, `hk_test_123`);
    tt.end();
  });

  t.test(`list GETs hooks?type= when type provided`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: [] as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.list({type: `POST_TRANSACTION`});

    tt.match(capturedRequest.args(), [
      [`hooks?type=POST_TRANSACTION`, undefined, `GET`],
    ]);
    tt.equal(response.status, 200);
    tt.end();
  });

  t.test(`list returns 400 for invalid type`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: [] as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.list({
      type: `INVALID` as CreateHookData[`type`],
    });

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /type/);
    tt.end();
  });

  t.test(`list forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 403,
      message: `hook management requires master key`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.list();

    tt.match(capturedRequest.args(), [[`hooks`, undefined, `GET`]]);
    tt.equal(response.status, 403);
    tt.end();
  });
});

tap.test(`Issue #30 — Hooks.get`, async t => {
  t.test(`get GETs hooks/{id}`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.get(`hk_test_123`);

    tt.match(capturedRequest.args(), [[`hooks/hk_test_123`, undefined, `GET`]]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.id, `hk_test_123`);
    tt.equal(response.data?.type, `PRE_TRANSACTION`);
    tt.end();
  });

  t.test(`get returns 400 for empty id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.get(``);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /hook id/);
    tt.end();
  });

  t.test(`get forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `hook not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.get(`hk_missing`);

    tt.match(capturedRequest.args(), [[`hooks/hk_missing`, undefined, `GET`]]);
    tt.equal(response.status, 404);
    tt.end();
  });
});

tap.test(`Issue #29 — Hooks.update`, async t => {
  const updateData: UpdateHookData = {
    name: `Pre-transaction validation (updated)`,
    url: `https://api.example.com/validate-v2`,
    type: `PRE_TRANSACTION`,
    active: false,
    timeout: 45,
    retry_count: 5,
  };

  t.test(`update PUTs hooks/{id}`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: {...mockResponse, ...updateData} as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.update(`hk_test_123`, updateData);

    tt.match(capturedRequest.args(), [
      [`hooks/hk_test_123`, updateData, `PUT`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.active, false);
    tt.equal(response.data?.timeout, 45);
    tt.end();
  });

  t.test(`update returns 400 for empty id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.update(``, updateData);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /hook id/);
    tt.end();
  });

  t.test(`update returns 400 for invalid payload`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.update(`hk_test_123`, {
      ...updateData,
      timeout: 0,
    });

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /timeout/);
    tt.end();
  });

  t.test(`update forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `hook not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.update(`hk_missing`, updateData);

    tt.match(capturedRequest.args(), [[`hooks/hk_missing`, updateData, `PUT`]]);
    tt.equal(response.status, 404);
    tt.end();
  });
});

tap.test(`Issue #32 — Hooks.delete`, async t => {
  const deleteResponse: DeleteHookResp = {
    message: `hook deleted successfully`,
  };

  t.test(`delete DELETEs hooks/{id}`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: deleteResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.delete(`hk_test_123`);

    tt.match(capturedRequest.args(), [
      [`hooks/hk_test_123`, undefined, `DELETE`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.message, `hook deleted successfully`);
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
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.delete(``);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /hook id/);
    tt.end();
  });

  t.test(`delete forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `hook not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const hooks = new Hooks(capturedRequest, mockLogger, FormatResponse);

    const response = await hooks.delete(`hk_missing`);

    tt.match(capturedRequest.args(), [
      [`hooks/hk_missing`, undefined, `DELETE`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
