/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Identity} from "../../../../src/blnk/endpoints/identity";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {BlnkRequest} from "../../../../src/types/general";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {IdentityData} from "../../../../src/types/identity";

tap.test(`Identity`, async t => {
  t.test(`Create Organization Identity`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      201,
    );

    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const data: IdentityData<{}> = {
      category: `test`,
      identity_type: `organization`,
      city: `test`,
      country: `test`,
      email_address: `test@test.com`,
      organization_name: `test org`,
      state: `test`,
      post_code: `test`,
      street: `test`,
      phone_number: `1234567890`,
    };

    const response = await identity.create(data);
    childTest.match(capturedRequest.args(), [[`identities`, data, `POST`]]);
    childTest.equal(response.status, 201);
    childTest.equal(response.data?.identity_type, data.identity_type);
  });

  t.test(
    `It should handle missing fields if organization is selected`,
    async childTest => {
      const mockLogger = createMockLogger();
      const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
        true,
        undefined,
        201,
      );
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const identity = new Identity(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const data: IdentityData<{}> = {
        category: `test`,
        identity_type: `organization`,
        city: `test`,
        country: `test`,
        email_address: `test@test.com`,
        state: `test`,
        post_code: `test`,
        street: `test`,
        phone_number: `1234567890`,
      };

      const response = await identity.create(data);
      childTest.match(capturedRequest.args(), []);
      childTest.equal(response.data, null);
      childTest.equal(response.status, 400);
      childTest.end();
    },
  );

  t.test(
    `It should handle missing fields if individual is selected`,
    async childTest => {
      const mockLogger = createMockLogger();
      const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
        true,
        undefined,
        201,
      );
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const identity = new Identity(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );
      const data: IdentityData<{}> = {
        category: `test`,
        identity_type: `individual`,
        city: `test`,
        country: `test`,
        email_address: `test@test.com`,
        state: `test`,
        post_code: `test`,
        street: `test`,
        phone_number: `1234567890`,
      };

      const response = await identity.create(data);
      childTest.match(capturedRequest.args(), []);
      childTest.equal(response.data, null);
      childTest.equal(response.status, 400);
      childTest.end();
    },
  );

  t.test(`it should handle errors thrown during creation`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      false,
      `Error creating identity`,
      500,
    );

    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const data: IdentityData<{}> = {
      category: `test`,
      identity_type: `organization`,
      city: `test`,
      country: `test`,
      email_address: `test@test.com`,
      organization_name: `test org`,
      state: `test`,
      post_code: `test`,
      street: `test`,
      phone_number: `1234567890`,
    };

    const response = await identity.create(data);
    childTest.match(capturedRequest.args(), [[`identities`, data, `POST`]]);
    childTest.equal(response.status, 500);
    childTest.equal(response.data, null);
    childTest.end();
  });

  t.test(
    `create forwards identity_id and ISO dob (issue #49)`,
    async childTest => {
      const mockLogger = createMockLogger();
      const thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
      const capturedRequest = childTest.captureFn(thirdPartyRequest);
      const identity = new Identity(
        capturedRequest,
        mockLogger,
        FormatResponse,
      );

      const data: IdentityData<Record<string, unknown>> = {
        identity_id: `idt_11111111-1111-4111-8111-111111111111`,
        category: `customer`,
        identity_type: `individual`,
        first_name: `Jane`,
        last_name: `Doe`,
        gender: `female`,
        dob: `1990-01-15T00:00:00Z`,
        nationality: `US`,
        city: `New York`,
        country: `USA`,
        email_address: `jane@example.com`,
        state: `NY`,
        post_code: `10001`,
        street: `123 Main St`,
        phone_number: `1234567890`,
      };

      await identity.create(data);

      childTest.match(capturedRequest.args(), [
        [
          `identities`,
          {
            ...data,
            dob: `1990-01-15T00:00:00Z`,
          },
          `POST`,
        ],
      ]);
      childTest.end();
    },
  );

  t.test(`create serializes Date dob (issue #49)`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const data: IdentityData<Record<string, unknown>> = {
      category: `customer`,
      identity_type: `individual`,
      first_name: `Jane`,
      last_name: `Doe`,
      gender: `female`,
      dob: new Date(`1990-01-15T00:00:00.000Z`),
      nationality: `US`,
      city: `New York`,
      country: `USA`,
      email_address: `jane@example.com`,
      state: `NY`,
      post_code: `10001`,
      street: `123 Main St`,
      phone_number: `1234567890`,
    };

    await identity.create(data);

    childTest.match(capturedRequest.args(), [
      [
        `identities`,
        {
          ...data,
          dob: `1990-01-15T00:00:00Z`,
        },
        `POST`,
      ],
    ]);
    childTest.end();
  });

  t.test(`create rejects invalid identity_id (issue #49)`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest = createMockBlnkRequest(true);
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const identity = new Identity(capturedRequest, mockLogger, FormatResponse);

    const data: IdentityData<Record<string, unknown>> = {
      identity_id: `user_123`,
      category: `customer`,
      identity_type: `individual`,
      first_name: `Jane`,
      last_name: `Doe`,
      gender: `female`,
      dob: `1990-01-15T00:00:00Z`,
      nationality: `US`,
      city: `New York`,
      country: `USA`,
      email_address: `jane@example.com`,
      state: `NY`,
      post_code: `10001`,
      street: `123 Main St`,
      phone_number: `1234567890`,
    };

    const response = await identity.create(data);

    childTest.match(capturedRequest.args(), []);
    childTest.equal(response.status, 400);
    childTest.equal(
      response.message,
      `identity_id must start with idt_ followed by a valid UUID`,
    );
    childTest.end();
  });
});
