/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {HandleError} from "../../../../src/blnk/utils/logger";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";

tap.test(`HandleError`, t => {
  t.test(`redacts sensitive values before logging`, tt => {
    const logged: unknown[][] = [];
    const logger = {
      info: () => undefined,
      error: (_message: string, ...meta: unknown[]) => {
        logged.push(meta);
      },
    };

    HandleError(
      new Error(`failed with X-Blnk-Key: blnk_secret`),
      logger,
      FormatResponse,
      `create`,
    );

    tt.same(logged[0], [
      {name: `Error`, message: `failed with X-Blnk-Key: [REDACTED]`},
    ]);
    tt.end();
  });

  t.end();
});
