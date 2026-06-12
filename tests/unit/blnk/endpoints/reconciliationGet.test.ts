/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Reconciliation} from "../../../../src/blnk/endpoints/reconciliation";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {ReconciliationResp} from "../../../../src/types/reconciliation";

const mockReconciliation: ReconciliationResp = {
  reconciliation_id: `recon_test_123`,
  upload_id: `instant_abc`,
  status: `completed`,
  matched_transactions: 2,
  unmatched_transactions: 1,
  is_dry_run: true,
  started_at: `2026-06-12T04:23:48.196087Z`,
  completed_at: `2026-06-12T04:23:49.196087Z`,
};

tap.test(`Issue #19 — Reconciliation.get`, async t => {
  t.test(`get calls reconciliation/{id}`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockReconciliation as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.get(`recon_test_123`);

    tt.match(capturedRequest.args(), [
      [`reconciliation/recon_test_123`, undefined, `GET`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.reconciliation_id, `recon_test_123`);
    tt.equal(response.data?.status, `completed`);
    tt.end();
  });

  t.test(`get rejects empty reconciliation id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockReconciliation as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.get(``);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `reconciliation id is required`);
    tt.end();
  });

  t.test(`get forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `Reconciliation not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.get(`recon_missing`);

    tt.match(capturedRequest.args(), [
      [`reconciliation/recon_missing`, undefined, `GET`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
