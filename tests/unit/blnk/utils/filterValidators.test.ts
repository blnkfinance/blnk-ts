/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateFilterParams} from "../../../../src/blnk/utils/validators/searchValidators";

tap.test(`Issue #33 — filter validators`, t => {
  t.test(`ValidateFilterParams accepts API-valid payload`, tt => {
    tt.equal(
      ValidateFilterParams({
        filters: [
          {field: `status`, operator: `eq`, value: `APPLIED`},
          {field: `currency`, operator: `in`, values: [`USD`, `EUR`]},
        ],
        logical_operator: `and`,
        sort_by: `created_at`,
        sort_order: `desc`,
        include_count: true,
        limit: 20,
        offset: 0,
      }),
      null,
    );
    tt.end();
  });

  t.test(`ValidateFilterParams accepts valueless operators`, tt => {
    tt.equal(
      ValidateFilterParams({
        filters: [{field: `identity_id`, operator: `isnull`}],
      }),
      null,
    );
    tt.end();
  });

  t.test(`ValidateFilterParams rejects missing values for in operator`, tt => {
    tt.equal(
      ValidateFilterParams({
        filters: [{field: `currency`, operator: `in`}],
      }),
      `filters[0].values must be a non-empty array for operator "in"`,
    );
    tt.end();
  });

  t.test(`ValidateFilterParams rejects invalid logical_operator`, tt => {
    tt.equal(
      ValidateFilterParams({
        filters: [{field: `status`, operator: `eq`, value: `APPLIED`}],
        logical_operator: `xor` as `and`,
      }),
      `logical_operator must be "and" or "or" if provided`,
    );
    tt.end();
  });

  t.end();
});
