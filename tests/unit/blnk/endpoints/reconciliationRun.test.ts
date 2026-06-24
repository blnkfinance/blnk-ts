/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Reconciliation} from "../../../../src/blnk/endpoints/reconciliation";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {RunReconData} from "../../../../src/types/reconciliation";

const validData: RunReconData = {
  upload_id: `upload_test_123`,
  matching_rule_ids: [`rule_test_123`],
  dry_run: true,
  strategy: `one_to_one`,
  grouping_criteria: `amount`,
};

tap.test(`Issue #121 — Reconciliation.run`, async t => {
  t.test(`run POSTs reconciliation/start`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <T, R>(
      endpoint: string,
      data: T,
      method: `POST` | `GET` | `PUT` | `DELETE`,
    ) => ({
      status: 200,
      message: `Success`,
      data: {reconciliation_id: `recon_test_123`} as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.run(validData);

    tt.match(capturedRequest.args(), [
      [`reconciliation/start`, validData, `POST`],
    ]);
    tt.equal(response.status, 200);
    tt.equal(response.data?.reconciliation_id, `recon_test_123`);
    tt.equal(Object.keys(response.data ?? {}).length, 1);
    tt.end();
  });

  t.test(`run forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 400,
      message: `matching_rule_ids is required`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.run(validData);

    tt.match(capturedRequest.args(), [
      [`reconciliation/start`, validData, `POST`],
    ]);
    tt.equal(response.status, 400);
    tt.end();
  });
});
