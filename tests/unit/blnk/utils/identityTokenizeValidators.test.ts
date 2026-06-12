/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateTokenizeIdentityData} from "../../../../src/blnk/utils/validators/identityValidators";
import {TokenizeIdentityData} from "../../../../src/types/identity";

tap.test(`ValidateTokenizeIdentityData`, async t => {
  const validData: TokenizeIdentityData = {
    fields: [`firstName`, `emailAddress`],
  };

  t.equal(ValidateTokenizeIdentityData(`idt_test_123`, validData), null);
  t.equal(
    ValidateTokenizeIdentityData(``, validData),
    `identity id is required`,
  );
  t.equal(
    ValidateTokenizeIdentityData(`idt_test_123`, {fields: []}),
    `at least one field must be specified`,
  );
  t.equal(
    ValidateTokenizeIdentityData(`idt_test_123`, {
      fields: [`firstName`, ``],
    }),
    `each field must be a non-empty string`,
  );
  t.end();
});
