/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {BlnkClientOptions} from "../../../../src/types/blnkClient";
import {BASE_URL} from "../../../utils.test";
import {BlnkInit} from "../../../../src";
import {CreateLedger} from "../../../../src/types/ledger";

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
  let ledgerId = ``;
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
