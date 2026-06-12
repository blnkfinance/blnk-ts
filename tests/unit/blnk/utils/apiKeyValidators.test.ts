/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  ValidateCreateApiKeyData,
  ValidateDeleteApiKeyOptions,
  ValidateListApiKeysOptions,
} from "../../../../src/blnk/utils/validators/apiKeyValidators";
import {CreateApiKeyData} from "../../../../src/types/apiKeys";

tap.test(`ValidateCreateApiKeyData`, async t => {
  const validData: CreateApiKeyData = {
    name: `Service Account`,
    owner: `merchant_a`,
    scopes: [`ledgers:read`],
    expires_at: `2026-03-11T00:00:00Z`,
  };

  t.equal(ValidateCreateApiKeyData(validData), null);
  t.equal(
    ValidateCreateApiKeyData({...validData, name: ``}),
    `name is required`,
  );
  t.equal(
    ValidateCreateApiKeyData({...validData, owner: ``}),
    `owner is required`,
  );
  t.equal(
    ValidateCreateApiKeyData({...validData, scopes: []}),
    `at least one scope must be specified`,
  );
  t.match(
    ValidateCreateApiKeyData({...validData, scopes: [`ledgers:read`, ``]}),
    /scope/,
  );
  t.match(
    ValidateCreateApiKeyData({...validData, expires_at: `not-a-date`}),
    /expires_at/,
  );
  t.end();
});

tap.test(`ValidateListApiKeysOptions`, async t => {
  t.equal(ValidateListApiKeysOptions(undefined), null);
  t.equal(ValidateListApiKeysOptions({}), null);
  t.equal(ValidateListApiKeysOptions({owner: `merchant_a`}), null);
  t.match(ValidateListApiKeysOptions({owner: ``}), /owner/);
  t.end();
});

tap.test(`ValidateDeleteApiKeyOptions`, async t => {
  t.equal(ValidateDeleteApiKeyOptions(undefined), null);
  t.equal(ValidateDeleteApiKeyOptions({owner: `merchant_a`}), null);
  t.match(ValidateDeleteApiKeyOptions({owner: ``}), /owner/);
  t.end();
});
