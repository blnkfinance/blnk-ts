const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);

async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: process.env.BASE_URL,
    logger: console,
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
  if (usdBalance.data === null || usdBalance.status !== 200) {
    throw new Error(usdBalance.message);
  }

  //authorizing transactions
  //record an inflight transaction
  const inflightTransaction = await Transactions.create({
    amount: 100,
    precision: 100,
    reference: `trx-001`,
    description: `Authorization for purchase`,
    currency: `USD`,
    source: usdBalance.data.balance_id, // Jerry's virtual card balance_id
    destination: `@Merchant`,
    inflight: true,
    meta_data: {
      merchant_name: `Store ABC`,
      customer_name: `Jerry`,
    },
  });

  //after the transaction has been verified you can update it here
  await Transactions.updateStatus(inflightTransaction.data.transaction_id, {
    status: `COMMIT`,
  });

  //if the transaction failed or was cancelled on your users end, void it
  await Transactions.updateStatus(inflightTransaction.data.transaction_id, {
    status: `VOID`,
  });
}

main();
