/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateCreateHookData} from "../../../../src/blnk/utils/validators/hookValidators";
import {CreateHookData} from "../../../../src/types/hooks";

const validData: CreateHookData = {
  name: `Pre-transaction validation`,
  url: `https://api.example.com/validate`,
  type: `PRE_TRANSACTION`,
  active: true,
  timeout: 30,
  retry_count: 3,
};

tap.test(`ValidateCreateHookData`, async t => {
  t.test(`accepts valid payload`, tt => {
    tt.equal(ValidateCreateHookData(validData), null);
    tt.end();
  });

  t.test(`rejects empty name`, tt => {
    tt.match(ValidateCreateHookData({...validData, name: ``}), /name/);
    tt.end();
  });

  t.test(`rejects empty url`, tt => {
    tt.match(ValidateCreateHookData({...validData, url: ``}), /url/);
    tt.end();
  });

  t.test(`rejects invalid type`, tt => {
    tt.match(
      ValidateCreateHookData({
        ...validData,
        type: `INVALID` as CreateHookData[`type`],
      }),
      /type/,
    );
    tt.end();
  });

  t.test(`rejects non-boolean active`, tt => {
    tt.match(
      ValidateCreateHookData({
        ...validData,
        active: `true` as unknown as boolean,
      }),
      /active/,
    );
    tt.end();
  });

  t.test(`rejects non-positive timeout`, tt => {
    tt.match(ValidateCreateHookData({...validData, timeout: 0}), /timeout/);
    tt.end();
  });

  t.test(`rejects negative retry_count`, tt => {
    tt.match(
      ValidateCreateHookData({...validData, retry_count: -1}),
      /retry_count/,
    );
    tt.end();
  });
});
