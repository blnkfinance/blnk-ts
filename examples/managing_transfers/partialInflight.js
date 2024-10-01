const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const blnk = BlnkInit(``, {
  baseUrl: ``,
  logger: console,
});

async function partialCommitInflightTransaction(transactionId, amountToCommit) {
  try {
    const {Transactions} = blnk;
    const response = Transactions.updateStatus(transactionId, {
      status: `COMMIT`,
      amount: amountToCommit,
    });

    console.log(`Partial commit successful:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error in partial commit:`, error.response.data);
    throw error;
  }
}

// Usage example
async function HandlePartialPaymentVerification(transactionId, verifiedAmount) {
  try {
    await partialCommitInflightTransaction(transactionId, verifiedAmount);
    console.log(
      `Partially committed ${verifiedAmount} for transaction ${transactionId}`
    );

    // You might want to update your internal records here
    await updateInternalRecords(transactionId, verifiedAmount);

    // Check if there's any remaining amount to be verified
    const remainingAmount = await checkRemainingInflightAmount(transactionId);
    if (remainingAmount > 0) {
      console.log(
        `Remaining inflight amount for ${transactionId}: ${remainingAmount}`
      );
    } else {
      console.log(`Transaction ${transactionId} fully committed`);
    }
  } catch (error) {
    console.error(`Error handling partial payment verification:`, error);
  }
}

async function updateInternalRecords(transactionId, committedAmount) {
  // Implement your logic to update internal records
  console.log(
    `Updating internal records for ${transactionId} with committed amount ${committedAmount}`
  );
}

async function checkRemainingInflightAmount() {
  // This would typically involve querying Blnk's API or your database
  // For demonstration, we'll return a mock value
  return 250.0; // Assuming 500 out of 750 was committed
}

// Example usage
HandlePartialPaymentVerification(
  `txn_6164573b-6cc8-45a4-ad2e-7b4ba6a60f7d`,
  500.0
)
  .then(() => console.log(`Done`))
  .catch(error => {
    throw new Error(error);
  });
