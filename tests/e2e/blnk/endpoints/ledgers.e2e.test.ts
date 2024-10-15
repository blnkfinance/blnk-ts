/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {BlnkClientOptions} from "../../../../src/types/blnkClient";
import {
  BASE_URL,
  GenerateRandomNumbersWithPrefix,
  Sleep,
} from "../../../utils.test";
import {BlnkInit} from "../../../../src";
import {CreateLedger} from "../../../../src/types/ledger";
import {CreateLedgerBalance} from "../../../../src/types/ledgerBalances";
import {CreateTransactions} from "../../../../src/types/transactions";
import {IdentityData} from "../../../../src/types/identity";
import {MonitorData} from "../../../../src/types/balanceMonitor";
import path from "path";
import {Matcher, RunReconData} from "../../../../src/types/reconciliation";

let ledgerId = ``;
let ledgerBalanceId = ``;
let transactionId = ``;
let identityId = ``;
let balanceMonitorId = ``;
let uploadId = ``;
let matchingRuleId = ``;
const ledgerBalanceFields = [
  `balance`,
  `version`,
  `inflight_balance`,
  `credit_balance`,
  `debit_balance`,
  `inflight_debit_balance`,
  `inflight_credit_balance`,
  `ledger_id`,
  `identity_id`,
  `balance_id`,
  `currency`,
  `created_at`,
  `inflight_expires_at`,
];
const transactionFields = [
  `transaction_id`,
  `amount`,
  `currency`,
  `source`,
  `destination`,
  `reference`,
  `status`,
  `created_at`,
  `precision`,
];
tap.test(`Ledgers end to end test`, async t => {
  const clientOptions: BlnkClientOptions = {
    baseUrl: BASE_URL,
  };

  const client = BlnkInit(``, clientOptions);
  //   t.nock(BASE_URL).post(`/ledgers`).reply(201, {
  //     ledger_id: ledgerId,
  //     name: ``,
  //     created_at: new Date(),
  //   });
  t.test(`create a ledger`, async childTest => {
    const ledgerData: CreateLedger<{}> = {
      name: `Test Ledger`,
    };

    const response = await client.Ledgers.create(ledgerData);

    childTest.ok(response, `response is successful`);
    childTest.equal(response.status, 201);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, [`ledger_id`, `name`, `created_at`]);
    childTest.type(response.data?.created_at, `string`);
    childTest.type(response.data?.ledger_id, `string`);
    ledgerId = response.data!.ledger_id;
    childTest.end();
  });

  t.test(`create a ledger fail`, async childTest => {
    const ledgerData: unknown = {};
    //this should fail, since we pass an empty object to the create method
    const response = await client.Ledgers.create(
      ledgerData as CreateLedger<{}>
    );
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 400);
  });

  t.test(`It should fetch a ledger created`, async childTest => {
    const response = await client.Ledgers.getLedger(ledgerId);

    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, [`ledger_id`, `name`, `created_at`]);
    childTest.end();
  });

  t.test(`It should return 400`, async childTest => {
    const response = await client.Ledgers.getLedger(`123456789`);
    console.log(`response`, response);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 400);
    childTest.end();
  });
  t.end();
});

tap.test(`Identity`, async t => {
  const clientOptions: BlnkClientOptions = {
    baseUrl: BASE_URL,
  };
  const client = BlnkInit(``, clientOptions);

  t.test(`create an individual identity`, async childTest => {
    const identityData: IdentityData<{}> = {
      category: `cutomer`,
      city: `Ikeja`,
      country: `NG`,
      first_name: `Test`,
      email_address: `test@test.com`,
      identity_type: `individual`,
      phone_number: `+2348012345678`,
      post_code: `100001`,
      state: `Lagos`,
      street: `123 Test Street`,
      dob: new Date(`1996-02-25`),
      gender: `male`,
      last_name: `Test`,
      nationality: `Nigerian`,
    };

    const response = await client.Identity.create(identityData);

    childTest.ok(response, `identity is created`);
    childTest.equal(response.status, 201);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, [
      `identity_id`,
      `created_at`,
      `identity_type`,
    ]);
    identityId = response.data!.identity_id;
    childTest.end();
  });
  t.end();
});

tap.test(`Ledger balances`, async t => {
  const clientOptions: BlnkClientOptions = {
    baseUrl: BASE_URL,
  };
  const client = BlnkInit(``, clientOptions);

  t.test(`It should create a balance`, async childTest => {
    const balanceData: CreateLedgerBalance<{}> = {
      currency: `USD`,
      ledger_id: ledgerId,
      identity_id: identityId,
      meta_data: {},
    };
    const response = await client.LedgerBalances.create(balanceData);

    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 201);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, ledgerBalanceFields);
    ledgerBalanceId = response.data!.balance_id;
  });

  t.test(`get ledger balances`, async childTest => {
    const response = await client.LedgerBalances.get(ledgerBalanceId);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, ledgerBalanceFields);
    childTest.end();
  });

  t.test(`it should return 400`, async childTest => {
    const response = await client.LedgerBalances.get(`123456789`);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 400);
    childTest.end();
  });
  t.end();
});

tap.test(`Ledger balance transactions`, async t => {
  const clientOptions: BlnkClientOptions = {
    baseUrl: BASE_URL,
  };
  const client = BlnkInit(``, clientOptions);
  t.test(`It should create a transaction on a balance`, async childTest => {
    const transactionData: CreateTransactions<{}> = {
      amount: 1000,
      currency: `USD`,
      description: `Test transaction`,
      precision: 100,
      reference: GenerateRandomNumbersWithPrefix(`test`, 4),
      source: `@bank-account`,
      destination: ledgerBalanceId,
      inflight: true,
      allow_overdraft: true, // Enable overdraft for the first deposit
      meta_data: {},
    };

    const response = await client.Transactions.create(transactionData);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 201);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, [
      ...transactionFields,
      `precise_amount`,
    ]);
    transactionId = response.data!.transaction_id;
    childTest.end();
  });

  t.test(`it should commit the transaction`, async childTest => {
    //we sleep a bit so the transaction enqueues
    await Sleep(2);
    const response = await client.Transactions.updateStatus(transactionId, {
      status: `commit`,
    });

    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, [
      ...transactionFields,
      `precise_amount`,
    ]);
    childTest.end();
  });

  t.test(`it should void the transaction`, async childTest => {
    //we sleep a bit so the transaction enqueues
    await Sleep(2);
    const response = await client.Transactions.updateStatus(transactionId, {
      status: `void`,
    });
    childTest.ok(response, `response is returned`);

    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, transactionFields);
    childTest.end();
  });
  t.end();
});

tap.test(`Balance Monitors`, async t => {
  const clientOptions: BlnkClientOptions = {
    baseUrl: BASE_URL,
  };
  const client = BlnkInit(``, clientOptions);
  t.test(`It should create a balance monitor`, async childTest => {
    const monitorData: MonitorData = {
      balance_id: ledgerBalanceId,
      condition: {
        field: `credit_balance`,
        operator: `>=`,
        precision: 100,
        value: 1000,
      },
      description: `Tier 1 account`,
    };

    const response = await client.BalanceMonitor.create(monitorData);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 201);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, [`monitor_id`, `balance_id`]);
    balanceMonitorId = response.data!.monitor_id;
    childTest.end();
  });

  t.test(`It should list all balance monitors`, async childTest => {
    const response = await client.BalanceMonitor.list();
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);
    childTest.type(response.data!, `array`);
    childTest.end();
  });

  t.test(`It should fail to get the balance monitor`, async childTest => {
    const response = await client.BalanceMonitor.get(`123456789`);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 400);
    childTest.end();
  });

  t.test(`It should get a balance monitor`, async childTest => {
    const response = await client.BalanceMonitor.get(balanceMonitorId);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);
    // childTest.hasProps(response.data!, []);
    childTest.end();
  });
  t.end();
});

tap.test(`Reconciliation`, async t => {
  const filePath = path.join(__dirname, `..`, `..`, `..`, `..`, `file.csv`);
  const clientOptions: BlnkClientOptions = {
    baseUrl: BASE_URL,
  };
  const client = BlnkInit(``, clientOptions);
  t.test(`It should create a matching rule`, async childTest => {
    const matchingRuleData: Matcher = {
      description: `Test matching rule`,
      criteria: [
        {
          field: `amount`,
          operator: `equals`,
          allowable_drift: 0.01,
        },
      ],
      name: `Test matching rule`,
    };
    const response =
      await client.Reconciliation.createMatchingRule(matchingRuleData);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 201);
    matchingRuleId = response.data!.rule_id;
    childTest.end();
  });

  t.test(`it should fail to upload a reconciliation file`, async childTest => {
    const response = await client.Reconciliation.upload(`no path`, `Stripe`);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 404);
    childTest.end();
  });

  t.test(`it should upload a reconciliation file`, async childTest => {
    const response = await client.Reconciliation.upload(filePath, `Stripe`);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);

    childTest.hasProps(response.data!, [`upload_id`]);
    uploadId = response.data!.upload_id;
    childTest.end();
  });

  t.test(`Run Reconciliation`, async childTest => {
    const data: RunReconData = {
      dry_run: true,
      grouping_criteria: `amount`,
      matching_rule_ids: [matchingRuleId],
      strategy: `one_to_many`,
      upload_id: uploadId,
    };
    const response = await client.Reconciliation.run(data);
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);

    childTest.hasProps(response.data!, [`reconciliation_id`]);
    childTest.end();
  });
  t.end();
});
