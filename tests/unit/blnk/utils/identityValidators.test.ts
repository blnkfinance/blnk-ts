/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateIdentity} from "../../../../src/blnk/utils/validators/identityValidators";

const baseIndividual = {
  identity_type: `individual` as const,
  first_name: `Jane`,
  last_name: `Doe`,
  gender: `female` as const,
  dob: `1990-01-15T00:00:00Z`,
  nationality: `US`,
  email_address: `jane@example.com`,
  phone_number: `+1234567890`,
  category: `customer`,
  street: `123 Main St`,
  country: `USA`,
  state: `NY`,
  post_code: `10001`,
  city: `New York`,
};

tap.test(`Issue #49 — ValidateIdentity identity_id and dob`, t => {
  t.test(`accepts caller-supplied identity_id`, tt => {
    tt.equal(
      ValidateIdentity({
        ...baseIndividual,
        identity_id: `idt_11111111-1111-4111-8111-111111111111`,
      }),
      null,
    );
    tt.end();
  });

  t.test(`accepts ISO dob string`, tt => {
    tt.equal(ValidateIdentity(baseIndividual), null);
    tt.end();
  });

  t.test(`accepts Date dob`, tt => {
    tt.equal(
      ValidateIdentity({
        ...baseIndividual,
        dob: new Date(`1990-01-15T00:00:00Z`),
      }),
      null,
    );
    tt.end();
  });

  t.test(`rejects invalid identity_id`, tt => {
    tt.equal(
      ValidateIdentity({
        ...baseIndividual,
        identity_id: `user_123`,
      }),
      `identity_id must start with idt_ followed by a valid UUID`,
    );
    tt.end();
  });

  t.test(`rejects invalid dob string`, tt => {
    tt.equal(
      ValidateIdentity({
        ...baseIndividual,
        dob: `not-a-date`,
      }),
      `dob must be a valid ISO 8601 date string or Date`,
    );
    tt.end();
  });

  t.end();
});
