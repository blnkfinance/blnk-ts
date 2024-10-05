const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const {GenerateRandomNumbersWithPrefix} = require(`../util`);

async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: process.env.BASE_URL,
    logger: console,
  });

  const {Ledgers, LedgerBalances, Transactions} = blnk;
  const savingsLedger = await Ledgers.create({
    name: `Savings Ledger`,
    meta_data: {
      description: `Ledger for managing savings accounts`,
    },
  });

  if (savingsLedger.data === null || savingsLedger.status !== 201) {
    throw new Error(savingsLedger.message);
  }

  const aliceSavings = await LedgerBalances.create({
    ledger_id: savingsLedger.data.ledger_id,
    currency: `USD`,
    meta_data: {
      account_type: `Escrow`,
      customer_name: `Alice Johnson`,
      customer_id: `alice-5678`,
      account_opened_date: `2024-01-01`,
      account_status: `active`,
    },
  });

  if (aliceSavings.data === null || aliceSavings.status !== 201) {
    throw new Error(aliceSavings.message);
  }

  //funding alice savings balance by creating a transaction
  //first time funding so we enable overdraft
  const aliceDeposit = await Transactions.create({
    amount: 1000,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`funding`, 4),
    description: `Funding savings account`,
    currency: `USD`,
    source: `@bank-account`,
    destination: aliceSavings.data.balance_id, // Alice's savings account balance_id
    inflight: true,
    allow_overdraft: true, // Enable overdraft for the first deposit
    meta_data: {
      transaction_type: `deposit`,
      customer_name: `Alice Johnson`,
      customer_id: `alice-5678`,
      transaction_date: `2024-07-05`,
      payment_verified: false,
    },
  });
  if (aliceDeposit.data === null || aliceDeposit.status !== 201) {
    throw new Error(aliceDeposit.message);
  }
}

main().catch(error => {
  console.error(error);
});
