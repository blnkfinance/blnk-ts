/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateGetByIndicator} from "../../../../src/blnk/utils/validators/ledgerBalance";

tap.test(`Issue #8 — ValidateGetByIndicator`, t => {
  t.test(`accepts valid indicator and currency`, tt => {
    tt.equal(ValidateGetByIndicator(`@World`, `USD`), null);
    tt.end();
  });

  t.test(`rejects empty indicator`, tt => {
    tt.equal(ValidateGetByIndicator(``, `USD`), `indicator is required`);
    tt.end();
  });

  t.test(`rejects empty currency`, tt => {
    tt.equal(ValidateGetByIndicator(`@World`, ``), `currency is required`);
    tt.end();
  });

  t.end();
});
