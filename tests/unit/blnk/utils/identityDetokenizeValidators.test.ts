/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateDetokenizeIdentityData} from "../../../../src/blnk/utils/validators/identityValidators";
import {DetokenizeIdentityData} from "../../../../src/types/identity";

tap.test(`ValidateDetokenizeIdentityData`, async t => {
  const validData: DetokenizeIdentityData = {
    fields: [`FirstName`, `EmailAddress`],
  };

  t.equal(ValidateDetokenizeIdentityData(`idt_test_123`, validData), null);
  t.equal(
    ValidateDetokenizeIdentityData(`idt_test_123`, {fields: []}),
    null,
  );
  t.equal(
    ValidateDetokenizeIdentityData(``, validData),
    `identity id is required`,
  );
  t.equal(
    ValidateDetokenizeIdentityData(`idt_test_123`, {
      fields: [`FirstName`, `` as `FirstName`],
    }),
    `each field must be a non-empty string`,
  );
  t.end();
});
