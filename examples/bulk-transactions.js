const { BlnkInit } = require('../src/index');

// Initialize the Blnk client
const blnk = BlnkInit('your-api-key', {
  baseUrl: 'http://YOUR_BLNK_INSTANCE_URL',
  logger: console,
});

async function bulkTransactionsExample() {
  try {
    // Example 1: Basic bulk transactions
    console.log('Creating basic bulk transactions...');
    const basicBulkData = {
      transactions: [
        {
          amount: 1000,
          precision: 100,
          reference: 'bulk_txn_001',
          description: 'Bulk payment 1',
          currency: 'USD',
          source: '@source_account_1',
          destination: '@destination_account_1',
          allow_overdraft: false,
        },
        {
          amount: 2000,
          precision: 100,
          reference: 'bulk_txn_002',
          description: 'Bulk payment 2',
          currency: 'USD',
          source: '@source_account_2',
          destination: '@destination_account_2',
          allow_overdraft: false,
        },
      ],
    };

    const basicResponse = await blnk.Transactions.createBulk(basicBulkData);
    console.log('Basic bulk response:', JSON.stringify(basicResponse, null, 2));

    // Example 2: Atomic bulk transactions (all succeed or all fail)
    console.log('\nCreating atomic bulk transactions...');
    const atomicBulkData = {
      atomic: true,
      transactions: [
        {
          amount: 5000,
          precision: 100,
          reference: 'atomic_txn_001',
          description: 'Atomic payment 1',
          currency: 'USD',
          source: '@source_account_1',
          destination: '@destination_account_1',
          allow_overdraft: false,
        },
        {
          amount: 3000,
          precision: 100,
          reference: 'atomic_txn_002',
          description: 'Atomic payment 2',
          currency: 'USD',
          source: '@source_account_2',
          destination: '@destination_account_2',
          allow_overdraft: false,
        },
      ],
    };

    const atomicResponse = await blnk.Transactions.createBulk(atomicBulkData);
    console.log('Atomic bulk response:', JSON.stringify(atomicResponse, null, 2));

    // Example 3: Inflight bulk transactions
    console.log('\nCreating inflight bulk transactions...');
    const inflightBulkData = {
      inflight: true,
      transactions: [
        {
          amount: 7500,
          precision: 100,
          reference: 'inflight_txn_001',
          description: 'Inflight payment 1',
          currency: 'USD',
          source: '@source_account_1',
          destination: '@destination_account_1',
          allow_overdraft: false,
          inflight_expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
        {
          amount: 4500,
          precision: 100,
          reference: 'inflight_txn_002',
          description: 'Inflight payment 2',
          currency: 'USD',
          source: '@source_account_2',
          destination: '@destination_account_2',
          allow_overdraft: false,
          inflight_expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
      ],
    };

    const inflightResponse = await blnk.Transactions.createBulk(inflightBulkData);
    console.log('Inflight bulk response:', JSON.stringify(inflightResponse, null, 2));

    // Example 4: Async bulk transactions with all options
    console.log('\nCreating async bulk transactions with all options...');
    const asyncBulkData = {
      atomic: true,
      inflight: true,
      run_async: true,
      transactions: [
        {
          amount: 12000,
          precision: 100,
          reference: 'async_txn_001',
          description: 'Async atomic inflight payment 1',
          currency: 'USD',
          source: '@source_account_1',
          destination: '@destination_account_1',
          allow_overdraft: true,
          inflight_expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
          meta_data: {
            department: 'sales',
            project: 'Q4_campaign',
          },
        },
        {
          amount: 8500,
          precision: 100,
          reference: 'async_txn_002',
          description: 'Async atomic inflight payment 2',
          currency: 'USD',
          source: '@source_account_2',
          destination: '@destination_account_2',
          allow_overdraft: true,
          inflight_expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
          meta_data: {
            department: 'marketing',
            project: 'Q4_campaign',
          },
        },
        {
          amount: 15000,
          precision: 100,
          reference: 'async_txn_003',
          description: 'Async atomic inflight payment 3',
          currency: 'USD',
          source: '@source_account_3',
          destination: '@destination_account_3',
          allow_overdraft: false,
          inflight_expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
          meta_data: {
            department: 'operations',
            project: 'Q4_campaign',
          },
        },
      ],
    };

    const asyncResponse = await blnk.Transactions.createBulk(asyncBulkData);
    console.log('Async bulk response:', JSON.stringify(asyncResponse, null, 2));

    // Example 5: Bulk transactions with multiple sources/destinations
    console.log('\nCreating bulk transactions with multiple sources...');
    const multiSourceBulkData = {
      transactions: [
        {
          amount: 10000,
          precision: 100,
          reference: 'multi_source_txn_001',
          description: 'Multi-source payment',
          currency: 'USD',
          sources: [
            {
              identifier: '@source_account_1',
              distribution: '60%',
              narration: 'Primary source contribution',
            },
            {
              identifier: '@source_account_2',
              distribution: '40%',
              narration: 'Secondary source contribution',
            },
          ],
          destination: '@destination_account_1',
          allow_overdraft: false,
        },
      ],
    };

    const multiSourceResponse = await blnk.Transactions.createBulk(multiSourceBulkData);
    console.log('Multi-source bulk response:', JSON.stringify(multiSourceResponse, null, 2));

  } catch (error) {
    console.error('Error creating bulk transactions:', error);
  }
}

// Run the examples
bulkTransactionsExample();