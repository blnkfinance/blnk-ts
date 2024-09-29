const Blnk = require(`@blnkfinance/blnk-typescript`);

const ledgers = Blnk.default(`apo`, {
  baseUrl: `http://localhost:5001/`,
  logger: console,
}).Ledgers;

ledgers
  .create({
    name: `Test`,
    meta_data: {
      project_owner: `Test SDK`,
    },
  })
  .then(response => {
    console.log(`response`, response);
  });
