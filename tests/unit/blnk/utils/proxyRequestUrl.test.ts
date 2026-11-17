/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  buildBlnkRequestUrl,
  normalizeInstanceId,
} from "../../../../src/blnk/utils/proxyRequestUrl";
import {InvalidPathSegmentError} from "../../../../src/blnk/utils/pathSegment";
import {DEFAULT_CLOUD_API_BASE_URL} from "../../../../src/blnk/constants/clientDefaults";

tap.test(`normalizeInstanceId`, t => {
  t.equal(normalizeInstanceId(undefined), undefined);
  t.equal(normalizeInstanceId(`instance_abc`), `instance_abc`);
  t.equal(normalizeInstanceId(`  instance_abc  `), `instance_abc`);
  t.throws(() => normalizeInstanceId(``), /instanceId cannot be empty/);
  t.throws(() => normalizeInstanceId(`   `), /instanceId cannot be empty/);
  t.throws(
    () => normalizeInstanceId(1 as unknown as string),
    /instanceId must be a string/,
  );
  t.end();
});

tap.test(`buildBlnkRequestUrl`, t => {
  t.test(`keeps Core URLs unchanged when instanceId is omitted`, tt => {
    tt.equal(
      buildBlnkRequestUrl(`http://mock-api.com/`, `ledgers`),
      `http://mock-api.com/ledgers`,
    );
    tt.equal(
      buildBlnkRequestUrl(`http://mock-api.com/`, `/test-endpoint`),
      `http://mock-api.com//test-endpoint`,
    );
    tt.equal(
      buildBlnkRequestUrl(`http://mock-api.com/`, `ledgers?limit=10`),
      `http://mock-api.com/ledgers?limit=10`,
    );
    tt.end();
  });

  t.test(`prefixes /proxy and appends instance_id query param`, tt => {
    tt.equal(
      buildBlnkRequestUrl(
        `${DEFAULT_CLOUD_API_BASE_URL}/`,
        `ledgers`,
        `instance_abc`,
      ),
      `https://api.cloud.blnkfinance.com/proxy/ledgers?instance_id=instance_abc`,
    );
    tt.end();
  });

  t.test(`keeps existing Core query params and sets instance_id`, tt => {
    tt.equal(
      buildBlnkRequestUrl(
        `${DEFAULT_CLOUD_API_BASE_URL}/`,
        `ledgers?limit=10&offset=20`,
        `instance_abc`,
      ),
      `https://api.cloud.blnkfinance.com/proxy/ledgers?limit=10&offset=20&instance_id=instance_abc`,
    );
    tt.end();
  });

  t.test(`strips a leading slash on Core paths for proxy requests`, tt => {
    tt.equal(
      buildBlnkRequestUrl(
        `${DEFAULT_CLOUD_API_BASE_URL}/`,
        `/refund-transaction/txn_1`,
        `instance_abc`,
      ),
      `https://api.cloud.blnkfinance.com/proxy/refund-transaction/txn_1?instance_id=instance_abc`,
    );
    tt.end();
  });

  t.test(
    `does not double-prefix when the path already starts with proxy`,
    tt => {
      tt.equal(
        buildBlnkRequestUrl(
          `${DEFAULT_CLOUD_API_BASE_URL}/`,
          `proxy/ledgers`,
          `instance_abc`,
        ),
        `https://api.cloud.blnkfinance.com/proxy/ledgers?instance_id=instance_abc`,
      );
      tt.end();
    },
  );

  t.test(`does not double-prefix when baseUrl already ends with /proxy`, tt => {
    tt.equal(
      buildBlnkRequestUrl(
        `https://api.cloud.blnkfinance.com/proxy/`,
        `ledgers`,
        `instance_abc`,
      ),
      `https://api.cloud.blnkfinance.com/proxy/ledgers?instance_id=instance_abc`,
    );
    tt.end();
  });

  t.test(`encodes instance_id values`, tt => {
    tt.equal(
      buildBlnkRequestUrl(
        `${DEFAULT_CLOUD_API_BASE_URL}/`,
        `health`,
        `instance a&b`,
      ),
      `https://api.cloud.blnkfinance.com/proxy/health?instance_id=instance+a%26b`,
    );
    tt.end();
  });

  t.end();
});

tap.test(`buildBlnkRequestUrl refuses paths that leave the base`, t => {
  const bases: [string, string | undefined][] = [
    [`http://mock-api.com/`, undefined],
    [`http://mock-api.com/api/`, undefined],
    [`http://mock-api.com/`, `instance_1`],
    [`http://mock-api.com/proxy/`, `instance_1`],
  ];
  const endpoints = [
    `ledgers/../backup`,
    `ledgers/%2e%2e/%2e%2e/secret`,
    `ledgers/%2E%2E`,
    `ledgers/..%2Fbackup`,
    `ledgers/.`,
    `../api-keys/x`,
  ];
  for (const [base, instanceId] of bases) {
    for (const endpoint of endpoints) {
      t.throws(
        () => buildBlnkRequestUrl(base, endpoint, instanceId),
        InvalidPathSegmentError,
        `${base} ${instanceId ?? `core`} ${endpoint}`,
      );
    }
  }

  t.throws(
    () =>
      buildBlnkRequestUrl(
        `http://mock-api.com/proxy/`,
        `http://evil.example/x`,
        `instance_1`,
      ),
    /escapes the API base/,
  );
  t.equal(
    buildBlnkRequestUrl(`http://mock-api.com/`, `//evil.example/x`, `inst`),
    `http://mock-api.com/proxy/evil.example/x?instance_id=inst`,
    `protocol-relative path stays under /proxy/`,
  );
  t.end();
});
