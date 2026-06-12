/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Reconciliation} from "../../../../src/blnk/endpoints/reconciliation";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {DeleteMatchingRuleResp} from "../../../../src/types/reconciliation";

const mockResponse: DeleteMatchingRuleResp = {
  message: `Matching rule deleted successfully`,
};

tap.test(`Issue #21 — Reconciliation.deleteMatchingRule`, async t => {
  t.test(
    `deleteMatchingRule DELETEs reconciliation/matching-rules/{id}`,
    async tt => {
      const mockLogger = createMockLogger();
      const thirdPartyRequest = async <R>() => ({
        status: 200,
        message: `Success`,
        data: mockResponse as unknown as R,
      });
      const capturedRequest = tt.captureFn(thirdPartyRequest);
      const reconciliation = new Reconciliation(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const response = await reconciliation.deleteMatchingRule(`rule_test_123`);

      tt.match(capturedRequest.args(), [
        [`reconciliation/matching-rules/rule_test_123`, undefined, `DELETE`],
      ]);
      tt.equal(response.status, 200);
      tt.equal(response.data?.message, `Matching rule deleted successfully`);
      tt.end();
    },
  );

  t.test(`deleteMatchingRule rejects empty rule id`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 200,
      message: `Success`,
      data: mockResponse as unknown as R,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.deleteMatchingRule(``);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `matching rule id is required`);
    tt.end();
  });

  t.test(`deleteMatchingRule forwards API errors`, async tt => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = async <R>() => ({
      status: 404,
      message: `Matching rule not found`,
      data: null as R | null,
    });
    const capturedRequest = tt.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );

    const response = await reconciliation.deleteMatchingRule(`rule_missing`);

    tt.match(capturedRequest.args(), [
      [`reconciliation/matching-rules/rule_missing`, undefined, `DELETE`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
