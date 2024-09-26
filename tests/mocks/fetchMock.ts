/* eslint-disable n/no-unpublished-import */
// src/mocks/fetchMock.ts
import t from "tap";
export const fetchMock = t.createMock(
  {fetch},
  {
    fetch: async (
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          message: `Success`,
        }),
        text: async () => `Mock text response`,
        headers: new Headers(init?.headers), // Simulate headers if needed
        statusText: `OK`,
        url: input.toString(),
        redirected: false,
        type: `basic`,
        body: null,
        bodyUsed: false,
      } as unknown as Response; // Cast to Response
    },
  }
);

export const fetchFailMock = t.createMock(
  {fetch},
  {
    fetch: async (
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      return {
        ok: false,
        status: 500,
        json: async () => ({
          message: `Failed`,
        }),
        text: async () => `Failed`,
        headers: new Headers(init?.headers), // Simulate headers if needed
        statusText: `Failed`,
        url: input.toString(),
        redirected: false,
        type: `basic`,
        body: null,
        bodyUsed: false,
      } as unknown as Response; // Cast to Response
    },
  }
);
