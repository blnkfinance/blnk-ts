/* eslint-disable n/no-unpublished-import */
// src/mocks/fetchMock.ts
import t from "tap";

const fetchTarget = {fetch: globalThis.fetch};

export const fetchMock = t.createMock(fetchTarget, {
  fetch: async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: `Success`,
      }),
      text: async () => JSON.stringify({message: `Success`}),
      headers: new Headers(init?.headers),
      statusText: `OK`,
      url: input.toString(),
      redirected: false,
      type: `basic`,
      body: null,
      bodyUsed: false,
    } as unknown as Response;
  },
});

export const fetchFailMock = t.createMock(fetchTarget, {
  fetch: async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    return {
      ok: false,
      status: 500,
      json: async () => ({
        message: `Failed`,
      }),
      text: async () => JSON.stringify({message: `Failed`}),
      headers: new Headers(init?.headers),
      statusText: `Failed`,
      url: input.toString(),
      redirected: false,
      type: `basic`,
      body: null,
      bodyUsed: false,
    } as unknown as Response;
  },
});
