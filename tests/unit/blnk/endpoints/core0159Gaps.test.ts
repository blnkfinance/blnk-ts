/* eslint-disable n/no-unpublished-import */
import {createServer, IncomingMessage, Server, ServerResponse} from "node:http";
import {AddressInfo} from "node:net";
import tap, {Test} from "tap";
import {BlnkInit} from "../../../../src";
import {Blnk} from "../../../../src/blnk/endpoints/baseBlnkClient";
import {BlnkLogger} from "../../../../src/types/blnkClient";
import {
  MonitorData,
  MonitorTrigger,
  UpdateMonitorRequest,
} from "../../../../src/types/balanceMonitor";
import {
  BalanceInclude,
  GetBalanceRequest,
} from "../../../../src/types/ledgerBalances";
import {
  CreateTransactions,
  UpdateTransactionStatus,
} from "../../../../src/types/transactions";

/**
 * Blnk Core 0.15.9 parity. Every call goes through the real client and global
 * fetch to a local HTTP server, so the assertions are about the method, path,
 * query string and JSON body that actually leave the process, and about
 * decoding Core-shaped responses.
 */

const silentLogger: BlnkLogger = {
  info: () => {},
  error: () => {},
  debug: () => {},
};

interface Recorded {
  method: string;
  url: string;
  body: unknown;
}

interface Recorder {
  server: Server;
  blnk: Blnk;
  requests: Recorded[];
  /** JSON the server sends for the next request(s). */
  reply: {status: number; body: unknown};
}

async function startRecorder(): Promise<Recorder> {
  const requests: Recorded[] = [];
  const reply = {status: 200, body: {} as unknown};
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on(`data`, (chunk: Buffer) => chunks.push(chunk));
    req.on(`end`, () => {
      const raw = Buffer.concat(chunks).toString(`utf8`);
      requests.push({
        method: req.method ?? ``,
        url: req.url ?? ``,
        body: raw === `` ? undefined : JSON.parse(raw),
      });
      res.writeHead(reply.status, {"content-type": `application/json`});
      res.end(JSON.stringify(reply.body));
    });
  });
  await new Promise<void>(resolve => server.listen(0, `127.0.0.1`, resolve));
  const {port} = server.address() as AddressInfo;
  const blnk = BlnkInit(`secret-key`, {
    baseUrl: `http://127.0.0.1:${port}`,
    logger: silentLogger,
    retryCount: 0,
  });
  return {server, blnk, requests, reply};
}

async function withRecorder(
  t: Test,
  fn: (r: Recorder) => Promise<void>,
): Promise<void> {
  const recorder = await startRecorder();
  t.teardown(() => new Promise<void>(r => recorder.server.close(() => r())));
  await fn(recorder);
}

const monitorBody: MonitorData = {
  balance_id: `bln_1`,
  condition: {field: `balance`, operator: `<`, value: 100, precision: 100},
  description: `Low balance`,
};

tap.test(`balance monitor trigger (gap 1)`, async t => {
  t.test(`create sends trigger and decodes the new response fields`, async tt =>
    withRecorder(tt, async r => {
      r.reply.status = 201;
      r.reply.body = {
        monitor_id: `mon_1`,
        balance_id: `bln_1`,
        description: `Low balance`,
        created_at: `2026-11-17T00:00:00Z`,
        trigger: `level`,
        condition_state: false,
        condition: {
          field: `balance`,
          operator: `<`,
          value: 100,
          precision: 100,
          precise_value: 10000,
        },
      };

      const res = await r.blnk.BalanceMonitor.create({
        ...monitorBody,
        trigger: `level`,
      });

      tt.equal(res.status, 201);
      tt.same(r.requests, [
        {
          method: `POST`,
          url: `/balance-monitors`,
          body: {...monitorBody, trigger: `level`},
        },
      ]);
      tt.equal(res.data?.trigger, `level`);
      tt.equal(res.data?.condition_state, false);
      tt.equal(res.data?.condition.precise_value, 10000);
    }),
  );

  t.test(`create without trigger leaves the key out`, async tt =>
    withRecorder(tt, async r => {
      r.reply.status = 201;
      await r.blnk.BalanceMonitor.create(monitorBody);
      tt.notOk(
        Object.prototype.hasOwnProperty.call(r.requests[0].body, `trigger`),
      );
    }),
  );

  t.test(`create rejects an unknown trigger before sending`, async tt =>
    withRecorder(tt, async r => {
      const res = await r.blnk.BalanceMonitor.create({
        ...monitorBody,
        trigger: `sometimes` as MonitorTrigger,
      });
      tt.equal(res.status, 400);
      tt.match(res.message, /trigger must be either "edge" or "level"/);
      tt.same(r.requests, []);
    }),
  );
});

tap.test(`balance monitor partial update (gap 2)`, async t => {
  t.test(`description only sends only description`, async tt =>
    withRecorder(tt, async r => {
      r.reply.body = {message: `BalanceMonitor updated successfully`};
      const res = await r.blnk.BalanceMonitor.updatePartial(`mon_1`, {
        description: `Renamed`,
      });
      tt.equal(res.status, 200);
      tt.same(r.requests, [
        {
          method: `PUT`,
          url: `/balance-monitors/mon_1`,
          body: {description: `Renamed`},
        },
      ]);
      tt.equal(res.data?.message, `BalanceMonitor updated successfully`);
      tt.equal(res.data?.precision_unchanged, undefined);
    }),
  );

  t.test(`an explicit zero value is sent without field or operator`, async tt =>
    withRecorder(tt, async r => {
      r.reply.body = {message: `BalanceMonitor updated successfully`};
      await r.blnk.BalanceMonitor.updatePartial(`mon_1`, {
        condition: {value: 0},
      });
      tt.same(r.requests[0].body, {condition: {value: 0}});
    }),
  );

  t.test(`an empty description is sent so Core clears it`, async tt =>
    withRecorder(tt, async r => {
      await r.blnk.BalanceMonitor.updatePartial(`mon_1`, {description: ``});
      tt.same(r.requests[0].body, {description: ``});
    }),
  );

  t.test(
    `all fields, with undefined keys and call_back_url dropped`,
    async tt =>
      withRecorder(tt, async r => {
        const data = {
          balance_id: `bln_2`,
          trigger: `edge`,
          description: undefined,
          call_back_url: `https://example.com/hook`,
          condition: {
            field: `debit_balance`,
            operator: `>=`,
            value: 50.5,
            precision: 100,
          },
        } as UpdateMonitorRequest;
        await r.blnk.BalanceMonitor.updatePartial(`mon_1`, data);
        tt.same(r.requests[0].body, {
          balance_id: `bln_2`,
          trigger: `edge`,
          condition: {
            field: `debit_balance`,
            operator: `>=`,
            value: 50.5,
            precision: 100,
          },
        });
      }),
  );

  t.test(`decodes precision_unchanged`, async tt =>
    withRecorder(tt, async r => {
      r.reply.body = {
        message: `BalanceMonitor updated successfully. precision was left unchanged because value was not sent with it.`,
        precision_unchanged: true,
      };
      const res = await r.blnk.BalanceMonitor.updatePartial(`mon_1`, {
        condition: {precision: 1000},
      });
      tt.same(r.requests[0].body, {condition: {precision: 1000}});
      tt.equal(res.data?.precision_unchanged, true);
    }),
  );

  const invalid: [string, string, UpdateMonitorRequest, RegExp][] = [
    [`empty request`, `mon_1`, {}, /at least one field/],
    [`empty condition`, `mon_1`, {condition: {}}, /at least one field/],
    [`missing id`, ``, {description: `x`}, /monitor id is required/],
    [
      `bad trigger`,
      `mon_1`,
      {trigger: `often` as MonitorTrigger},
      /trigger must be either/,
    ],
    [`empty balance_id`, `mon_1`, {balance_id: ` `}, /balance_id/],
    [`empty field`, `mon_1`, {condition: {field: ``}}, /condition.field/],
    [
      `bad operator`,
      `mon_1`,
      {condition: {operator: `~` as `<`}},
      /condition.operator/,
    ],
    [`NaN value`, `mon_1`, {condition: {value: NaN}}, /condition.value/],
    [
      `zero precision`,
      `mon_1`,
      {condition: {precision: 0}},
      /condition.precision/,
    ],
  ];
  for (const [name, id, data, message] of invalid) {
    t.test(`rejects ${name} before sending`, async tt =>
      withRecorder(tt, async r => {
        const res = await r.blnk.BalanceMonitor.updatePartial(id, data);
        tt.equal(res.status, 400);
        tt.match(res.message, message);
        tt.same(r.requests, []);
      }),
    );
  }

  t.test(`deprecated update still sends the full body`, async tt =>
    withRecorder(tt, async r => {
      r.reply.body = {message: `BalanceMonitor updated successfully`};
      const res = await r.blnk.BalanceMonitor.update(`mon_1`, monitorBody);
      tt.equal(res.status, 200);
      tt.same(r.requests, [
        {method: `PUT`, url: `/balance-monitors/mon_1`, body: monitorBody},
      ]);
    }),
  );
});

tap.test(`inflight commit and void reference (gap 3)`, async t => {
  t.test(`updateStatus sends reference`, async tt =>
    withRecorder(tt, async r => {
      r.reply.body = {transaction_id: `txn_2`, status: `QUEUED`};
      const update: UpdateTransactionStatus<Record<string, never>> = {
        status: `commit`,
        amount: 25,
        reference: `commit_order_8812`,
      };
      const res = await r.blnk.Transactions.updateStatus(`txn_1`, update);
      tt.equal(res.status, 200);
      tt.same(r.requests, [
        {
          method: `PUT`,
          url: `/transactions/inflight/txn_1`,
          body: {status: `commit`, amount: 25, reference: `commit_order_8812`},
        },
      ]);
    }),
  );

  t.test(`updateStatus without reference leaves the key out`, async tt =>
    withRecorder(tt, async r => {
      await r.blnk.Transactions.updateStatus(`txn_1`, {status: `void`});
      tt.same(r.requests[0].body, {status: `void`});
    }),
  );

  for (const blank of [``, ` `, `\t\n `]) {
    t.test(
      `updateStatus rejects reference ${JSON.stringify(blank)}`,
      async tt =>
        withRecorder(tt, async r => {
          const res = await r.blnk.Transactions.updateStatus(`txn_1`, {
            status: `commit`,
            reference: blank,
          });
          tt.equal(res.status, 400);
          tt.match(res.message, /reference must be a non-empty string/);
          tt.same(r.requests, []);
        }),
    );
  }

  t.test(`updateStatus rejects a non-string reference`, async tt =>
    withRecorder(tt, async r => {
      const res = await r.blnk.Transactions.updateStatus(`txn_1`, {
        status: `commit`,
        reference: 42 as unknown as string,
      });
      tt.equal(res.status, 400);
      tt.same(r.requests, []);
    }),
  );
});

const txn: CreateTransactions<Record<string, never>> = {
  amount: 750,
  precision: 100,
  reference: `ref_1`,
  description: `Card payment`,
  currency: `USD`,
  source: `bln_src`,
  destination: `bln_dst`,
  allow_overdraft: true,
};

tap.test(`overdraft_limit on create (gap 4)`, async t => {
  t.test(`create sends overdraft_limit`, async tt =>
    withRecorder(tt, async r => {
      r.reply.status = 201;
      r.reply.body = {transaction_id: `txn_1`, overdraft_limit: 500};
      const res = await r.blnk.Transactions.create({
        ...txn,
        overdraft_limit: 500,
      });
      tt.equal(res.status, 201);
      const sent = r.requests[0];
      tt.equal(sent.method, `POST`);
      tt.equal(sent.url, `/transactions`);
      tt.match(sent.body, {allow_overdraft: true, overdraft_limit: 500});
    }),
  );

  t.test(`create without overdraft_limit leaves the key out`, async tt =>
    withRecorder(tt, async r => {
      r.reply.status = 201;
      await r.blnk.Transactions.create(txn);
      tt.notOk(
        Object.prototype.hasOwnProperty.call(
          r.requests[0].body,
          `overdraft_limit`,
        ),
      );
    }),
  );

  const badLimits = [
    -1,
    -0.01,
    NaN,
    Infinity,
    -Infinity,
    `500` as unknown as number,
  ];
  for (const bad of badLimits) {
    t.test(`create rejects overdraft_limit ${String(bad)}`, async tt =>
      withRecorder(tt, async r => {
        const res = await r.blnk.Transactions.create({
          ...txn,
          overdraft_limit: bad,
        });
        tt.equal(res.status, 400);
        tt.match(res.message, /overdraft_limit must be a non-negative number/);
        tt.same(r.requests, []);
      }),
    );
  }
});

tap.test(`overdraft_limit on bulk items (gap 4)`, async t => {
  t.test(`createBulk sends overdraft_limit on each item`, async tt =>
    withRecorder(tt, async r => {
      r.reply.status = 201;
      r.reply.body = {batch_id: `bulk_1`, status: `applied`};
      await r.blnk.Transactions.createBulk({
        atomic: true,
        transactions: [
          {...txn, reference: `bulk_ref_1`, overdraft_limit: 5},
          {...txn, reference: `bulk_ref_2`},
        ],
      });
      const sent = r.requests[0];
      tt.equal(sent.url, `/transactions/bulk`);
      tt.match(sent.body, {
        transactions: [{overdraft_limit: 5}, {reference: `bulk_ref_2`}],
      });
    }),
  );

  for (const bad of [-1, NaN, Infinity]) {
    t.test(`createBulk rejects an item with overdraft_limit ${bad}`, async tt =>
      withRecorder(tt, async r => {
        const res = await r.blnk.Transactions.createBulk({
          transactions: [
            {...txn, reference: `bulk_ok`},
            {...txn, reference: `bulk_bad`, overdraft_limit: bad},
          ],
        });
        tt.equal(res.status, 400);
        tt.match(res.message, /overdraft_limit must be a non-negative number/);
        tt.same(r.requests, []);
      }),
    );
  }
});

tap.test(`include on get balance (gap 5)`, async t => {
  t.test(`sends repeated include params and decodes the embeds`, async tt =>
    withRecorder(tt, async r => {
      r.reply.body = {
        balance_id: `bln_1`,
        ledger_id: `ldg_1`,
        identity_id: `idt_1`,
        balance: 0,
        currency: `USD`,
        identity: {
          identity_id: `idt_1`,
          identity_type: `individual`,
          first_name: `Ada`,
          created_at: `2026-11-17T00:00:00Z`,
        },
        ledger: {
          ledger_id: `ldg_1`,
          name: `Customers`,
          created_at: `2026-11-17T00:00:00Z`,
        },
      };
      const res = await r.blnk.LedgerBalances.get(`bln_1`, {
        include: [`identity`, `ledger`],
      });
      tt.equal(res.status, 200);
      tt.same(r.requests, [
        {
          method: `GET`,
          url: `/balances/bln_1?include=identity&include=ledger`,
          body: undefined,
        },
      ]);
      tt.equal(res.data?.identity?.first_name, `Ada`);
      tt.equal(res.data?.ledger?.name, `Customers`);
    }),
  );

  t.test(`combines include with with_queued and drops duplicates`, async tt =>
    withRecorder(tt, async r => {
      await r.blnk.LedgerBalances.get(`bln_1`, {
        with_queued: true,
        include: [`ledger`, `ledger`],
      });
      tt.equal(
        r.requests[0].url,
        `/balances/bln_1?with_queued=true&include=ledger`,
      );
    }),
  );

  t.test(`from_source: true is still sent (docs contract)`, async tt =>
    withRecorder(tt, async r => {
      await r.blnk.LedgerBalances.get(`bln_1`, {
        from_source: true,
        include: [`identity`],
      });
      tt.equal(
        r.requests[0].url,
        `/balances/bln_1?from_source=true&include=identity`,
      );
    }),
  );

  t.test(`no options sends no query string`, async tt =>
    withRecorder(tt, async r => {
      await r.blnk.LedgerBalances.get(`bln_1`);
      tt.equal(r.requests[0].url, `/balances/bln_1`);
    }),
  );

  const invalid: [string, GetBalanceRequest][] = [
    [`an unknown include`, {include: [`transactions` as BalanceInclude]}],
    [
      `a non-array include`,
      {include: `identity` as unknown as BalanceInclude[]},
    ],
  ];
  for (const [name, options] of invalid) {
    t.test(`rejects ${name} before sending`, async tt =>
      withRecorder(tt, async r => {
        const res = await r.blnk.LedgerBalances.get(`bln_1`, options);
        tt.equal(res.status, 400);
        tt.match(res.message, /include/);
        tt.same(r.requests, []);
      }),
    );
  }
});
