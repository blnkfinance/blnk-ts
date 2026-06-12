/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  isRetryableFetchError,
  isRetryableHttpMethod,
  isRetryableHttpStatus,
  normalizeRetryCount,
  normalizeRetryDelayMs,
  retryDelayForAttempt,
} from "../../../../src/blnk/utils/requestRetry";

tap.test(`requestRetry`, t => {
  t.test(`isRetryableHttpMethod`, tt => {
    tt.ok(isRetryableHttpMethod(`GET`));
    tt.notOk(isRetryableHttpMethod(`POST`));
    tt.notOk(isRetryableHttpMethod(`PUT`));
    tt.notOk(isRetryableHttpMethod(`DELETE`));
    tt.end();
  });

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

  t.test(`normalizeRetryCount clamps invalid values to 1`, tt => {
    tt.equal(normalizeRetryCount(undefined), 1);
    tt.equal(normalizeRetryCount(0), 1);
    tt.equal(normalizeRetryCount(-1), 1);
    tt.equal(normalizeRetryCount(Number.NaN), 1);
    tt.equal(normalizeRetryCount(Number.POSITIVE_INFINITY), 1);
    tt.equal(normalizeRetryCount(Number.NEGATIVE_INFINITY), 1);
    tt.equal(normalizeRetryCount(2.9), 2);
    tt.equal(normalizeRetryCount(3), 3);
    tt.end();
  });

  t.test(`normalizeRetryDelayMs clamps invalid values to default`, tt => {
    tt.equal(normalizeRetryDelayMs(undefined), 2000);
    tt.equal(normalizeRetryDelayMs(-1), 2000);
    tt.equal(normalizeRetryDelayMs(Number.NaN), 2000);
    tt.equal(normalizeRetryDelayMs(Number.POSITIVE_INFINITY), 2000);
    tt.equal(normalizeRetryDelayMs(Number.NEGATIVE_INFINITY), 2000);
    tt.equal(normalizeRetryDelayMs(500), 500);
    tt.end();
  });

  t.end();
});
