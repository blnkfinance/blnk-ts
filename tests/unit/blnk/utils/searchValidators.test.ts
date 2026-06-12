/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  ValidateSearchCollection,
  ValidateSearchParams,
} from "../../../../src/blnk/utils/validators/searchValidators";

tap.test(`Issue #51 — search validators`, t => {
  t.test(`ValidateSearchCollection accepts identities`, tt => {
    tt.equal(ValidateSearchCollection(`identities`), null);
    tt.equal(ValidateSearchCollection(`ledgers`), null);
    tt.end();
  });

  t.test(`ValidateSearchCollection rejects unknown collection`, tt => {
    tt.equal(
      ValidateSearchCollection(`accounts`),
      `collection must be ledgers, transactions, balances, or identities`,
    );
    tt.end();
  });

  t.test(`ValidateSearchParams accepts API-valid payload`, tt => {
    tt.equal(
      ValidateSearchParams({
        q: `*`,
        query_by: `first_name,last_name,email_address`,
        filter_by: `identity_type:=individual`,
        sort_by: `created_at:desc`,
        page: 1,
        per_page: 25,
      }),
      null,
    );
    tt.end();
  });

  t.test(`ValidateSearchParams rejects empty q`, tt => {
    tt.equal(ValidateSearchParams({q: ``}), `Field "q" must be filled`);
    tt.end();
  });

  t.test(`ValidateSearchParams rejects invalid page`, tt => {
    tt.equal(
      ValidateSearchParams({q: `*`, page: 0}),
      `page must be a positive integer if provided`,
    );
    tt.end();
  });

  t.end();
});
