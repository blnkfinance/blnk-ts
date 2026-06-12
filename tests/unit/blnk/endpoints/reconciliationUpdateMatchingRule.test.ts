/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Reconciliation} from "../../../../src/blnk/endpoints/reconciliation";
import {createMockLogger} from "../../../mocks/blnkClientMocks";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {Matcher, RunReconResp} from "../../../../src/types/reconciliation";

const validData: Matcher = {
  name: `Updated matcher`,
  description: `Amount with 2% drift matcher`,
  criteria: [
    {field: `amount`, operator: `equals`, allowable_drift: 0.02},
    {field: `currency`, operator: `equals`},
  ],
};

const mockResponse: RunReconResp = {
  ...validData,
  rule_id: `rule_test_123`,
  created_at: `2026-06-12T04:31:55.613241Z`,
  updated_at: `2026-06-12T04:31:55.715443261Z`,
};

tap.test(`Issue #20 — Reconciliation.updateMatchingRule`, async t => {
  t.test(
    `updateMatchingRule PUTs reconciliation/matching-rules/{id}`,
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

      const response = await reconciliation.updateMatchingRule(
        `rule_test_123`,
        validData,
      );

      tt.match(capturedRequest.args(), [
        [`reconciliation/matching-rules/rule_test_123`, validData, `PUT`],
      ]);
      tt.equal(response.status, 200);
      tt.equal(response.data?.rule_id, `rule_test_123`);
      tt.equal(response.data?.name, `Updated matcher`);
      tt.end();
    },
  );

  t.test(`updateMatchingRule rejects empty rule id`, async tt => {
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

    const response = await reconciliation.updateMatchingRule(``, validData);

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.equal(response.message, `matching rule id is required`);
    tt.end();
  });

  t.test(`updateMatchingRule returns 400 for invalid payload`, async tt => {
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

    const response = await reconciliation.updateMatchingRule(`rule_test_123`, {
      ...validData,
      criteria: [
        {
          field: `invalid` as Matcher[`criteria`][0][`field`],
          operator: `equals`,
        },
      ],
    });

    tt.equal(capturedRequest.calls.length, 0);
    tt.equal(response.status, 400);
    tt.match(response.message, /criterion|criteria/i);
    tt.end();
  });

  t.test(`updateMatchingRule forwards API errors`, async tt => {
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

    const response = await reconciliation.updateMatchingRule(
      `rule_missing`,
      validData,
    );

    tt.match(capturedRequest.args(), [
      [`reconciliation/matching-rules/rule_missing`, validData, `PUT`],
    ]);
    tt.equal(response.status, 404);
    tt.end();
  });
});
