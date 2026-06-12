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
import FormDataNode from "form-data";

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
      thirdPartyRequest,
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
        thirdPartyRequest,
      );
    });
  });

  t.test(
    `Constructor should set apiKey, options, logger, services, and formatResponse correctly`,
    async tt => {
      tt.equal(blnk[`apiKey`], apiKey, `apiKey is set correctly`);
      tt.equal(blnk[`options`].timeout, 5000, `timeout is set correctly`);
      tt.equal(blnk[`logger`], options.logger, `logger is set correctly`);
      tt.equal(blnk[`services`], mockServices, `services are set correctly`);
      tt.equal(
        blnk[`formatResponse`],
        FormatResponse,
        `formatResponse is set correctly`,
      );
    },
  );

  t.test(`request converts npm FormData for native fetch`, async tt => {
    const formData = new FormDataNode();
    formData.append(`source`, `stripe`);
    formData.append(`file`, Buffer.from(`a,b,c`), {filename: `test.csv`});

    const capturedFetch = tt.captureFn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        ({
          ok: true,
          status: 201,
          json: async () => ({upload_id: `upl_test`}),
          statusText: `Created`,
        }) as Response,
    );
    const formBlnk = new Blnk(
      apiKey,
      options,
      mockServices,
      FormatResponse,
      capturedFetch,
    );

    await formBlnk[`request`](`reconciliation/upload`, formData, `POST`);

    const init = capturedFetch.calls[0]?.args[1] as RequestInit;
    tt.ok(init.body instanceof Uint8Array);
    const headers = init.headers as Record<string, string>;
    tt.match(headers[`content-type`], /multipart\/form-data/);
    tt.notMatch(headers[`content-type`], /application\/json/);
    tt.end();
  });

  t.test(`request passes AbortSignal for timeout`, async tt => {
    const signalFetch = async (
      _input: RequestInfo | URL,
      _init?: RequestInit,
    ) =>
      ({
        ok: true,
        status: 200,
        json: async () => ({message: `Success`}),
        statusText: `OK`,
      }) as Response;
    const capturedFetch = tt.captureFn(signalFetch);
    const signalBlnk = new Blnk(
      apiKey,
      options,
      mockServices,
      FormatResponse,
      capturedFetch,
    );

    await signalBlnk[`request`](`/test`, {foo: `bar`}, `POST`);

    const capturedInit = capturedFetch.calls[0]?.args[1] as
      | RequestInit
      | undefined;
    tt.ok(capturedInit?.signal instanceof AbortSignal);
    tt.end();
  });

  t.test(`request returns 408 when fetch aborts (timeout)`, async tt => {
    const abortingFetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(`abort`, () => {
          reject(new DOMException(`The operation was aborted.`, `AbortError`));
        });
      });

    const timeoutBlnk = new Blnk(
      apiKey,
      {...options, timeout: 10},
      mockServices,
      FormatResponse,
      abortingFetch,
    );

    const result = await timeoutBlnk[`request`](`/slow`, {foo: `bar`}, `POST`);

    tt.equal(result.status, 408);
    tt.match(result.message, /timed out/);
    tt.end();
  });

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
        `Returns the expected ApiResponse`,
      );
    },
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
        fetchFailMock.fetch,
      );
      const result = await badBlnkRequest[`request`](endpoint, data, method);
      tt.same(
        result,
        {status: 500, message: `Failed`, data: {message: `Failed`}},
        `Returns the expected ApiResponse`,
      );
    },
  );

  t.test(`should append "/" to base url if it is not set`, async tt => {
    const optionsWithoutBaseUrl = {
      ...options,
      baseUrl: `base`,
    };
    const blnkWithoutBaseUrl = new Blnk(
      apiKey,
      optionsWithoutBaseUrl,
      mockServices,
      FormatResponse,
      thirdPartyRequest,
    );
    tt.equal(blnkWithoutBaseUrl[`options`].baseUrl, `base/`);
  });
  t.end();
});
