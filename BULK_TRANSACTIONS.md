# Bulk Transactions API

The Blnk JavaScript SDK now supports bulk transactions, allowing you to submit multiple transaction records in a single request for improved performance and atomic transaction processing.

## Overview

The bulk transactions API provides the following benefits:
- **Performance**: Submit multiple transactions in one API call
- **Atomicity**: Ensure all transactions succeed or fail together (when `atomic: true`)
- **Async Processing**: Process large batches asynchronously
- **Inflight Support**: Create multiple inflight transactions that can be committed or voided later

## Method Signature

```typescript
async createBulk<T extends Record<string, unknown>>(data: BulkTransactions<T>)
```

## Parameters

### BulkTransactions Interface

```typescript
interface BulkTransactions<T extends Record<string, unknown>> {
  atomic?: boolean;        // Optional: All transactions succeed or fail together
  inflight?: boolean;      // Optional: Create transactions as inflight
  run_async?: boolean;     // Optional: Process transactions asynchronously
  transactions: CreateTransactions<T>[]; // Required: Array of transaction objects
}
```

### Transaction Object Parameters

Each transaction in the `transactions` array follows the same structure as single transactions:

```typescript
interface CreateTransactions<T extends Record<string, unknown>> {
  amount: number;
  precision: number;
  reference: string;        // Must be unique within the bulk request
  description: string;
  currency: string;
  rate?: number;
  source?: string;
  sources?: MultipleSourcesT[];
  destinations?: MultipleSourcesT[];
  destination?: string;
  inflight?: boolean;
  inflight_expiry_date?: Date;
  scheduled_for?: Date;
  allow_overdraft?: boolean;
  meta_data?: T;
}
```

## Usage Examples

### Basic Bulk Transactions

```javascript
const { BlnkInit } = require('@blnkfinance/blnk-typescript');

const blnk = BlnkInit('your-api-key', {
  baseUrl: 'http://YOUR_BLNK_INSTANCE_URL',
});

// Basic bulk transactions without additional options
const basicBulkData = {
  transactions: [
    {
      amount: 1000,
      precision: 100,
      reference: 'bulk_txn_001',
      description: 'Payment 1',
      currency: 'USD',
      source: '@source_account_1',
      destination: '@destination_account_1',
    },
    {
      amount: 2000,
      precision: 100,
      reference: 'bulk_txn_002',
      description: 'Payment 2',
      currency: 'USD',
      source: '@source_account_2',
      destination: '@destination_account_2',
    },
  ],
};

const response = await blnk.Transactions.createBulk(basicBulkData);
console.log('Bulk transaction response:', response);
```

### Atomic Bulk Transactions

```javascript
// Atomic transactions - all succeed or all fail
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
    },
    {
      amount: 3000,
      precision: 100,
      reference: 'atomic_txn_002',
      description: 'Atomic payment 2',
      currency: 'USD',
      source: '@source_account_2',
      destination: '@destination_account_2',
    },
  ],
};

const atomicResponse = await blnk.Transactions.createBulk(atomicBulkData);
```

### Inflight Bulk Transactions

```javascript
// Create multiple inflight transactions
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
      inflight_expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    {
      amount: 4500,
      precision: 100,
      reference: 'inflight_txn_002',
      description: 'Inflight payment 2',
      currency: 'USD',
      source: '@source_account_2',
      destination: '@destination_account_2',
      inflight_expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  ],
};

const inflightResponse = await blnk.Transactions.createBulk(inflightBulkData);
```

### Async Bulk Transactions with All Options

```javascript
// Process transactions asynchronously with atomic and inflight options
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
      inflight_expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
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
      inflight_expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      meta_data: {
        department: 'marketing',
        project: 'Q4_campaign',
      },
    },
  ],
};

const asyncResponse = await blnk.Transactions.createBulk(asyncBulkData);
```

### Bulk Transactions with Multiple Sources

```javascript
// Bulk transaction with multiple sources for distribution
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
    },
  ],
};

const multiSourceResponse = await blnk.Transactions.createBulk(multiSourceBulkData);
```

## Response Format

```typescript
interface BulkTransactionResponse<T extends Record<string, unknown>> {
  id: string;                                    // Bulk transaction ID
  atomic: boolean;                               // Whether transactions were atomic
  inflight: boolean;                             // Whether transactions were created as inflight
  run_async: boolean;                            // Whether processing was asynchronous
  transactions: CreateTransactionResponse<T>[];  // Array of individual transaction responses
  created_at: Date;                              // Creation timestamp
}
```

## Validation Rules

The bulk transactions API validates the following:

1. **Required Fields**: `transactions` array must be provided and cannot be empty
2. **Transaction Validation**: Each transaction in the array must pass standard transaction validation
3. **Unique References**: All transaction references must be unique within the bulk request
4. **Boolean Flags**: `atomic`, `inflight`, and `run_async` must be booleans if provided
5. **Standard Transaction Rules**: All existing transaction validation rules apply to each transaction

## Error Handling

```javascript
try {
  const response = await blnk.Transactions.createBulk(bulkData);
  if (response.status === 201) {
    console.log('Bulk transactions created successfully:', response.data);
  } else {
    console.error('Bulk transaction error:', response.message);
  }
} catch (error) {
  console.error('Network or system error:', error);
}
```

## Common Error Messages

- `"Transactions array cannot be empty"` - The transactions array is empty
- `"Transaction at index X: [validation error]"` - Specific transaction validation failed
- `"All transactions must have unique references within the bulk request"` - Duplicate references found
- `"Atomic must be a boolean if provided"` - Invalid type for atomic flag
- `"Inflight must be a boolean if provided"` - Invalid type for inflight flag
- `"Run_async must be a boolean if provided"` - Invalid type for run_async flag

## Best Practices

1. **Reference Uniqueness**: Ensure all transaction references are unique within each bulk request
2. **Batch Size**: Consider breaking very large batches into smaller chunks for better performance
3. **Error Handling**: Always check the response status and handle validation errors appropriately
4. **Atomic Transactions**: Use `atomic: true` when all transactions must succeed together
5. **Async Processing**: Use `run_async: true` for large batches to avoid request timeouts
6. **Inflight Management**: Set appropriate expiry dates for inflight transactions

## Migration from Single Transactions

Converting from single transactions to bulk transactions is straightforward:

### Before (Single Transactions)
```javascript
const tx1 = await blnk.Transactions.create(transactionData1);
const tx2 = await blnk.Transactions.create(transactionData2);
```

### After (Bulk Transactions)
```javascript
const bulkResponse = await blnk.Transactions.createBulk({
  transactions: [transactionData1, transactionData2]
});
```

This migration provides better performance and the option for atomic processing.