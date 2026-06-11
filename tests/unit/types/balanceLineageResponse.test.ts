/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {BalanceLineageResponse} from "../../../src/types/ledgerBalances";

const referenceResponse: BalanceLineageResponse = {
  balance_id: `bln_5ce86029-3c2e-4e2a-aae2-7fb931ca4c4f`,
  aggregate_balance_id: `bln_aggregate_shadow_balance_id`,
  total_with_lineage: `7500`,
  providers: [
    {
      provider: `stripe`,
      amount: `10000`,
      available: `7500`,
      spent: `2500`,
      shadow_balance_id: `bln_shadow_balance_id`,
    },
  ],
};

tap.test(`Issue #7 — BalanceLineageResponse API parity`, t => {
  t.test(`accepts Core API reference response`, tt => {
    tt.equal(
      referenceResponse.balance_id,
      `bln_5ce86029-3c2e-4e2a-aae2-7fb931ca4c4f`,
    );
    tt.equal(referenceResponse.providers.length, 1);
    tt.equal(referenceResponse.providers[0].provider, `stripe`);
    tt.end();
  });

  t.test(`accepts numeric minor-unit amounts`, tt => {
    const numericResponse: BalanceLineageResponse = {
      ...referenceResponse,
      total_with_lineage: 7500,
      providers: [
        {
          ...referenceResponse.providers[0],
          amount: 10000,
          available: 7500,
          spent: 2500,
        },
      ],
    };

    tt.type(numericResponse.total_with_lineage, `number`);
    tt.end();
  });

  t.end();
});
