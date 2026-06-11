/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  ValidateCreateLedger,
  ValidateUpdateLedger,
} from "../../../../src/blnk/utils/validators/ledgerValidators";
import {CreateLedger, UpdateLedger} from "../../../../src/types/ledger";

tap.test(`Issue #6 — ValidateUpdateLedger`, t => {
  t.test(`accepts a valid name`, tt => {
    const data: UpdateLedger = {name: `Updated Customer Savings Account`};
    tt.equal(ValidateUpdateLedger(data), null);
    tt.end();
  });

  t.test(`rejects missing name`, tt => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tt.equal(
      ValidateUpdateLedger({} as any),
      `name field must be a valid string`,
    );
    tt.end();
  });

  t.test(`rejects empty name`, tt => {
    tt.equal(ValidateUpdateLedger({name: ``}), `name field is required`);
    tt.end();
  });

  t.test(`rejects whitespace-only name`, tt => {
    tt.equal(ValidateUpdateLedger({name: `   `}), `name field is required`);
    tt.end();
  });

  t.end();
});

tap.test(`ValidateCreateLedger still accepts valid create payloads`, t => {
  const data: CreateLedger<Record<string, never>> = {name: `My Ledger`};
  t.equal(ValidateCreateLedger(data), null);
  t.end();
});
