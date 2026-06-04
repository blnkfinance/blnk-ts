/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateCreateTransactions} from "../../../../src/blnk/utils/validators/transactionValidators";
import {CreateTransactions} from "../../../../src/types/transactions";

const baseFields = {
  precision: 100,
  reference: `ref_split_001`,
  description: `Split transaction`,
  currency: `USD`,
};

tap.test(`Issue #42 — split-transaction validator`, t => {
  t.test(`allows multiple sources with a single destination`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 30000,
      sources: [
        {identifier: `bln_alice`, distribution: `10%`},
        {identifier: `bln_bob`, distribution: `20000`},
        {identifier: `bln_charlie`, distribution: `left`},
      ],
      destination: `bln_sarah`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`allows a single source with multiple destinations`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 30000,
      source: `bln_sarah`,
      destinations: [
        {identifier: `bln_alice`, distribution: `10%`},
        {identifier: `bln_bob`, distribution: `20000`},
        {identifier: `bln_charlie`, distribution: `left`},
      ],
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`rejects sources without destination`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 30000,
      sources: [{identifier: `bln_alice`, distribution: `100%`}],
    };

    tt.equal(
      ValidateCreateTransactions(data),
      `'destination' is required when using 'sources'.`,
    );
    tt.end();
  });

  t.test(`rejects destinations without source`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 30000,
      destinations: [{identifier: `bln_alice`, distribution: `100%`}],
    };

    tt.equal(
      ValidateCreateTransactions(data),
      `'source' is required when using 'destinations'.`,
    );
    tt.end();
  });

  t.test(`rejects sources with destinations array`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 30000,
      sources: [{identifier: `bln_alice`, distribution: `100%`}],
      destination: `bln_sarah`,
      destinations: [{identifier: `bln_bob`, distribution: `left`}],
    };

    tt.equal(
      ValidateCreateTransactions(data),
      `Both 'destination' and 'destinations' cannot be provided together.`,
    );
    tt.end();
  });

  t.test(`rejects sources combined with destinations routing`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 30000,
      sources: [{identifier: `bln_alice`, distribution: `100%`}],
      destinations: [{identifier: `bln_bob`, distribution: `100%`}],
    };

    tt.equal(
      ValidateCreateTransactions(data),
      `'sources' requires a single 'destination'; use 'destination' instead of 'destinations'.`,
    );
    tt.end();
  });

  t.test(
    `uses correct error message when destination and destinations are both set`,
    tt => {
      const data: CreateTransactions<Record<string, never>> = {
        ...baseFields,
        amount: 1000,
        source: `bln_source`,
        destination: `bln_dest_a`,
        destinations: [{identifier: `bln_dest_b`, distribution: `100%`}],
      };

      tt.equal(
        ValidateCreateTransactions(data),
        `Both 'destination' and 'destinations' cannot be provided together.`,
      );
      tt.not(
        ValidateCreateTransactions(data),
        `Both 'source' and 'sources' cannot be provided together.`,
        `must not reuse the source/sources error message`,
      );
      tt.end();
    },
  );

  t.test(`allows precise_amount-only payloads`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      precise_amount: 3000000,
      source: `@FundingPool`,
      destination: `bln_recipient`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`allows precise_amount-only with multiple sources split`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      precise_amount: 3000000,
      sources: [
        {identifier: `bln_alice`, distribution: `10%`},
        {identifier: `bln_bob`, distribution: `2000000`},
        {identifier: `bln_charlie`, distribution: `left`},
      ],
      destination: `bln_sarah`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`rejects when neither amount nor precise_amount is provided`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      source: `bln_a`,
      destination: `bln_b`,
    };

    tt.equal(
      ValidateCreateTransactions(data),
      `Either 'amount' or 'precise_amount' must be provided.`,
    );
    tt.end();
  });

  t.end();
});
