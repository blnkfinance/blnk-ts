/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {parseBlnkApiErrorBody} from "../../../../src/types/errors";

tap.test(`parseBlnkApiErrorBody`, t => {
  t.test(`parses error_detail from Core API responses`, tt => {
    const parsed = parseBlnkApiErrorBody({
      error: `ledger not found`,
      error_detail: {
        code: `LGR_NOT_FOUND`,
        message: `ledger not found`,
        details: {ledger_id: `ldg_missing`},
      },
    });

    tt.same(parsed, {
      code: `LGR_NOT_FOUND`,
      message: `ledger not found`,
      details: {ledger_id: `ldg_missing`},
    });
    tt.end();
  });

  t.test(
    `omits details when error_detail has no details field (issue #132)`,
    tt => {
      const parsed = parseBlnkApiErrorBody({
        error: `bad request`,
        error_detail: {
          code: `GEN_BAD_REQUEST`,
          message: `bad request`,
        },
      });

      tt.same(parsed, {
        code: `GEN_BAD_REQUEST`,
        message: `bad request`,
      });
      tt.equal(parsed && `details` in parsed, false);
      tt.end();
    },
  );

  t.test(`falls back to legacy error string`, tt => {
    const parsed = parseBlnkApiErrorBody({error: `invalid request`});
    tt.same(parsed, {code: `UNKNOWN`, message: `invalid request`});
    tt.end();
  });

  t.test(`returns null for non-object bodies`, tt => {
    tt.equal(parseBlnkApiErrorBody(null), null);
    tt.equal(parseBlnkApiErrorBody(`oops`), null);
    tt.end();
  });

  t.end();
});
