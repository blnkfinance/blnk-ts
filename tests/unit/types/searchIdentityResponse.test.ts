/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  SearchIdentityDocument,
  SearchIdentityResponse,
} from "../../../src/types/search";

tap.test(`Issue #51 — SearchIdentityResponse API parity`, t => {
  t.test(`identity document includes indexed fields`, tt => {
    const response: SearchIdentityResponse = {
      found: 1,
      out_of: 13,
      page: 1,
      request_params: {
        collection_name: `identities`,
        q: `*`,
        per_page: 1,
      },
      search_time_ms: 5,
      hits: [
        {
          document: {
            id: `idt_fbf6a26c-82c6-46fb-9237-8fbba55a23c0`,
            identity_id: `idt_fbf6a26c-82c6-46fb-9237-8fbba55a23c0`,
            identity_type: `organization`,
            created_at: 1781225782,
            dob: -62135596800,
            meta_data: {},
          } as SearchIdentityDocument,
          highlights: [],
        },
      ],
    };

    tt.equal(typeof response.hits[0].document.created_at, `number`);
    tt.equal(response.hits[0].document.identity_id.startsWith(`idt_`), true);
    tt.end();
  });

  t.end();
});
