/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateStartReindexRequest} from "../../../../src/blnk/utils/validators/searchValidators";

tap.test(`Issue #34 — start reindex validators`, t => {
  t.test(`ValidateStartReindexRequest accepts empty options`, tt => {
    tt.equal(ValidateStartReindexRequest({}), null);
    tt.end();
  });

  t.test(`ValidateStartReindexRequest accepts positive batch_size`, tt => {
    tt.equal(ValidateStartReindexRequest({batch_size: 1000}), null);
    tt.end();
  });

  t.test(`ValidateStartReindexRequest rejects non-integer batch_size`, tt => {
    tt.equal(
      ValidateStartReindexRequest({batch_size: 1.5}),
      `batch_size must be a positive integer if provided`,
    );
    tt.end();
  });

  t.end();
});
