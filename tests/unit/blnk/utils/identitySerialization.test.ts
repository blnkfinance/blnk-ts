/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {serializeIdentityData} from "../../../../src/blnk/utils/identitySerialization";
import {IdentityData} from "../../../../src/types/identity";

const baseIndividual: IdentityData<Record<string, unknown>> = {
  identity_type: `individual`,
  first_name: `Jane`,
  last_name: `Doe`,
  gender: `female`,
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

tap.test(`Issue #49 — serializeIdentityData`, t => {
  t.test(`passes through ISO dob string`, tt => {
    const data = {
      ...baseIndividual,
      dob: `1990-01-15T00:00:00Z`,
    };
    const payload = serializeIdentityData(data);
    tt.equal(payload.dob, `1990-01-15T00:00:00Z`);
    tt.end();
  });

  t.test(`serializes Date dob to ISO string without milliseconds`, tt => {
    const data = {
      ...baseIndividual,
      dob: new Date(`1990-01-15T00:00:00.000Z`),
    };
    const payload = serializeIdentityData(data);
    tt.equal(payload.dob, `1990-01-15T00:00:00Z`);
    tt.end();
  });

  t.test(`forwards optional identity_id`, tt => {
    const data = {
      ...baseIndividual,
      identity_id: `idt_11111111-1111-4111-8111-111111111111`,
      dob: `1990-01-15T00:00:00Z`,
    };
    const payload = serializeIdentityData(data);
    tt.equal(payload.identity_id, `idt_11111111-1111-4111-8111-111111111111`);
    tt.end();
  });

  t.end();
});
