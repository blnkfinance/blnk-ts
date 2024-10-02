const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);

async function main() {
  const blnk = await BlnkInit(``, {
    baseUrl: process.env.BASE_URL,
  });
  const {Ledgers, Search, LedgerBalances, Transactions} = blnk;

  const marketLedger = await Ledgers.create({
    name: `Marketing Department Ledger`,
    meta_data: {
      department: `Marketing`,
    },
  });

  if (marketLedger.data === null) {
    throw new Error(marketLedger.message);
  }

  const hrLedger = await Ledgers.create({
    name: `Human Resources Department Ledger`,
    meta_data: {
      department: `Human Resources`,
    },
  });

  if (hrLedger.data === null) {
    throw new Error(hrLedger.message);
  }

  //check if there's a ledgers list endpoint in BLNK
  //implement search class instead
  const ledgers = await Search.search(
    {
      q: `*`,
      sort_by: `created_at:desc`,
    },
    `ledgers`
  );

  console.log(ledgers);

  //   const marketLedgers = await Search.search(
  //     {
  //       q: `Marketing`,
  //       query_by: `meta_data.department`,
  //     },
  //     `ledgers`
  //   );

  //create a balance for marketing account
  const marketingBalance = await LedgerBalances.create({
    ledger_id: marketLedger.data.ledger_id,
    currency: `USD`,
    meta_data: {
      department: `Marketing`,
      expense_type: `Advertising`,
    },
  });

  if (marketingBalance.data === null) {
    throw new Error(marketingBalance.message);
  }
  //create a balance for HR recruitment
  const hrBalance = await LedgerBalances.create({
    ledger_id: hrLedger.data.ledger_id,
    currency: `USD`,
    meta_data: {
      department: `Human Resources`,
      expense_type: `Recruitment`,
    },
  });

  if (hrBalance.data === null) {
    throw new Error(hrBalance.message);
  }
  //credit a transaction on marketing account
  const marketingTransaction = await Transactions.create({
    destination: marketingBalance.data.balance_id,
    source: `@CompanyFunds`,
    amount: 500,
    currency: `USD`,
    precision: 100,
    reference: `ad-expense-001`,
    description: `Payment for social media ads`,
    inflight: true,
    meta_data: {
      department: `Marketing`,
      expense_type: `Advertising`,
      vendor: `SocialMediaCo`,
    },
  });
  if (marketingTransaction.data === null) {
    throw new Error(marketingTransaction.message);
  }

  //credit a transaction on the hr account
  const hrTransaction = await Transactions.create({
    destination: `@CompanyFunds`,
    source: hrBalance.data.balance_id,
    amount: 1000,
    currency: `USD`,
    precision: 100,
    reference: `recruitment-expense-001`,
    description: `Payment for recruitment agency`,
    inflight: true,
    meta_data: {
      department: `Human Resources`,
      expense_type: `Recruitment`,
      vendor: `JobBoardCo`,
    },
  });

  if (hrTransaction.data === null) {
    throw new Error(hrTransaction.message);
  }

  //approving an advertising expense for marketing
  const commitMarketingTransaction = await Transactions.updateStatus(
    marketingTransaction.data.transaction_id,
    {
      status: `COMMIT`,
    }
  );

  if (commitMarketingTransaction.data === null) {
    throw new Error(commitMarketingTransaction.message);
  }

  //approving a recruitment expense for HR
  const recruitmentExpenseCommit = await Transactions.updateStatus(
    hrTransaction.data.transaction_id,
    {
      status: `COMMIT`,
    }
  );

  if (recruitmentExpenseCommit.data === null) {
    throw new Error(recruitmentExpenseCommit.message);
  }
}

main();
