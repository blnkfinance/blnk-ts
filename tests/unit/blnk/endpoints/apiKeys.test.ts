/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ApiKeys} from "../../../../src/blnk/endpoints/apiKeys";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {ApiKeyResp, CreateApiKeyData} from "../../../../src/types/apiKeys";

const validData: CreateApiKeyData = {
  name: `Service Account`,
  owner: `merchant_a`,
  scopes: [`ledgers:read`, `balances:write`],
  expires_at: `2026-03-11T00:00:00Z`,
};

const mockResponse: ApiKeyResp = {
  api_key_id: `api_key_test_123`,
  key: `YVLIhuIplUzLRCcT9r7DQ_jsGKCXAn39JQ3n_o-Ll2Q=`,
  name: validData.name,
  owner_id: validData.owner,
  scopes: validData.scopes,
  expires_at: validData.expires_at,
  created_at: `2026-06-12T05:50:00.000Z`,
  last_used_at: `0001-01-01T00:00:00Z`,
  is_revoked: false,
};

tap.test(`Issue #36 — ApiKeys.create`, async t => {
  t.test(`create POSTs api-keys`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 201,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const apiKeys = new ApiKeys(capturedRequest, mockLogger, FormatResponse);

    const response = await apiKeys.create(validData);

    tt.match(capturedRequest.args(), [[`api-keys`, validData, `POST`]]);
    tt.equal(response.status, 201);
    tt.equal(response.data?.api_key_id, `api_key_test_123`);
    tt.equal(response.data?.key, mockResponse.key);
    tt.equal(response.data?.owner_id, `merchant_a`);
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
    const apiKeys = new ApiKeys(capturedRequest, mockLogger, FormatResponse);

    const response = await apiKeys.create({
      ...validData,
      scopes: [],
    });

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /scope/);
    tt.end();
  });

  t.test(`create forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 403,
      message: `forbidden`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const apiKeys = new ApiKeys(capturedRequest, mockLogger, FormatResponse);

    const response = await apiKeys.create(validData);

    tt.match(capturedRequest.args(), [[`api-keys`, validData, `POST`]]);
    tt.equal(response.status, 403);
    tt.end();
  });
});

tap.test(`Issue #37 — ApiKeys.list`, async t => {
  const listItem: ApiKeyResp = {
    api_key_id: `api_key_test_123`,
    key: `$2a$10$hashedkeyvalue`,
    name: `Service Account`,
    owner_id: `merchant_a`,
    scopes: [`ledgers:read`],
    expires_at: `2026-03-11T00:00:00Z`,
    created_at: `2026-06-12T05:50:00.000Z`,
    last_used_at: `0001-01-01T00:00:00Z`,
    is_revoked: false,
  };

  t.test(`list GETs api-keys without owner filter`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: [listItem] as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const apiKeys = new ApiKeys(capturedRequest, mockLogger, FormatResponse);

    const response = await apiKeys.list();

    tt.match(capturedRequest.args(), [[`api-keys`, undefined, `GET`]]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.length, 1);
    tt.equal(response.data?.[0]?.api_key_id, `api_key_test_123`);
    tt.end();
  });

  t.test(`list GETs api-keys?owner= when owner provided`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: [] as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const apiKeys = new ApiKeys(capturedRequest, mockLogger, FormatResponse);

    const response = await apiKeys.list({owner: `merchant_a`});

    tt.match(capturedRequest.args(), [
      [`api-keys?owner=merchant_a`, undefined, `GET`],
    ]);
    tt.equal(response.status, 200);
    tt.end();
  });

  t.test(`list URL-encodes owner query param`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: [] as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const apiKeys = new ApiKeys(capturedRequest, mockLogger, FormatResponse);

    const response = await apiKeys.list({owner: `merchant a&role=admin`});

    tt.match(capturedRequest.args(), [
      [
        `api-keys?owner=${encodeURIComponent(`merchant a&role=admin`)}`,
        undefined,
        `GET`,
      ],
    ]);
    tt.equal(response.status, 200);
    tt.end();
  });

  t.test(`list returns 400 for empty owner`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: [] as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const apiKeys = new ApiKeys(capturedRequest, mockLogger, FormatResponse);

    const response = await apiKeys.list({owner: ``});

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /owner/);
    tt.end();
  });

  t.test(`list forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 403,
      message: `forbidden`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const apiKeys = new ApiKeys(capturedRequest, mockLogger, FormatResponse);

    const response = await apiKeys.list({owner: `merchant_a`});

    tt.match(capturedRequest.args(), [
      [`api-keys?owner=merchant_a`, undefined, `GET`],
    ]);
    tt.equal(response.status, 403);
    tt.end();
  });
});
