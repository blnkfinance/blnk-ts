/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {fetchFailMock, fetchMock} from "../../../mocks/fetchMock";
import {Blnk} from "../../../../src/blnk/endpoints/baseBlnkClient";
import {
  createMockBlnkClientOptions,
  createMockServices,
} from "../../../mocks/blnkClientMocks";
import {BlnkClientOptions} from "../../../../src/types/blnkClient";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";

tap.test(`Blnk SDK tests`, t => {
  const options: BlnkClientOptions = createMockBlnkClientOptions();
  const thirdPartyRequest = fetchMock.fetch;
  const mockServices = createMockServices();
  let blnk: Blnk;
  const apiKey = `123455`;
  t.beforeEach(() => {
    blnk = new Blnk(
      apiKey,
      options,
      mockServices,
      FormatResponse,
      thirdPartyRequest
    );
  });

  t.test(`Init Blnk Client`, async tt => {
    tt.equal(blnk[`apiKey`], apiKey);
  });

  t.test(`should throw error when baseUrl is missing in options`, async tt => {
    const invalidOptions = {} as unknown as never;
    tt.throws(() => {
      new Blnk(
        apiKey,
        invalidOptions,
        mockServices,
        FormatResponse,
        thirdPartyRequest
      );
    });
  });

  t.test(
    `Constructor should set apiKey, options, logger, services, and formatResponse correctly`,
    async tt => {
      tt.equal(blnk[`apiKey`], apiKey, `apiKey is set correctly`);
      tt.equal(blnk[`options`].timeout, 5000, `timeout is set correctly`);
      tt.same(
        blnk[`options`].headers,
        {Authorization: `Bearer mockToken`},
        `headers are set correctly`
      );
      tt.equal(blnk[`logger`], options.logger, `logger is set correctly`);
      tt.equal(blnk[`services`], mockServices, `services are set correctly`);
      tt.equal(
        blnk[`formatResponse`],
        FormatResponse,
        `formatResponse is set correctly`
      );
    }
  );

  t.test(
    `request method should make successful POST request and return formatted response`,
    async tt => {
      const endpoint = `/test-endpoint`;
      const data = {foo: `bar`};
      const method = `POST`;

      const result = await blnk[`request`](endpoint, data, method);

      tt.same(
        result,
        {
          status: 200,
          message: `Success`,
          data: {
            message: `Success`,
          },
        },
        `Returns the expected ApiResponse`
      );
    }
  );

  t.test(
    `request method should make failed request and return formatted response`,
    async tt => {
      const endpoint = `/test-endpoint`;
      const data = {foo: `bar`};
      const method = `POST`;

      const badBlnkRequest = new Blnk(
        apiKey,
        options,
        mockServices,
        FormatResponse,
        fetchFailMock.fetch
      );
      const result = await badBlnkRequest[`request`](endpoint, data, method);

      console.log(`resulttt`, result);
      tt.same(
        result,
        {status: 500, message: `Failed`, data: {message: `Failed`}},
        `Returns the expected ApiResponse`
      );
    }
  );
  t.end();
});
