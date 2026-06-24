/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {coreCreateTransactionReferenceResponse} from "../../fixtures/coreCreateTransactionResponse";
import {CreateTransactionResponse} from "../../../src/types/transactions";

tap.test(`Issue #43 — CreateTransactionResponse API parity`, t => {
  t.test(`accepts Core 0.15.0 create response without rate`, tt => {
    const response: CreateTransactionResponse<Record<string, never>> = {
      ...coreCreateTransactionReferenceResponse,
    };

    tt.equal(response.rate, undefined);
    tt.end();
  });

  t.test(`accepts Core API reference create response`, tt => {
    const response: CreateTransactionResponse<Record<string, never>> =
      coreCreateTransactionReferenceResponse;

    tt.equal(response.hash.length, 64);
    tt.equal(response.parent_transaction, ``);
    tt.equal(response.allow_overdraft, false);
    tt.equal(response.inflight, false);
    tt.equal(response.scheduled_for, `0001-01-01T00:00:00Z`);
    tt.equal(response.inflight_expiry_date, `0001-01-01T00:00:00Z`);
    tt.equal(response.inflight_commit_date, `0001-01-01T00:00:00Z`);
    tt.end();
  });

  t.test(`hash field is present on reference response`, tt => {
    tt.ok(coreCreateTransactionReferenceResponse.hash);
    tt.end();
  });

  t.test(`parent_transaction field is present on reference response`, tt => {
    tt.type(
      coreCreateTransactionReferenceResponse.parent_transaction,
      `string`,
    );
    tt.end();
  });

  t.test(`allow_overdraft field is present on reference response`, tt => {
    tt.type(coreCreateTransactionReferenceResponse.allow_overdraft, `boolean`);
    tt.end();
  });

  t.test(`inflight date fields use ISO strings on reference response`, tt => {
    tt.equal(
      coreCreateTransactionReferenceResponse.inflight_expiry_date,
      `0001-01-01T00:00:00Z`,
    );
    tt.equal(
      coreCreateTransactionReferenceResponse.inflight_commit_date,
      `0001-01-01T00:00:00Z`,
    );
    tt.equal(
      coreCreateTransactionReferenceResponse.scheduled_for,
      `0001-01-01T00:00:00Z`,
    );
    tt.end();
  });

  t.test(`accepts inflight create response with custom dates`, tt => {
    const inflightResponse: CreateTransactionResponse<Record<string, never>> = {
      ...coreCreateTransactionReferenceResponse,
      status: `INFLIGHT`,
      inflight: true,
      inflight_expiry_date: `2026-12-31T23:59:59Z`,
      inflight_commit_date: `2024-04-22T15:28:03+00:00`,
      scheduled_for: `2025-12-31T23:59:59Z`,
      effective_date: `2025-02-15T10:30:00Z`,
      allow_overdraft: true,
    };

    tt.equal(inflightResponse.inflight_expiry_date, `2026-12-31T23:59:59Z`);
    tt.equal(
      inflightResponse.inflight_commit_date,
      `2024-04-22T15:28:03+00:00`,
    );
    tt.equal(inflightResponse.allow_overdraft, true);
    tt.end();
  });

  t.end();
});
