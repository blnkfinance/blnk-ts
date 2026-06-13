/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateTokenizeIdentityField} from "../../../../src/blnk/utils/validators/identityValidators";

tap.test(`ValidateTokenizeIdentityField`, async t => {
  t.equal(ValidateTokenizeIdentityField(`idt_test_123`, `FirstName`), null);
  t.equal(
    ValidateTokenizeIdentityField(``, `FirstName`),
    `identity id is required`,
  );
  t.equal(
    ValidateTokenizeIdentityField(`idt_test_123`, `` as `FirstName`),
    `field name is required`,
  );
  t.end();
});
