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
import {createReadStream, mkdtempSync, writeFileSync} from "fs";
import {tmpdir} from "os";
import {join} from "path";
import {Reconciliation} from "../../../../src/blnk/endpoints/reconciliation";
import {readWebStreamBody} from "../../../mocks/streamTestUtils";

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

  t.test(`Issue #55 — does not expose public getApiKey getter`, async tt => {
    tt.equal(
      Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(blnk),
        `getApiKey`,
      ),
      undefined,
    );
    tt.end();
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
    tt.ok(init.body instanceof ReadableStream);
    const payload = await readWebStreamBody(
      init.body as ReadableStream<Uint8Array>,
    );
    tt.match(payload, /a,b,c/);
    const headers = init.headers as Record<string, string>;
    tt.match(headers[`content-type`], /multipart\/form-data/);
    tt.notMatch(headers[`content-type`], /application\/json/);
    tt.equal((init as RequestInit & {duplex?: string}).duplex, `half`);
    tt.end();
  });

  t.test(
    `request converts stream-backed npm FormData for native fetch`,
    async tt => {
      const dir = mkdtempSync(join(tmpdir(), `blnk-upload-`));
      const filePath = join(dir, `upload.csv`);
      writeFileSync(filePath, `amount,ref\n100,abc`);

      const formData = new FormDataNode();
      formData.append(`source`, `stripe`);
      formData.append(`file`, createReadStream(filePath), {
        filename: `upload.csv`,
      });

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
      tt.ok(init.body instanceof ReadableStream);
      const payload = await readWebStreamBody(
        init.body as ReadableStream<Uint8Array>,
      );
      tt.match(payload, /amount,ref/);
      tt.match(payload, /100,abc/);
      tt.equal((init as RequestInit & {duplex?: string}).duplex, `half`);
      tt.end();
    },
  );

  t.test(
    `reconciliation.upload sends stream multipart body through native fetch`,
    async tt => {
      const dir = mkdtempSync(join(tmpdir(), `blnk-recon-upload-`));
      const filePath = join(dir, `upload.csv`);
      writeFileSync(filePath, `amount,ref\n200,xyz`);

      const capturedFetch = tt.captureFn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
          ({
            ok: true,
            status: 201,
            json: async () => ({upload_id: `upl_test`}),
            statusText: `Created`,
          }) as Response,
      );
      const uploadBlnk = new Blnk(
        apiKey,
        options,
        {...mockServices, Reconciliation},
        FormatResponse,
        capturedFetch,
      );

      const response = await uploadBlnk.Reconciliation.upload(
        filePath,
        `stripe`,
      );

      tt.equal(response.status, 201);
      const init = capturedFetch.calls[0]?.args[1] as RequestInit;
      tt.ok(init.body instanceof ReadableStream);
      const payload = await readWebStreamBody(
        init.body as ReadableStream<Uint8Array>,
      );
      tt.match(payload, /stripe/);
      tt.match(payload, /200,xyz/);
      tt.equal((init as RequestInit & {duplex?: string}).duplex, `half`);
      tt.end();
    },
  );

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

  t.test(`request returns 408 when fetch aborts immediately`, async tt => {
    const abortingFetch = async (): Promise<Response> => {
      throw new DOMException(`The operation was aborted.`, `AbortError`);
    };

    const abortBlnk = new Blnk(
      apiKey,
      options,
      mockServices,
      FormatResponse,
      abortingFetch,
    );

    const result = await abortBlnk[`request`](`/slow`, {foo: `bar`}, `POST`);

    tt.equal(result.status, 408);
    tt.match(result.message, /timed out/);
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

  t.test(`defaults client timeout and retry options`, async tt => {
    const defaultBlnk = new Blnk(
      apiKey,
      {baseUrl: `http://mock-api.com`},
      mockServices,
      FormatResponse,
      thirdPartyRequest,
    );
    tt.equal(defaultBlnk[`options`].timeout, 10000);
    tt.equal(defaultBlnk[`options`].retryCount, 1);
    tt.equal(defaultBlnk[`options`].retryDelayMs, 2000);
    tt.end();
  });

  t.test(`request attaches structured error from error_detail`, async tt => {
    const errorFetch = async () =>
      ({
        ok: false,
        status: 404,
        json: async () => ({
          error: `ledger not found`,
          error_detail: {
            code: `LGR_NOT_FOUND`,
            message: `ledger not found`,
          },
        }),
        statusText: `Not Found`,
      }) as Response;
    const errorBlnk = new Blnk(
      apiKey,
      options,
      mockServices,
      FormatResponse,
      errorFetch,
    );

    const result = await errorBlnk[`request`](`ledgers/missing`, {}, `GET`);

    tt.equal(result.status, 404);
    tt.same(result.error, {
      code: `LGR_NOT_FOUND`,
      message: `ledger not found`,
    });
    tt.end();
  });

  t.test(`request retries retryable 5xx GET responses`, async tt => {
    let calls = 0;
    const retryFetch = async () => {
      calls += 1;
      if (calls === 1) {
        return {
          ok: false,
          status: 503,
          json: async () => ({error: `temporarily unavailable`}),
          statusText: `Service Unavailable`,
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({message: `Success`}),
        statusText: `OK`,
      } as Response;
    };

    const retryBlnk = new Blnk(
      apiKey,
      {...options, retryCount: 3, retryDelayMs: 1},
      mockServices,
      FormatResponse,
      retryFetch,
    );

    const result = await retryBlnk[`request`](`/retry-me`, {}, `GET`);

    tt.equal(calls, 2);
    tt.equal(result.status, 200);
    tt.end();
  });

  t.test(`request does not retry mutating POST on 5xx`, async tt => {
    let calls = 0;
    const postFetch = async () => {
      calls += 1;
      return {
        ok: false,
        status: 503,
        json: async () => ({
          error: `temporarily unavailable`,
          error_detail: {
            code: `GEN_INTERNAL`,
            message: `temporarily unavailable`,
          },
        }),
        statusText: `Service Unavailable`,
      } as Response;
    };

    const postBlnk = new Blnk(
      apiKey,
      {...options, retryCount: 3, retryDelayMs: 1},
      mockServices,
      FormatResponse,
      postFetch,
    );

    const result = await postBlnk[`request`](
      `transactions`,
      {amount: 100},
      `POST`,
    );

    tt.equal(calls, 1);
    tt.equal(result.status, 503);
    tt.same(result.error?.code, `GEN_INTERNAL`);
    tt.end();
  });

  t.test(`request does not retry timeouts even when retryCount > 1`, async tt => {
    let calls = 0;
    const timeoutFetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> =>
      new Promise((_resolve, reject) => {
        calls += 1;
        init?.signal?.addEventListener(`abort`, () => {
          reject(new DOMException(`The operation was aborted.`, `AbortError`));
        });
      });

    const timeoutBlnk = new Blnk(
      apiKey,
      {...options, timeout: 10, retryCount: 3, retryDelayMs: 1},
      mockServices,
      FormatResponse,
      timeoutFetch,
    );

    const result = await timeoutBlnk[`request`](`/slow`, {}, `GET`);

    tt.equal(calls, 1);
    tt.equal(result.status, 408);
    tt.end();
  });

  t.test(
    `request returns structured error after GET retries are exhausted`,
    async tt => {
      let calls = 0;
      const failingFetch = async () => {
        calls += 1;
        return {
          ok: false,
          status: 503,
          json: async () => ({
            error: `still unavailable`,
            error_detail: {
              code: `GEN_INTERNAL`,
              message: `still unavailable`,
            },
          }),
          statusText: `Service Unavailable`,
        } as Response;
      };

      const exhaustedBlnk = new Blnk(
        apiKey,
        {...options, retryCount: 2, retryDelayMs: 1},
        mockServices,
        FormatResponse,
        failingFetch,
      );

      const result = await exhaustedBlnk[`request`](`/unstable`, {}, `GET`);

      tt.equal(calls, 2);
      tt.equal(result.status, 503);
      tt.same(result.error, {
        code: `GEN_INTERNAL`,
        message: `still unavailable`,
      });
      tt.end();
    },
  );

  t.test(`retryCount below 1 is normalized to 1`, async tt => {
    const normalizedBlnk = new Blnk(
      apiKey,
      {baseUrl: `http://mock-api.com`, retryCount: 0},
      mockServices,
      FormatResponse,
      thirdPartyRequest,
    );

    tt.equal(normalizedBlnk[`options`].retryCount, 1);
    tt.end();
  });

  t.test(`non-finite retry options are normalized on the client`, async tt => {
    const normalizedBlnk = new Blnk(
      apiKey,
      {
        baseUrl: `http://mock-api.com`,
        retryCount: Number.NaN,
        retryDelayMs: Number.POSITIVE_INFINITY,
      },
      mockServices,
      FormatResponse,
      thirdPartyRequest,
    );

    tt.equal(normalizedBlnk[`options`].retryCount, 1);
    tt.equal(normalizedBlnk[`options`].retryDelayMs, 2000);
    tt.end();
  });

  t.test(`request does not retry 4xx responses`, async tt => {
    let calls = 0;
    const clientErrorFetch = async () => {
      calls += 1;
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: `bad request`,
          error_detail: {code: `GEN_BAD_REQUEST`, message: `bad request`},
        }),
        statusText: `Bad Request`,
      } as Response;
    };

    const noRetryBlnk = new Blnk(
      apiKey,
      {...options, retryCount: 3, retryDelayMs: 1},
      mockServices,
      FormatResponse,
      clientErrorFetch,
    );

    const result = await noRetryBlnk[`request`](`/bad`, {foo: `bar`}, `POST`);

    tt.equal(calls, 1);
    tt.equal(result.status, 400);
    tt.same(result.error?.code, `GEN_BAD_REQUEST`);
    tt.end();
  });

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
