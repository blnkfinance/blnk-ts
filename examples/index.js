const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);

const ledgers = BlnkInit(`apo`, {
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
