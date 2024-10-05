const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);

async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: process.env.BASE_URL,
    logger: console,
  });
  const {Ledgers, LedgerBalances, Transactions} = blnk;

  const customerLedger = await Ledgers.create({
    name: `Customer Loyalty Points Ledger`,
    meta_data: {
      project_name: `RetailStore App`,
    },
  });

  console.log(`customer ledger`, customerLedger);
  if (customerLedger.data === null) {
    throw new Error(customerLedger.message);
  }

  //create a balance for the points
  const pointBalance = await LedgerBalances.create({
    ledger_id: customerLedger.data.ledger_id,
    currency: `POINTS`,
    meta_data: {
      customer_name: `Alice`,
      customer_internal_id: `5678`,
    },
  });

  if (pointBalance.data === null) {
    throw new Error(pointBalance.message);
  }
  console.log(`Point Balance`, pointBalance);

  const awardPoints = await Transactions.create({
    amount: 100, // Representing 100 points
    precision: 1,
    reference: `purchase-001`,
    description: `Points for purchase`,
    currency: `POINTS`,
    source: `@Store`,
    destination: pointBalance.data.balance_id, // Alice's loyalty point balance_id
    inflight: true,
    meta_data: {
      customer_name: `Alice`,
      purchase_id: `purchase-001`,
    },
  });

  if (awardPoints.data === null) {
    throw new Error(awardPoints.message);
  }
  console.log(`Points awarded`, awardPoints);

  const redeemPoints = await Transactions.create({
    amount: 50, // Representing 50 points
    precision: 1,
    reference: `redemption-001`,
    description: `Points redemption`,
    currency: `POINTS`,
    source: pointBalance.data.balance_id,
    destination: `@Store`, // Alice's loyalty point balance_id
    inflight: true,
    meta_data: {
      customer_name: `Alice`,
      purchase_id: `purchase-001`,
    },
  });

  if (redeemPoints.data === null) {
    throw new Error(redeemPoints.message);
  }
}

main();
