/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Reconciliation} from "../../../../src/blnk/endpoints/reconciliation";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
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
  dry_run: true,
  matching_rule_ids: [`rule_abc123`],
};

tap.test(`Issue #18 — Reconciliation.runInstant`, async t => {
  t.test(`runInstant POSTs reconciliation/start-instant`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <T, R>(
      endpoint: string,
      data: T,
      method: `POST` | `GET` | `PUT` | `DELETE`,
    ) => ({
      status: 200,
      message: `Success`,
      data: {reconciliation_id: `rec_test_123`} as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.runInstant(validData);

    tt.match(capturedRequest.args(), [
      [`reconciliation/start-instant`, validData, `POST`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.reconciliation_id, `rec_test_123`);
    tt.end();
  });

  t.test(`runInstant returns 400 for invalid payload`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <T, R>() => ({
      status: 200,
      message: `Success`,
      data: {reconciliation_id: `rec_test_123`} as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.runInstant({
      ...validData,
      external_transactions: [],
    });

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /external_transactions/);
    tt.end();
  });

  t.test(`runInstant forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <T, R>() => ({
      status: 500,
      message: `Failed to start instant reconciliation`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.runInstant(validData);

    tt.match(capturedRequest.args(), [
      [`reconciliation/start-instant`, validData, `POST`],
    ]);
    tt.equal(response.status, 500);
    tt.end();
  });
});
