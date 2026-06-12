/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateRunInstantReconData} from "../../../../src/blnk/utils/validators/reconciliationValidator";
import {RunInstantReconData} from "../../../../src/types/reconciliation";

const validData: RunInstantReconData = {
  external_transactions: [
    {
      id: `txn_1`,
      amount: 5.49,
      reference: `INV-2023-002`,
      currency: `GBP`,
      description: `Card payment`,
      date: `2024-11-15T14:25:30Z`,
      source: `bank-api`,
    },
  ],
  strategy: `one_to_one`,
  matching_rule_ids: [`rule_abc123`],
};

tap.test(`ValidateRunInstantReconData`, async t => {
  t.test(`accepts valid payload`, tt => {
    tt.equal(ValidateRunInstantReconData(validData), null);
    tt.end();
  });

  t.test(`rejects empty external_transactions`, tt => {
    tt.match(
      ValidateRunInstantReconData({
        ...validData,
        external_transactions: [],
      }),
      /external_transactions/,
    );
    tt.end();
  });

  t.test(`rejects too many external_transactions`, tt => {
    const txns = Array.from({length: 10001}, (_, i) => ({
      id: `txn_${i}`,
      amount: 1,
      reference: `ref_${i}`,
      currency: `USD`,
      description: `desc`,
      date: `2024-11-15T14:25:30Z`,
      source: `bank-api`,
    }));
    tt.match(
      ValidateRunInstantReconData({
        ...validData,
        external_transactions: txns,
      }),
      /too many external_transactions/,
    );
    tt.end();
  });

  t.test(`rejects invalid strategy`, tt => {
    tt.match(
      ValidateRunInstantReconData({
        ...validData,
        strategy: `invalid` as RunInstantReconData[`strategy`],
      }),
      /strategy/,
    );
    tt.end();
  });

  t.test(`rejects empty matching_rule_ids`, tt => {
    tt.match(
      ValidateRunInstantReconData({
        ...validData,
        matching_rule_ids: [],
      }),
      /matching_rule_ids/,
    );
    tt.end();
  });
});
