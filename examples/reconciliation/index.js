const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const {BASE_URL} = require(`../util`);
const path = require(`path`);

async function main() {
  const blnk = BlnkInit(``, {
    baseUrl: BASE_URL,
  });
  const {Reconciliation} = blnk;
  const filePath = path.join(__dirname, `..`, `..`, `file.csv`);
  const reconciliation = await Reconciliation.upload(filePath, `Stripe`);
  console.log(reconciliation);
}

main();
