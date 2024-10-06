const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const {GenerateRandomNumbersWithPrefix, sleep, BASE_URL} = require(`../util`);

async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: BASE_URL,
  });

  const {Ledgers, LedgerBalances, Transactions} = blnk;
  const usdLedger = await Ledgers.create({
    name: `Customer USD Ledger`,
    meta_data: {
      project_name: `VirtualCard App`,
    },
  });

  if (usdLedger.data === null) {
    throw new Error(usdLedger.message);
  }

  //creating a usd virtual card
  const usdBalance = await LedgerBalances.create({
    ledger_id: usdLedger.data.ledger_id,
    currency: `USD`,
    meta_data: {
      customer_name: `Jerry`,
      customer_internal_id: `1234`,
      card_state: `ACTIVE`,
      card_number: `411111XXXXXX1111`, // Masked for security
      card_expiry: `12/26`,
      card_cvv: `XXX`, // Masked for security
    },
  });
  if (usdBalance.data === null || usdBalance.status !== 201) {
    throw new Error(usdBalance.message);
  }

  //first transaction on this balance, so we put it in @Merchant or @World and allow overdrafts please see `https://docs.blnkfinance.com/transactions/overdrafts` for more info
  const firstTransaction = await Transactions.create({
    amount: 1000,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`trx`, 4),
    description: `First transaction on this balance`,
    currency: `USD`,
    source: `@World`,
    destination: `@Merchant`,
    allow_overdraft: true,
    meta_data: {
      merchant_name: `Store ABC`,
      customer_name: `Jerry`,
    },
  });

  if (firstTransaction.data === null || firstTransaction.status !== 201) {
    throw new Error(firstTransaction.message);
  }

  //authorizing transactions
  //record an inflight transaction
  const reference = GenerateRandomNumbersWithPrefix(`trx`, 4);
  const inflightTransaction = await Transactions.create({
    amount: 1000,
    precision: 100,
    reference,
    description: `Authorization for purchase`,
    currency: `USD`,
    source: `@Merchant`,
    destination: usdBalance.data.balance_id, // Jerry's virtual card balance_id
    inflight: true,
    meta_data: {
      merchant_name: `Store ABC`,
      customer_name: `Jerry`,
    },
  });

  if (inflightTransaction.data === null || inflightTransaction.status !== 201) {
    throw new Error(inflightTransaction.message);
  }

  ///sleep for 4 seconds to simulate waiting for a webhook or action to commit the transaction, also allows for it to be processed
  await sleep(4);
  //after the transaction has been verified you can update it here
  const x = await Transactions.updateStatus(
    inflightTransaction.data.transaction_id,
    {
      status: `commit`,
    }
  );

  if (x.data === null || x.status !== 200) {
    throw new Error(x.message);
  }

  //if the transaction failed or was cancelled on your users end, void it
  await Transactions.updateStatus(inflightTransaction.data.transaction_id, {
    status: `void`,
  });
}

main();
