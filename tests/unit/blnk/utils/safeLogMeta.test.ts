/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  redactSensitiveLogMeta,
  redactSensitiveLogValue,
  redactSensitiveString,
  safeLogMeta,
} from "../../../../src/blnk/utils/safeLogMeta";

tap.test(`safeLogMeta`, t => {
  t.test(`redacts auth header values in strings`, tt => {
    const input = `Request failed with X-Blnk-Key: blnk_local_dev_secret`;
    tt.equal(
      redactSensitiveString(input),
      `Request failed with X-Blnk-Key: [REDACTED]`,
    );
    tt.end();
  });

  t.test(`redacts sensitive object keys`, tt => {
    const redacted = redactSensitiveLogMeta({
      endpoint: `health`,
      apiKey: `blnk_secret`,
      headers: {
        "X-Blnk-Key": `blnk_secret`,
        "content-type": `application/json`,
      },
    });

    tt.equal(redacted.apiKey, `[REDACTED]`);
    tt.same(redacted.headers, {
      "X-Blnk-Key": `[REDACTED]`,
      "content-type": `application/json`,
    });
    tt.end();
  });

  t.test(`redacts Error objects to name and message only`, tt => {
    const redacted = redactSensitiveLogValue(
      new Error(`fetch failed with X-Blnk-Key: blnk_secret`),
    );

    tt.same(redacted, {
      name: `Error`,
      message: `fetch failed with X-Blnk-Key: [REDACTED]`,
    });
    tt.end();
  });

  t.test(`safeLogMeta sanitizes mixed metadata`, tt => {
    const [errorMeta] = safeLogMeta({
      endpoint: `transactions`,
      error: new Error(`network error`),
      authorization: `Bearer abc123`,
    });

    tt.same(errorMeta, {
      endpoint: `transactions`,
      error: {name: `Error`, message: `network error`},
      authorization: `[REDACTED]`,
    });
    tt.end();
  });

  t.end();
});
