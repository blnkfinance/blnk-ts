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

let ledgerId = ``;
let ledgerBalanceId = ``;
let transactionId = ``;
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
  `precise_amount`,
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
    childTest.hasProps(response.data!, transactionFields);
    transactionId = response.data!.transaction_id;
    childTest.end();
  });

  t.test(`it should update the transaction status`, async childTest => {
    //we sleep a bit so the transaction enqueues
    await Sleep(2);
    const response = await client.Transactions.updateStatus(transactionId, {
      status: `commit`,
    });
    childTest.ok(response, `response is returned`);
    childTest.equal(response.status, 200);
    childTest.type(response.data, `object`);
    childTest.hasProps(response.data!, transactionFields);
    childTest.end();
  });
});
