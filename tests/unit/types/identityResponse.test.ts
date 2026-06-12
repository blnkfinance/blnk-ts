/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {IdentityDataResponse} from "../../../src/types/identity";

tap.test(`Issue #49 — IdentityDataResponse API parity`, t => {
  t.test(`response dob is a string`, tt => {
    const response: IdentityDataResponse<{customer_id: string}> = {
      identity_id: `idt_11111111-1111-4111-8111-111111111111`,
      identity_type: `individual`,
      first_name: `Alice`,
      last_name: `Smith`,
      gender: `female`,
      dob: `1985-05-15T00:00:00Z`,
      email_address: `alice@example.com`,
      phone_number: `+1234567890`,
      nationality: `Canadian`,
      category: `customer`,
      street: `789 Elm St`,
      country: `Canada`,
      state: `Ontario`,
      post_code: `M4B 1B3`,
      city: `Toronto`,
      created_at: `2024-11-26T08:36:36.238244338Z`,
      meta_data: {customer_id: `CUST123456`},
    };

    tt.equal(typeof response.dob, `string`);
    tt.equal(response.identity_id.startsWith(`idt_`), true);
    tt.end();
  });

  t.end();
});
