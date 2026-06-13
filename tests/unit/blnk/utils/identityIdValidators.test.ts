/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateIdentityId} from "../../../../src/blnk/utils/validators/identityValidators";

tap.test(`ValidateIdentityId`, async t => {
  t.equal(ValidateIdentityId(`idt_test_123`), null);
  t.equal(ValidateIdentityId(``), `identity id is required`);
  t.end();
});
