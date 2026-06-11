/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  ValidateCreateTransactions,
  ValidateBulkCommitInflight,
  ValidateBulkVoidInflight,
  ValidateBulkTransactions,
  ValidateRefundTransaction,
  ValidateUpdateTransactions,
} from "../../../../src/blnk/utils/validators/transactionValidators";
import {
  BulkCommitInflightRequest,
  BulkVoidInflightRequest,
  BulkTransactions,
  CreateTransactions,
  MAX_BULK_INFLIGHT_ITEMS,
  RefundTransactionRequest,
  UpdateTransactionStatus,
} from "../../../../src/types/transactions";

const baseFields = {
  precision: 100,
  reference: `ref_split_001`,
  description: `Split transaction`,
  currency: `USD`,
};

tap.test(`Issue #5 — atomic on split transactions`, t => {
  t.test(`allows atomic on split create payloads`, tt => {
    const data: CreateTransactions<Record<string, unknown>> = {
      amount: 1000,
      precision: 100,
      reference: `ref_atomic_split`,
      description: `Atomic split`,
      currency: `USD`,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `50%`},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
      atomic: true,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`rejects non-boolean atomic`, tt => {
    const data = {
      amount: 1000,
      precision: 100,
      reference: `ref_bad_atomic`,
      description: `Bad atomic`,
      currency: `USD`,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `50%`},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
      atomic: `true`,
    } as unknown as CreateTransactions<Record<string, unknown>>;

    tt.equal(
      ValidateCreateTransactions(data),
      `atomic must be a boolean if provided.`,
    );
    tt.end();
  });

  t.end();
});

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

  t.test(`allows split legs that use precise_distribution only`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      precise_amount: 10000,
      source: `bln_sarah`,
      destinations: [
        {identifier: `bln_merchant`, precise_distribution: `9733`},
        {identifier: `bln_fee`, precise_distribution: `267`},
      ],
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(
    `allows mixed precise_distribution and percentage distribution legs`,
    tt => {
      const data: CreateTransactions<Record<string, never>> = {
        ...baseFields,
        precise_amount: `189207535698279000`,
        source: `bln_sarah`,
        destinations: [
          {
            identifier: `bln_alice`,
            precise_distribution: `37841507139655800`,
          },
          {identifier: `bln_bob`, distribution: `20%`},
          {identifier: `bln_charlie`, distribution: `left`},
        ],
      };

      tt.equal(ValidateCreateTransactions(data), null);
      tt.end();
    },
  );

  t.test(
    `validates precise_distribution strings beyond Number.MAX_SAFE_INTEGER exactly`,
    tt => {
      const legA = `9007199254740992`;
      const legB = `1`;
      const total = `9007199254740993`;

      const valid: CreateTransactions<Record<string, never>> = {
        ...baseFields,
        precise_amount: total,
        source: `bln_sarah`,
        destinations: [
          {identifier: `bln_alice`, precise_distribution: legA},
          {identifier: `bln_bob`, precise_distribution: legB},
        ],
      };

      const invalid: CreateTransactions<Record<string, never>> = {
        ...valid,
        destinations: [
          {identifier: `bln_alice`, precise_distribution: legA},
          {identifier: `bln_bob`, precise_distribution: `2`},
        ],
      };

      tt.equal(ValidateCreateTransactions(valid), null);
      tt.ok(
        ValidateCreateTransactions(invalid) !== null,
        `sum must match exactly; Number() would mis-parse ${total}`,
      );
      tt.end();
    },
  );

  t.test(`allows precise_amount as a string for large integers`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      precise_amount: `9007199254740993`,
      source: `@FundingPool`,
      destination: `bln_recipient`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`rejects invalid precise_amount string values`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      precise_amount: `12.5`,
      source: `bln_a`,
      destination: `bln_b`,
    };

    tt.equal(
      ValidateCreateTransactions(data),
      `precise_amount must be a non-negative integer string or number.`,
    );
    tt.end();
  });

  t.test(
    `rejects split legs missing both distribution and precise_distribution`,
    tt => {
      const data: CreateTransactions<Record<string, never>> = {
        ...baseFields,
        amount: 1000,
        source: `bln_sarah`,
        destinations: [{identifier: `bln_alice`}],
      };

      tt.equal(
        ValidateCreateTransactions(data),
        `Each destination leg must include either 'distribution' or 'precise_distribution'.`,
      );
      tt.end();
    },
  );

  t.test(`rejects invalid precise_distribution values`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      precise_amount: 1000,
      source: `bln_sarah`,
      destinations: [
        {identifier: `bln_alice`, precise_distribution: `not-a-number`},
      ],
    };

    tt.equal(
      ValidateCreateTransactions(data),
      `Invalid precise_distribution for leg: bln_alice.`,
    );
    tt.end();
  });

  t.test(
    `uses amount for distribution math when both amount and precise_amount are provided`,
    tt => {
      const validWithAmount: CreateTransactions<Record<string, never>> = {
        ...baseFields,
        amount: 10000,
        precise_amount: 999999,
        source: `bln_sarah`,
        destinations: [
          {identifier: `bln_merchant`, precise_distribution: `9733`},
          {identifier: `bln_fee`, precise_distribution: `267`},
        ],
      };

      const invalidIfPreciseAmountUsed: CreateTransactions<
        Record<string, never>
      > = {
        ...baseFields,
        amount: 10000,
        precise_amount: 999999,
        source: `bln_sarah`,
        destinations: [
          {identifier: `bln_merchant`, precise_distribution: `999998`},
          {identifier: `bln_fee`, precise_distribution: `1`},
        ],
      };

      tt.equal(ValidateCreateTransactions(validWithAmount), null);
      tt.ok(
        ValidateCreateTransactions(invalidIfPreciseAmountUsed) !== null,
        `amount (10000) should take precedence over precise_amount (999999)`,
      );
      tt.end();
    },
  );

  t.end();
});

tap.test(`Issue #40 — create transaction request fields`, t => {
  t.test(`allows skip_queue on create payloads`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      skip_queue: true,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`allows effective_date as an ISO string`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      effective_date: `2025-02-15T10:30:00Z`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`allows inflight_commit_date as Core example string`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      inflight: true,
      inflight_commit_date: `2024-04-22T15:28:03+00:00`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`allows inflight_commit_date as a Date`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      inflight: true,
      inflight_commit_date: new Date(`2025-06-01T12:00:00.000Z`),
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`allows effective_date with a numeric timezone offset`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      effective_date: `2024-04-22T15:28:03+00:00`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`rejects date-only effective_date strings`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      effective_date: `2025-02-15`,
    };

    tt.equal(ValidateCreateTransactions(data), `Invalid effective_date.`);
    tt.end();
  });

  t.test(`rejects invalid skip_queue values`, tt => {
    const data = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      skip_queue: `true`,
    } as unknown as CreateTransactions<Record<string, never>>;

    tt.equal(
      ValidateCreateTransactions(data),
      `skip_queue must be a boolean if provided.`,
    );
    tt.end();
  });

  t.test(`rejects invalid effective_date values`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      effective_date: `not-a-date`,
    };

    tt.equal(ValidateCreateTransactions(data), `Invalid effective_date.`);
    tt.end();
  });

  t.test(`rejects invalid inflight_commit_date values`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      inflight_commit_date: `bad-date`,
    };

    tt.equal(ValidateCreateTransactions(data), `Invalid inflight_commit_date.`);
    tt.end();
  });

  t.test(`allows scheduled_for as an ISO string`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      scheduled_for: `2025-12-31T23:59:59Z`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`rejects date-only scheduled_for strings`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      scheduled_for: `2025-12-31`,
    };

    tt.equal(ValidateCreateTransactions(data), `Invalid scheduled date.`);
    tt.end();
  });

  t.end();
});

tap.test(`Issue #41 — ISO date strings and Distribution parity`, t => {
  t.test(`allows scheduled_for as an ISO string on create`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      scheduled_for: `2025-07-01T08:00:00Z`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`allows inflight_expiry_date as an ISO string on create`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destination: `@Recipient`,
      inflight: true,
      inflight_expiry_date: `2025-08-01T08:00:00Z`,
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`allows decimal fixed distribution strings such as 240.23`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `240.23`},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(
    `allows decimal distribution when precise_distribution is on another leg`,
    tt => {
      const data: CreateTransactions<Record<string, never>> = {
        ...baseFields,
        amount: 1000,
        source: `@FundingPool`,
        destinations: [
          {identifier: `bln_fee`, distribution: `240.23`},
          {identifier: `bln_recipient`, precise_distribution: `500`},
          {identifier: `bln_treasury`, distribution: `left`},
        ],
      };

      tt.equal(ValidateCreateTransactions(data), null);
      tt.end();
    },
  );

  t.test(`allows exact decimal sum without left`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `240.23`},
        {identifier: `bln_recipient`, distribution: `759.77`},
      ],
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(`rejects scientific notation distribution strings`, tt => {
    const data = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `1e3`},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
    } as unknown as CreateTransactions<Record<string, never>>;

    tt.equal(
      ValidateCreateTransactions(data),
      `Invalid distribution type for leg: bln_fee.`,
    );
    tt.end();
  });

  t.test(`rejects hex distribution strings`, tt => {
    const data = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `0x10`},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
    } as unknown as CreateTransactions<Record<string, never>>;

    tt.equal(
      ValidateCreateTransactions(data),
      `Invalid distribution type for leg: bln_fee.`,
    );
    tt.end();
  });

  t.test(`rejects whitespace-padded distribution strings`, tt => {
    const data = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: ` 240.23 `},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
    } as unknown as CreateTransactions<Record<string, never>>;

    tt.equal(
      ValidateCreateTransactions(data),
      `Invalid distribution type for leg: bln_fee.`,
    );
    tt.end();
  });

  t.test(`rejects Infinity distribution strings`, tt => {
    const data = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `Infinity`},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
    } as unknown as CreateTransactions<Record<string, never>>;

    tt.equal(
      ValidateCreateTransactions(data),
      `Invalid distribution type for leg: bln_fee.`,
    );
    tt.end();
  });

  t.test(`rejects malformed decimal distribution strings`, tt => {
    const data = {
      ...baseFields,
      amount: 1000,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_fee`, distribution: `240.23.1`},
        {identifier: `bln_recipient`, distribution: `left`},
      ],
    } as unknown as CreateTransactions<Record<string, never>>;

    tt.equal(
      ValidateCreateTransactions(data),
      `Invalid distribution type for leg: bln_fee.`,
    );
    tt.end();
  });

  t.test(`allows decimal percentage distributions with precise_amount`, tt => {
    const data: CreateTransactions<Record<string, never>> = {
      ...baseFields,
      precise_amount: 30000,
      source: `@FundingPool`,
      destinations: [
        {identifier: `bln_a`, distribution: `33.33%`},
        {identifier: `bln_b`, distribution: `66.67%`},
      ],
    };

    tt.equal(ValidateCreateTransactions(data), null);
    tt.end();
  });

  t.test(
    `allows decimal percentage with left under precise_distribution split`,
    tt => {
      const data: CreateTransactions<Record<string, never>> = {
        ...baseFields,
        amount: 30000,
        source: `@FundingPool`,
        destinations: [
          {identifier: `bln_a`, distribution: `33.33%`},
          {identifier: `bln_b`, precise_distribution: `5000`},
          {identifier: `bln_c`, distribution: `left`},
        ],
      };

      tt.equal(ValidateCreateTransactions(data), null);
      tt.end();
    },
  );

  t.test(
    `rejects decimal distributions with precise_amount beyond MAX_SAFE_INTEGER`,
    tt => {
      const data: CreateTransactions<Record<string, never>> = {
        ...baseFields,
        precise_amount: `9007199254740993`,
        source: `@FundingPool`,
        destinations: [
          {identifier: `bln_a`, distribution: `33.33%`},
          {identifier: `bln_b`, distribution: `left`},
        ],
      };

      tt.equal(
        ValidateCreateTransactions(data),
        `Decimal distribution values are not supported with precise amounts beyond Number.MAX_SAFE_INTEGER.`,
      );
      tt.end();
    },
  );

  t.end();
});

tap.test(`Issue #44 — bulk transaction request fields`, t => {
  const baseBulkTxn: CreateTransactions<Record<string, never>> = {
    ...baseFields,
    amount: 1000,
    source: `@FundingPool`,
    destination: `@Recipient`,
  };

  t.test(`allows skip_queue on bulk payloads`, tt => {
    const data: BulkTransactions<Record<string, never>> = {
      skip_queue: true,
      transactions: [
        {...baseBulkTxn, reference: `bulk_ref_001`},
        {...baseBulkTxn, reference: `bulk_ref_002`, amount: 2000},
      ],
    };

    tt.equal(ValidateBulkTransactions(data), null);
    tt.end();
  });

  t.test(`rejects invalid skip_queue on bulk payloads`, tt => {
    const data = {
      skip_queue: `true`,
      transactions: [
        {...baseBulkTxn, reference: `bulk_ref_001`},
        {...baseBulkTxn, reference: `bulk_ref_002`, amount: 2000},
      ],
    } as unknown as BulkTransactions<Record<string, never>>;

    tt.equal(
      ValidateBulkTransactions(data),
      `skip_queue must be a boolean if provided.`,
    );
    tt.end();
  });

  t.end();
});

tap.test(`Issue #45 — updateStatus precise_amount on partial commit`, t => {
  t.test(`allows commit with precise_amount only`, tt => {
    const data: UpdateTransactionStatus<Record<string, never>> = {
      status: `commit`,
      precise_amount: 50000,
    };

    tt.equal(ValidateUpdateTransactions(data), null);
    tt.end();
  });

  t.test(`allows precise_amount as a string for large integers`, tt => {
    const data: UpdateTransactionStatus<Record<string, never>> = {
      status: `commit`,
      precise_amount: `9007199254740993`,
    };

    tt.equal(ValidateUpdateTransactions(data), null);
    tt.end();
  });

  t.test(`allows full commit without amount or precise_amount`, tt => {
    const data: UpdateTransactionStatus<Record<string, never>> = {
      status: `commit`,
    };

    tt.equal(ValidateUpdateTransactions(data), null);
    tt.end();
  });

  t.test(`allows amount and precise_amount together`, tt => {
    const data: UpdateTransactionStatus<Record<string, never>> = {
      status: `commit`,
      amount: 500,
      precise_amount: 50000,
    };

    tt.equal(ValidateUpdateTransactions(data), null);
    tt.end();
  });

  t.test(`rejects invalid precise_amount string values`, tt => {
    const data: UpdateTransactionStatus<Record<string, never>> = {
      status: `commit`,
      precise_amount: `12.5`,
    };

    tt.equal(
      ValidateUpdateTransactions(data),
      `precise_amount must be a non-negative integer string or number.`,
    );
    tt.end();
  });

  t.test(`rejects unknown fields`, tt => {
    const data = {
      status: `commit`,
      precise_amount: 50000,
      currency: `USD`,
    } as unknown as UpdateTransactionStatus<Record<string, never>>;

    tt.equal(ValidateUpdateTransactions(data), `Invalid field: currency`);
    tt.end();
  });

  t.end();
});

tap.test(`Issue #46 — refund transaction request fields`, t => {
  t.test(`allows skip_queue on refund payloads`, tt => {
    const data: RefundTransactionRequest = {skip_queue: true};
    tt.equal(ValidateRefundTransaction(data), null);
    tt.end();
  });

  t.test(`allows empty refund options object`, tt => {
    const data: RefundTransactionRequest = {};
    tt.equal(ValidateRefundTransaction(data), null);
    tt.end();
  });

  t.test(`rejects invalid skip_queue on refund payloads`, tt => {
    const data = {skip_queue: `true`} as unknown as RefundTransactionRequest;
    tt.equal(
      ValidateRefundTransaction(data),
      `skip_queue must be a boolean if provided.`,
    );
    tt.end();
  });

  t.test(`rejects unknown fields on refund payloads`, tt => {
    const data = {
      skip_queue: true,
      amount: 100,
    } as unknown as RefundTransactionRequest;

    tt.equal(ValidateRefundTransaction(data), `Invalid field: amount`);
    tt.end();
  });

  t.end();
});

tap.test(`Issue #15 — bulkCommitInflight validation`, t => {
  t.test(`allows valid bulk commit inflight payloads`, tt => {
    const data: BulkCommitInflightRequest = {
      transactions: [
        {transaction_id: `txn_11111111-1111-4111-8111-111111111111`},
        {
          transaction_id: `txn_22222222-2222-4222-8222-222222222222`,
          amount: 40,
          precise_amount: `125034`,
        },
      ],
    };

    tt.equal(ValidateBulkCommitInflight(data), null);
    tt.end();
  });

  t.test(`rejects empty transactions array`, tt => {
    tt.equal(
      ValidateBulkCommitInflight({transactions: []}),
      `Transactions array cannot be empty.`,
    );
    tt.end();
  });

  t.test(`rejects oversized transactions array`, tt => {
    const transactions = Array.from(
      {length: MAX_BULK_INFLIGHT_ITEMS + 1},
      () => ({transaction_id: `txn_test`}),
    );

    tt.equal(
      ValidateBulkCommitInflight({transactions}),
      `Too many transactions; max is ${MAX_BULK_INFLIGHT_ITEMS}.`,
    );
    tt.end();
  });

  t.test(`rejects invalid precise_amount`, tt => {
    const data: BulkCommitInflightRequest = {
      transactions: [
        {
          transaction_id: `txn_11111111-1111-4111-8111-111111111111`,
          precise_amount: `-1`,
        },
      ],
    };

    tt.equal(
      ValidateBulkCommitInflight(data),
      `precise_amount must be a non-negative integer string or number at index 0.`,
    );
    tt.end();
  });

  t.end();
});

tap.test(`Issue #16 — bulkVoidInflight validation`, t => {
  t.test(`allows valid bulk void inflight payloads`, tt => {
    const data: BulkVoidInflightRequest = {
      transaction_ids: [
        `txn_11111111-1111-4111-8111-111111111111`,
        `txn_22222222-2222-4222-8222-222222222222`,
      ],
    };

    tt.equal(ValidateBulkVoidInflight(data), null);
    tt.end();
  });

  t.test(`rejects empty transaction_ids array`, tt => {
    tt.equal(
      ValidateBulkVoidInflight({transaction_ids: []}),
      `transaction_ids array cannot be empty.`,
    );
    tt.end();
  });

  t.test(`rejects oversized transaction_ids array`, tt => {
    const transaction_ids = Array.from(
      {length: MAX_BULK_INFLIGHT_ITEMS + 1},
      () => `txn_test`,
    );

    tt.equal(
      ValidateBulkVoidInflight({transaction_ids}),
      `Too many transaction_ids; max is ${MAX_BULK_INFLIGHT_ITEMS}.`,
    );
    tt.end();
  });

  t.test(`rejects missing transaction_id`, tt => {
    tt.equal(
      ValidateBulkVoidInflight({transaction_ids: [``]}),
      `transaction_id is required at index 0.`,
    );
    tt.end();
  });

  t.end();
});
