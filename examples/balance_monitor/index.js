const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const {BASE_URL, GenerateRandomNumbersWithPrefix} = require(`../util`);

async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: BASE_URL,
  });

  const {BalanceMonitor, Ledgers, LedgerBalances, Transactions} = blnk;
  const usdLedger = await Ledgers.create({
    name: `Customer USD Ledger`,
    meta_data: {
      project_name: `SendWorld App`,
    },
  });

  if (usdLedger.status !== 201) {
    throw new Error(usdLedger.message);
  }

  const usdBalance = await LedgerBalances.create({
    ledger_id: usdLedger.data.ledger_id,
    currency: `USD`,
    meta_data: {
      customer_name: `Jerry`,
      customer_internal_id: `1234`,
    },
  });

  console.log(usdBalance);
  if (usdBalance.status !== 201) {
    throw new Error(usdBalance.message);
  }

  const balanceMonitor = await BalanceMonitor.create({
    balance_id: usdBalance.data.balance_id,
    condition: {
      field: `credit_balance`,
      operator: `>=`,
      precision: 100,
      value: 1000,
    },
    description: `Tier 1 account`,
  });

  if (balanceMonitor.status !== 201) {
    throw new Error(balanceMonitor.message);
  }
  //view the balance monitor
  const balanceMonitorSingle = await BalanceMonitor.get(
    balanceMonitor.data.monitor_id
  );
  console.log(`ssosososo`, balanceMonitorSingle);

  if (balanceMonitorSingle.status !== 200) {
    throw new Error(balanceMonitorSingle.message);
  }

  const balanceMonitorList = await BalanceMonitor.list();
  if (balanceMonitorList.status !== 200) {
    throw new Error(balanceMonitorList.message);
  }

  const usdTransaction = await Transactions.create({
    amount: 2000,
    precision: 100,
    reference: GenerateRandomNumbersWithPrefix(`ref`, 4),
    description: `payment for service rendered`,
    currency: `USD`,
    source: `@Marketing`,
    destination: usdBalance.data.balance_id,
    allow_overdraft: true,
    meta_data: {
      sender_name: `Future Design LLC`,
      sender_internal_id: `123333`,
    },
  });

  if (usdTransaction.status !== 201) {
    throw new Error(usdTransaction.message);
  }
}

main();
