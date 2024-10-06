const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const {BASE_URL, GenerateRandomNumbersWithPrefix} = require(`../util`);
async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: BASE_URL,
    logger: console,
  });
  const {Ledgers, LedgerBalances, Transactions} = blnk;
  const escrowLedger = await Ledgers.create({
    name: `Escrow Ledger`,
    meta_data: {
      description: `Ledger for managing escrow accounts`,
    },
  });

  if (escrowLedger.data === null || escrowLedger.status !== 201) {
    throw new Error(escrowLedger.message);
  }

  const escrowBalance1 = await LedgerBalances.create({
    ledger_id: escrowLedger.data.ledger_id,
    currency: `USD`,
    meta_data: {
      account_type: `Escrow`,
      customer_name: `Alice Johnson`,
      customer_id: `alice-5678`,
      account_opened_date: `2024-01-01`,
      account_status: `active`,
    },
  });

  if (escrowBalance1.data === null || escrowBalance1.status !== 201) {
    throw new Error(escrowBalance1.message);
  }

  const escrowBalance2 = await LedgerBalances.create({
    ledger_id: escrowLedger.data.ledger_id,
    currency: `USD`,
    meta_data: {
      account_type: `Escrow`,
      customer_name: `Bob Smith`,
      customer_id: `bob-9701`,
      account_opened_date: `2024-01-01`,
      account_status: `active`,
    },
  });

  if (escrowBalance2.data === null || escrowBalance2.status !== 201) {
    throw new Error(escrowBalance2.message);
  }

  const fundAlice = await Transactions.create({
    source: `@bank-account`,
    destination: escrowBalance1.data.balance_id,
    amount: 1000,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`release`, 4),
    description: `Funding escrow account`,
    currency: `USD`,
    inflight: true,
    meta_data: {
      transaction_type: `deposit`,
      customer_name: `Alice Johnson`,
      customer_id: `alice-5678`,
      transaction_date: `2024-07-05`,
      payment_verified: false,
    },
  });

  if (fundAlice.data === null || fundAlice.status !== 201) {
    throw new Error(fundAlice.message);
  }

  //release funds from alice to bob
  const releaseFunds = await Transactions.create({
    amount: 1000,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`release`, 4),
    description: `Releasing escrow funds`,
    currency: `USD`,
    source: escrowBalance1.data.balance_id, // Alice's escrow account balance_id
    destination: escrowBalance2.data.balance_id, // Bob's escrow account balance_id
    meta_data: {
      transaction_type: `release`,
      customer_name: `Alice Johnson`,
      recipient_name: `Bob Smith`,
      transaction_date: `2024-07-05`,
    },
  });

  if (releaseFunds.data === null || releaseFunds.status !== 201) {
    throw new Error(releaseFunds.message);
  }

  //refunding Alice
  const refund = await Transactions.create({
    amount: 1000,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`release`, 4),
    description: `Releasing escrow funds`,
    currency: `USD`,
    source: escrowBalance1.data.balance_id, // Alice's escrow account balance_id
    destination: `@bank-account`, // Bob's escrow account balance_id
    meta_data: {
      transaction_type: `release`,
      customer_name: `Alice Johnson`,
      recipient_name: `Bob Smith`,
      transaction_date: `2024-07-05`,
    },
  });

  if (refund.data === null || refund.status !== 201) {
    throw new Error(refund.message);
  }
}

main();
