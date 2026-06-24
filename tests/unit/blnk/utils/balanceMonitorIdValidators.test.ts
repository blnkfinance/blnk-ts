/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateMonitorId} from "../../../../src/blnk/utils/validators/balanceMonitors";

tap.test(`ValidateMonitorId`, async t => {
  t.equal(ValidateMonitorId(`mon_test_123`), null);
  t.equal(ValidateMonitorId(``), `monitor id is required`);
  t.end();
});
