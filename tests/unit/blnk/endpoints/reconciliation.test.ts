/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Reconciliation} from "../../../../src/blnk/endpoints/reconciliation";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {BlnkRequest} from "../../../../src/types/general";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {Matcher, RunReconData} from "../../../../src/types/reconciliation";
import {createReadStream} from "fs";
import FormData from "form-data";
import path from "path";

const filePath = path.join(__dirname, `..`, `..`, `..`, `..`, `file.csv`);
tap.test(`Reconciliation`, async t => {
  t.test(`Create Matching Rule`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      201
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse
    );
    const data: Matcher = {
      criteria: [
        {
          field: `amount`,
          operator: `equals`,
          allowable_drift: 0.01,
        },
      ],
      description: `Test Matching Rule`,
      name: `Test Matching Rule`,
    };
    const response = await reconciliation.createMatchingRule(data);
    childTest.match(capturedRequest.args(), [
      [`reconciliation/matching-rules`, data, `POST`],
    ]);
    childTest.match(response.status, 201);
    childTest.end();
  });

  t.test(
    `should upload file successfully when given a valid file path`,
    async childTest => {
      const mockLogger = createMockLogger();
      const thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const reconciliation = new Reconciliation(
        capturedRequest,
        mockLogger,
        FormatResponse
      );
      const response = await reconciliation.upload(filePath, `Stripe`);
      childTest.type(capturedRequest.args()[0][1], FormData); //makes sure that the second parameter called in the function is FormData
      childTest.match(response.status, 201);
      childTest.end();
    }
  );

  t.test(
    `should handle error gracefully when given an invalid file path`,
    async childTest => {
      const mockLogger = createMockLogger();
      const filePath = `./no_file.csv`;
      const thirdPartyRequest = createMockBlnkRequest(
        false,
        `File does not exist at path: ${filePath}`,
        404
      );
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const reconciliation = new Reconciliation(
        capturedRequest,
        mockLogger,
        FormatResponse
      );
      const response = await reconciliation.upload(filePath, `Stripe`);
      childTest.match(response.status, 404);
      childTest.end();
    }
  );

  t.test(
    `should upload file successfully when given a valid Readstream`,
    async childTest => {
      const mockLogger = createMockLogger();
      const thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const reconciliation = new Reconciliation(
        capturedRequest,
        mockLogger,
        FormatResponse
      );
      const readStream = createReadStream(filePath);
      const response = await reconciliation.upload(readStream, `Stripe`);
      childTest.type(capturedRequest.args()[0][1], FormData); //makes sure that the second parameter called in the function is FormData
      childTest.match(response.status, 201);
      childTest.end();
    }
  );
});

tap.test(`Run Reconciliation`, async t => {
  t.test(`Start Reconciliation`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      201
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse
    );
    const data: RunReconData = {
      upload_id: `0987654321`,
      matching_rule_ids: [`1233455555`],
      dry_run: false,
      strategy: `one_to_many`,
      grouping_criteria: `amount`,
    };
    const response = await reconciliation.run(data);
    childTest.match(capturedRequest.args(), [
      [`reconciliation/start`, data, `POST`],
    ]);
    childTest.match(response.status, 201);
    childTest.end();
  });

  t.test(`should handle thrown errors gracefully`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      false,
      `An error occurred`,
      500
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const reconciliation = new Reconciliation(
      capturedRequest,
      mockLogger,
      FormatResponse
    );
    const data: RunReconData = {
      upload_id: `0987654321`,
      matching_rule_ids: [`1233455555`],
      dry_run: false,
      strategy: `one_to_many`,
      grouping_criteria: `amount`,
    };
    const response = await reconciliation.run(data);
    childTest.match(response.status, 500);
    childTest.end();
  });
});
