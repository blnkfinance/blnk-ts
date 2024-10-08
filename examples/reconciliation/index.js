const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const {BASE_URL} = require(`../util`);
const path = require(`path`);

async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: BASE_URL,
  });
  const {Reconciliation} = blnk;
  const filePath = path.join(__dirname, `..`, `..`, `file.csv`);
  const reconciliationUpload = await Reconciliation.upload(filePath, `Stripe`);

  if (reconciliationUpload.status !== 200) {
    throw new Error(reconciliationUpload.message);
  }
  //you can save the reconciliation id in your db to use later
  const matchingRule = await Reconciliation.createMatchingRule({
    criteria: [
      {
        field: `amount`,
        operator: `equals`,
        allowable_drift: 0.01,
      },
    ],
    name: `Test Matching Rule`,
    description: `Test Matching Rule Description`,
  });

  if (matchingRule.status !== 201) {
    throw new Error(matchingRule.message);
  }

  //start the reconciliation
  const startReconciliation = await Reconciliation.run({
    dry_run: true,
    grouping_criteria: `amount`,
    matching_rule_ids: [matchingRule.data.rule_id],
    strategy: `many_to_one`,
    upload_id: reconciliationUpload.data.upload_id,
  });

  if (startReconciliation.status !== 200) {
    throw new Error(startReconciliation.message);
  }
}

main();
