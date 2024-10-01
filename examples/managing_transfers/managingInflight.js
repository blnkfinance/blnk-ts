const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const blnk = BlnkInit(``, {
  baseUrl: ``,
  logger: console,
});

async function CreateInflightTransaction() {
  const {Transactions} = blnk;

  const usdTransaction = await Transactions.create({
    amount: 750.0,
    precision: 100,
    reference: `ref_001adcfgf`,
    description: `Payment to ExternalProvider (Pending Verification)`,
    currency: `USD`,
    source: `bln_28edb3e5-c168-4127-a1c4-16274e7a28d3`,
    destination: `bln_ebcd230f-6265-4d4a-a4ca-45974c47f746`,
    inflight: true,
    inflight_expiry_date: `2024-02-03T12:38:19Z`,
    meta_data: {
      provider_reference: `ext-pay-123456`,
      customer_id: `1234`,
      verification_status: `PENDING`,
    },
  });

  return usdTransaction;
}

async function CommitInflightTransaction(transactionId) {
  const {Transactions} = blnk;
  const commitTransaction = await Transactions.updateStatus(transactionId, {
    status: `COMMIT`,
    meta_data: {
      verification_status: `VERIFIED`,
    },
  });
  console.log(`Commit transaction`, commitTransaction);
}

async function VoidInflightTransaction(transactionId) {
  const {Transactions} = blnk;
  const commitTransaction = await Transactions.updateStatus(transactionId, {
    status: `VOID`,
    meta_data: {
      verification_status: `VERIFIED`,
    },
  });
  console.log(`Commit transaction`, commitTransaction);
}

async function Inflights() {
  const transaction = await CreateInflightTransaction();
  if (transaction.status !== 200) {
    return; //you can handle this how you wisj
  }
  await CommitInflightTransaction(transaction.data.transaction_id);
  await VoidInflightTransaction(transaction.data.transaction_id);
}

Inflights()
  .then(() => console.log(`Done`))
  .catch(error => {
    throw new Error(error);
  });
