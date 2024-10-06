const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const {GenerateRandomNumbersWithPrefix, sleep, BASE_URL} = require(`../util`);

async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: BASE_URL,
    logger: console,
  });
  const {Ledgers, Transactions, LedgerBalances} = blnk;
  //create a USD ledger
  const usdLedger = await Ledgers.create({
    name: `Customer USD Ledger`,
    meta_data: {
      project_name: `SendWorld App`,
    },
  });

  if (usdLedger.data === null) {
    throw new Error(usdLedger.message);
  }
  console.log(usdLedger, Transactions, LedgerBalances);

  const eurLedger = await Ledgers.create({
    name: `Customer USD Ledger`,
    meta_data: {
      project_name: `SendWorld App`,
    },
  });
  console.log(`Euro Ledger`, JSON.stringify(eurLedger, null, 2));

  const usdBalance = await LedgerBalances.create({
    ledger_id: usdLedger.data.ledger_id,
    currency: `USD`,
    meta_data: {
      customer_name: `Jerry`,
      customer_internal_id: `1234`,
    },
  });
  console.log(`USD Balance`, JSON.stringify(usdBalance, null, 2));

  const eurBalance = await LedgerBalances.create({
    ledger_id: usdLedger.data.ledger_id,
    currency: `EUR`,
    meta_data: {
      customer_name: `Jerry`,
      customer_internal_id: `1234`,
    },
  });
  console.log(`EUR Balance`, JSON.stringify(eurBalance, null, 2));

  const usdTransaction = await Transactions.create({
    amount: 200,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`ref`, 4),
    description: `payment for service rendered`,
    currency: `USD`,
    source: `@World`,
    destination: usdBalance.data.balance_id,
    allow_overdraft: true,
    meta_data: {
      sender_name: `Future Design LLC`,
      sender_internal_id: `123333`,
    },
  });

  console.log(`USD Funding`, JSON.stringify(usdTransaction, null, 2));

  const eurTransaction = await Transactions.create({
    amount: 3500.5,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`ref`, 4),
    description: `invoice A fulfilled`,
    currency: `EUR`,
    source: `@World`,
    destination: eurBalance.data.balance_id,
    allow_overdraft: true,
    meta_data: {
      sender_name: `Nlnk Bank`,
      sender_internal_id: `563825`,
    },
  });

  await sleep(4);
  console.log(`Eur Funding`, JSON.stringify(eurTransaction, null, 2));

  //moving money out of wallets
  const usdDebit = await Transactions.create({
    amount: 200,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`ref`, 4),
    description: `payment for service rendered`,
    currency: `USD`,
    destination: `@World`,
    source: usdBalance.data.balance_id,
    meta_data: {
      sender_name: `Future Design LLC`,
      sender_internal_id: `123333`,
    },
  });
  console.log(`usd debit`, usdDebit);

  const eurDebit = await Transactions.create({
    amount: 1470.49,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`ref`, 4),
    description: `payment for service rendered`,
    currency: `EUR`,
    destination: `@World`,
    source: eurBalance.data.balance_id,
    meta_data: {
      sender_name: `Future Design LLC`,
      sender_internal_id: `123333`,
    },
  });
  console.log(`eur debit`, eurDebit);

  await sleep(4);
  //check balance
  const usdBalanceView = await LedgerBalances.get(usdBalance.data.balance_id);
  const eurBalanceView = await LedgerBalances.get(eurBalance.data.balance_id);
  console.log(`usd balance after debit`, usdBalanceView);
  console.log(`eur balance after debit`, eurBalanceView);

  //moving money between multicurrency wallets
  const usdToEur = await Transactions.create({
    amount: 200,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`ref`, 4),
    description: `payment for service rendered`,
    currency: `USD`,
    destination: eurBalance.data.balance_id,
    source: usdBalance.data.balance_id,
    rate: 0.92,
    meta_data: {
      sender_name: `Future Design LLC`,
      sender_internal_id: `123333`,
    },
  });
  console.log(`usd to eur wallet`, usdToEur);
}

main();
