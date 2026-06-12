/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  isRetryableFetchError,
  isRetryableHttpStatus,
  retryDelayForAttempt,
} from "../../../../src/blnk/utils/requestRetry";

tap.test(`requestRetry`, t => {
  t.test(`isRetryableHttpStatus`, tt => {
    tt.notOk(isRetryableHttpStatus(404));
    tt.ok(isRetryableHttpStatus(500));
    tt.ok(isRetryableHttpStatus(503));
    tt.end();
  });

  t.test(`isRetryableFetchError`, tt => {
    tt.notOk(isRetryableFetchError(new DOMException(`aborted`, `AbortError`)));
    tt.ok(isRetryableFetchError(new TypeError(`fetch failed`)));
    tt.end();
  });

  t.test(`retryDelayForAttempt uses linear backoff`, tt => {
    tt.equal(retryDelayForAttempt(1, 2000), 2000);
    tt.equal(retryDelayForAttempt(2, 2000), 4000);
    tt.end();
  });

  t.end();
});
