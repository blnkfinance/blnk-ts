/* eslint-disable n/no-unpublished-import */
import {createServer, IncomingMessage, Server, ServerResponse} from "node:http";
import {AddressInfo} from "node:net";
import tap from "tap";
import {BlnkInit} from "../../../../src";
import {Blnk} from "../../../../src/blnk/endpoints/baseBlnkClient";
import {
  assertNoDotSegments,
  endpointPath,
  InvalidPathSegmentError,
  pathReference,
  pathSegment,
} from "../../../../src/blnk/utils/pathSegment";
import {BlnkLogger} from "../../../../src/types/blnkClient";
import {ApiResponse} from "../../../../src/types/general";

/**
 * Path-injection tests. Every call goes through the real client and global
 * fetch to a local HTTP server that records the raw request target, so the
 * assertions are about what actually leaves the process.
 */

const silentLogger: BlnkLogger = {
  info: () => {},
  error: () => {},
  debug: () => {},
};

interface Recorder {
  server: Server;
  origin: string;
  requests: {method: string; url: string}[];
}

async function startRecorder(): Promise<Recorder> {
  const requests: {method: string; url: string}[] = [];
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    requests.push({method: req.method ?? ``, url: req.url ?? ``});
    req.resume();
    req.on(`end`, () => {
      res.writeHead(200, {"content-type": `application/json`});
      res.end(`{}`);
    });
  });
  await new Promise<void>(resolve => server.listen(0, `127.0.0.1`, resolve));
  const {port} = server.address() as AddressInfo;
  return {server, origin: `http://127.0.0.1:${port}`, requests};
}

type Call = (blnk: Blnk, id: string) => Promise<ApiResponse<unknown>>;

interface Method {
  name: string;
  call: Call;
  /** Core path sent for the valid ID `ldg_123`. */
  validPath: string;
}

const matcher = {
  name: `rule`,
  description: `rule`,
  criteria: [{field: `amount` as const, operator: `equals` as const}],
};
const monitor = {
  balance_id: `bln_1`,
  condition: {
    field: `debit_balance`,
    operator: `>` as const,
    value: 1,
    precision: 100,
  },
};
const hook = {
  name: `hook`,
  url: `https://example.com/hook`,
  type: `PRE_TRANSACTION` as const,
  active: true,
  timeout: 5,
  retry_count: 0,
};

/** Every SDK method that places a caller-supplied value in the URL path. */
const METHODS: Method[] = [
  {
    name: `Ledgers.get`,
    call: (b, id) => b.Ledgers.get(id),
    validPath: `/ledgers/ldg_123`,
  },
  {
    name: `Ledgers.update`,
    call: (b, id) => b.Ledgers.update(id, {name: `n`}),
    validPath: `/ledgers/ldg_123`,
  },
  {
    name: `LedgerBalances.get`,
    call: (b, id) => b.LedgerBalances.get(id),
    validPath: `/balances/ldg_123`,
  },
  {
    name: `LedgerBalances.getByIndicator (indicator)`,
    call: (b, id) => b.LedgerBalances.getByIndicator(id, `USD`),
    validPath: `/balances/indicator/ldg_123/currency/USD`,
  },
  {
    name: `LedgerBalances.getByIndicator (currency)`,
    call: (b, id) => b.LedgerBalances.getByIndicator(`@World`, id),
    validPath: `/balances/indicator/%40World/currency/ldg_123`,
  },
  {
    name: `LedgerBalances.updateIdentity`,
    call: (b, id) =>
      b.LedgerBalances.updateIdentity(id, {identity_id: `idt_1`}),
    validPath: `/balances/ldg_123/identity`,
  },
  {
    name: `LedgerBalances.getAt`,
    call: (b, id) =>
      b.LedgerBalances.getAt(id, {timestamp: `2025-08-30T01:38:30Z`}),
    validPath: `/balances/ldg_123/at`,
  },
  {
    name: `LedgerBalances.getLineage`,
    call: (b, id) => b.LedgerBalances.getLineage(id),
    validPath: `/balances/ldg_123/lineage`,
  },
  {
    name: `Transactions.updateStatus`,
    call: (b, id) => b.Transactions.updateStatus(id, {status: `commit`}),
    validPath: `/transactions/inflight/ldg_123`,
  },
  {
    name: `Transactions.refund`,
    call: (b, id) => b.Transactions.refund(id),
    validPath: `/refund-transaction/ldg_123`,
  },
  {
    name: `Transactions.get`,
    call: (b, id) => b.Transactions.get(id),
    validPath: `/transactions/ldg_123`,
  },
  {
    name: `Transactions.getLineage`,
    call: (b, id) => b.Transactions.getLineage(id),
    validPath: `/transactions/ldg_123/lineage`,
  },
  {
    name: `BalanceMonitor.get`,
    call: (b, id) => b.BalanceMonitor.get(id),
    validPath: `/balance-monitors/ldg_123`,
  },
  {
    name: `BalanceMonitor.listByBalanceId`,
    call: (b, id) => b.BalanceMonitor.listByBalanceId(id),
    validPath: `/balance-monitors/balances/ldg_123`,
  },
  {
    name: `BalanceMonitor.update`,
    call: (b, id) => b.BalanceMonitor.update(id, monitor),
    validPath: `/balance-monitors/ldg_123`,
  },
  {
    name: `BalanceMonitor.delete`,
    call: (b, id) => b.BalanceMonitor.delete(id),
    validPath: `/balance-monitors/ldg_123`,
  },
  {
    name: `Reconciliation.updateMatchingRule`,
    call: (b, id) => b.Reconciliation.updateMatchingRule(id, matcher),
    validPath: `/reconciliation/matching-rules/ldg_123`,
  },
  {
    name: `Reconciliation.deleteMatchingRule`,
    call: (b, id) => b.Reconciliation.deleteMatchingRule(id),
    validPath: `/reconciliation/matching-rules/ldg_123`,
  },
  {
    name: `Reconciliation.get`,
    call: (b, id) => b.Reconciliation.get(id),
    validPath: `/reconciliation/ldg_123`,
  },
  {
    name: `Identity.get`,
    call: (b, id) => b.Identity.get(id),
    validPath: `/identities/ldg_123`,
  },
  {
    name: `Identity.update`,
    call: (b, id) =>
      b.Identity.update(id, {identity_type: `individual`, first_name: `A`}),
    validPath: `/identities/ldg_123`,
  },
  {
    name: `Identity.delete`,
    call: (b, id) => b.Identity.delete(id),
    validPath: `/identities/ldg_123`,
  },
  {
    name: `Identity.getTokenizedFields`,
    call: (b, id) => b.Identity.getTokenizedFields(id),
    validPath: `/identities/ldg_123/tokenized-fields`,
  },
  {
    name: `Identity.tokenizeField (id)`,
    call: (b, id) => b.Identity.tokenizeField(id, `FirstName`),
    validPath: `/identities/ldg_123/tokenize/FirstName`,
  },
  {
    name: `Identity.tokenizeField (field)`,
    call: (b, id) => b.Identity.tokenizeField(`idt_1`, id as never),
    validPath: `/identities/idt_1/tokenize/ldg_123`,
  },
  {
    name: `Identity.tokenize`,
    call: (b, id) => b.Identity.tokenize(id, {fields: [`FirstName`]}),
    validPath: `/identities/ldg_123/tokenize`,
  },
  {
    name: `Identity.detokenizeField (id)`,
    call: (b, id) => b.Identity.detokenizeField(id, `FirstName`),
    validPath: `/identities/ldg_123/detokenize/FirstName`,
  },
  {
    name: `Identity.detokenizeField (field)`,
    call: (b, id) => b.Identity.detokenizeField(`idt_1`, id as never),
    validPath: `/identities/idt_1/detokenize/ldg_123`,
  },
  {
    name: `Identity.detokenize`,
    call: (b, id) => b.Identity.detokenize(id, {fields: [`FirstName`]}),
    validPath: `/identities/ldg_123/detokenize`,
  },
  {
    name: `Metadata.update`,
    call: (b, id) => b.Metadata.update(id, {meta_data: {a: 1}}),
    validPath: `/ldg_123/metadata`,
  },
  {
    name: `Hooks.get`,
    call: (b, id) => b.Hooks.get(id),
    validPath: `/hooks/ldg_123`,
  },
  {
    name: `Hooks.update`,
    call: (b, id) => b.Hooks.update(id, hook),
    validPath: `/hooks/ldg_123`,
  },
  {
    name: `Hooks.delete`,
    call: (b, id) => b.Hooks.delete(id),
    validPath: `/hooks/ldg_123`,
  },
  {
    name: `ApiKeys.delete`,
    call: (b, id) => b.ApiKeys.delete(id),
    validPath: `/api-keys/ldg_123`,
  },
];

/** Search takes a collection name rather than an ID. */
const COLLECTION_METHODS: {name: string; call: Call; validPath: string}[] = [
  {
    name: `Search.search`,
    call: (b, c) => b.Search.search({q: `x`}, c as never),
    validPath: `/search/ledgers`,
  },
  {
    name: `Search.filter`,
    call: (b, c) => b.Search.filter({filters: []}, c as never),
    validPath: `/ledgers/filter`,
  },
];

const HOSTILE_IDS = [
  `../backup`,
  `../search/reindex`,
  `../api-keys/x`,
  `%2e%2e/%2e%2e/secret`,
  `%2E%2E`,
  `..%2Fbackup`,
  `ldg_1/../../backup`,
  `.`,
  `..`,
  `?`,
  `ldg_1?x=1`,
  `#`,
  `\\`,
  `..\\backup`,
  `ldg_1\r\nX-Injected: 1`,
  ``,
];

interface Target {
  name: string;
  options: (origin: string) => {baseUrl: string; instanceId?: string};
  prefix: string;
}

const TARGETS: Target[] = [
  {name: `Core`, options: origin => ({baseUrl: origin}), prefix: ``},
  {
    name: `Cloud proxy`,
    options: origin => ({baseUrl: origin, instanceId: `instance_1`}),
    prefix: `/proxy`,
  },
];

function client(origin: string, target: Target): Blnk {
  return BlnkInit(`secret-key`, {
    ...target.options(origin),
    logger: silentLogger,
    timeout: 2000,
    retryCount: 1,
  });
}

tap.test(`hostile IDs are rejected and nothing is sent`, async t => {
  const rec = await startRecorder();
  t.teardown(() => rec.server.close());

  for (const target of TARGETS) {
    const blnk = client(rec.origin, target);
    for (const method of [...METHODS, ...COLLECTION_METHODS]) {
      for (const id of HOSTILE_IDS) {
        rec.requests.length = 0;
        const res = await method.call(blnk, id);
        t.equal(
          res.status,
          400,
          `${target.name} ${method.name}(${JSON.stringify(id)}) returns 400`,
        );
        t.same(
          rec.requests,
          [],
          `${target.name} ${method.name}(${JSON.stringify(id)}) sends nothing`,
        );
      }
    }
  }
});

tap.test(`scanner proof-of-concept calls send nothing`, async t => {
  const rec = await startRecorder();
  t.teardown(() => rec.server.close());
  const core = client(rec.origin, TARGETS[0]);
  const proxy = client(rec.origin, TARGETS[1]);

  const cases: [string, () => Promise<ApiResponse<unknown>>][] = [
    [
      `Transactions.refund("../search/reindex")`,
      () => core.Transactions.refund(`../search/reindex`),
    ],
    [`Identity.get("../backup")`, () => core.Identity.get(`../backup`)],
    [
      `Hooks.delete("../api-keys/api_key_victim")`,
      () => core.Hooks.delete(`../api-keys/api_key_victim`),
    ],
    [
      `Ledgers.get("%2e%2e/%2e%2e/secret") via proxy`,
      () => proxy.Ledgers.get(`%2e%2e/%2e%2e/secret`),
    ],
  ];
  for (const [name, call] of cases) {
    rec.requests.length = 0;
    const res = await call();
    t.equal(res.status, 400, `${name} returns 400`);
    t.same(rec.requests, [], `${name} sends nothing`);
  }
});

tap.test(`valid IDs are unchanged on the wire`, async t => {
  const rec = await startRecorder();
  t.teardown(() => rec.server.close());

  for (const target of TARGETS) {
    const blnk = client(rec.origin, target);
    for (const method of METHODS) {
      rec.requests.length = 0;
      const res = await method.call(blnk, `ldg_123`);
      t.equal(res.status, 200, `${target.name} ${method.name} succeeds`);
      t.equal(
        rec.requests.length,
        1,
        `${target.name} ${method.name} sends one request`,
      );
      const path = (rec.requests[0]?.url ?? ``).split(`?`)[0];
      t.equal(
        path,
        `${target.prefix}${method.validPath}`,
        `${target.name} ${method.name} path`,
      );
    }
    for (const method of COLLECTION_METHODS) {
      rec.requests.length = 0;
      const res = await method.call(blnk, `ledgers`);
      t.equal(res.status, 200, `${target.name} ${method.name} succeeds`);
      const path = (rec.requests[0]?.url ?? ``).split(`?`)[0];
      t.equal(
        path,
        `${target.prefix}${method.validPath}`,
        `${target.name} ${method.name} path`,
      );
    }
  }

  const core = client(rec.origin, TARGETS[0]);
  rec.requests.length = 0;
  await core.Ledgers.get(`ldg 1`);
  t.same(
    rec.requests.map(r => r.url),
    [`/ledgers/ldg%201`],
    `a space is escaped to %20`,
  );
});

tap.test(
  `Transactions.getByReference escapes free-form references`,
  async t => {
    const rec = await startRecorder();
    t.teardown(() => rec.server.close());
    const blnk = client(rec.origin, TARGETS[0]);

    rec.requests.length = 0;
    const ok = await blnk.Transactions.getByReference(`order/2025/%41?#`);
    t.equal(ok.status, 200);
    t.same(
      rec.requests.map(r => r.url),
      [`/transactions/reference/order%2F2025%2F%2541%3F%23`],
    );

    for (const ref of [
      ``,
      `.`,
      `..`,
      `../backup`,
      `a/../../backup`,
      `..\\backup`,
    ]) {
      rec.requests.length = 0;
      const res = await blnk.Transactions.getByReference(ref);
      t.equal(
        res.status,
        400,
        `getByReference(${JSON.stringify(ref)}) returns 400`,
      );
      t.same(
        rec.requests,
        [],
        `getByReference(${JSON.stringify(ref)}) sends nothing`,
      );
    }
  },
);

tap.test(`pathSegment`, t => {
  t.equal(pathSegment(`ldg_123`), `ldg_123`);
  t.equal(pathSegment(`@World`), `%40World`);
  t.equal(pathSegment(`a b`), `a%20b`);
  t.throws(() => pathSegment(``, `ledger id`), /ledger id is required/);
  t.throws(() => pathSegment(undefined), /path segment must be a string/);
  t.throws(() => pathSegment(1), InvalidPathSegmentError);
  for (const bad of [`.`, `..`]) {
    t.throws(() => pathSegment(bad), /cannot be "\." or "\.\."/);
  }
  for (const bad of [
    `a/b`,
    `a\\b`,
    `a?b`,
    `a#b`,
    `a%2e`,
    `a\nb`,
    `a\u0000b`,
    `a\u007fb`,
  ]) {
    t.throws(
      () => pathSegment(bad),
      /not allowed in a URL path/,
      JSON.stringify(bad),
    );
  }
  t.end();
});

tap.test(`pathReference`, t => {
  t.equal(pathReference(`order/2025/%41`), `order%2F2025%2F%2541`);
  t.equal(pathReference(`ref.v1..2`), `ref.v1..2`);
  t.throws(() => pathReference(``), /is required/);
  for (const bad of [`.`, `..`, `../x`, `x/./y`, `x\\..`]) {
    t.throws(() => pathReference(bad), /cannot contain/, bad);
  }
  t.end();
});

tap.test(`endpointPath`, t => {
  t.equal(endpointPath`ledgers`, `ledgers`);
  t.equal(
    endpointPath`identities/${`idt_1`}/tokenize/${`FirstName`}`,
    `identities/idt_1/tokenize/FirstName`,
  );
  t.throws(() => endpointPath`ledgers/${`../backup`}`, InvalidPathSegmentError);
  t.end();
});

tap.test(`assertNoDotSegments`, t => {
  t.doesNotThrow(() => assertNoDotSegments(`ledgers/ldg_1?x=../y`));
  t.doesNotThrow(() => assertNoDotSegments(`transactions/reference/a.b`));
  for (const bad of [
    `../backup`,
    `ledgers/%2e%2e/%2e%2e/secret`,
    `ledgers/%2E%2E`,
    `ledgers/..%2Fbackup`,
    `ledgers/%252e%252e`,
    `ledgers/.%5Cbackup`,
    `ledgers/./x`,
  ]) {
    t.throws(() => assertNoDotSegments(bad), /dot segments/, bad);
  }
  t.throws(() => assertNoDotSegments(`ledgers/%E0%A4%A`), /malformed/);
  // Decoding stops after a fixed number of rounds.
  t.doesNotThrow(() => assertNoDotSegments(`ledgers/%2525252525252e`));
  t.end();
});
