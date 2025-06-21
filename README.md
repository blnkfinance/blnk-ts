![Blnk logo](https://res.cloudinary.com/dmxizylxw/image/upload/v1724847576/blnk_github_logo_eyy2lf.png)

## Blnk TypeScript SDK Documentation


---

## 1. Installation

### Prerequisites
Ensure that you have the following installed on your machine:
- **Docker** and **Docker Compose** for running Blnk’s server locally.
- **Node.js** (v14 or later) and **npm** for installing the Blnk TypeScript SDK.

### Step 1: Clone the Blnk Repository

To start, clone the Blnk repository from GitHub:

```bash
git clone https://github.com/blnkfinance/blnk && cd blnk
```

### Step 2: Install Blnk TypeScript SDK

Install the Blnk TypeScript SDK in your project:

```bash
npm install @blnkfinance/blnk-typescript --save
```

### Step 3: Setting Up Configuration

In your cloned directory, create a configuration file named `blnk.json` with the following content:

```json
{
  "project_name": "Blnk",
  "data_source": {
    "dns": "postgres://postgres:password@postgres:5432/blnk?sslmode=disable"
  },
  "redis": {
    "dns": "redis:6379"
  },
  "server": {
    "domain": "blnk.io",
    "ssl": false,
    "ssl_email": "jerryenebeli@gmail.com",
    "port": "5001"
  },
  "notification": {
    "slack": {
      "webhook_url": "https://hooks.slack.com"
    }
  }
}
```

This configuration sets up connections to PostgreSQL and Redis, specifies your server details, and allows Slack notifications if needed.

---

## 2. Launching Blnk

With Docker Compose, launch the Blnk server:

```bash
docker compose up
```

Once running, your server will be accessible at [http://localhost:5001](http://localhost:5001).

---

## 3. Using the Blnk CLI

The Blnk CLI offers quick access to manage ledgers, balances, and transactions. To verify the installation and view available commands, use:

```bash
blnk --help
```

---

## 4. Creating Your First Ledger

### What is a Ledger?
In Blnk, ledgers are used to categorize balances for organized tracking. When you first install Blnk, an internal ledger called the General Ledger is created by default.

### Step-by-Step: Creating a Ledger

Using the SDK, create a ledger for user accounts:

```typescript
import { BlnkInit } from '@blnkfinance/blnk-typescript';

const blnk = await BlnkInit('<secret_key_if_set>', { baseUrl: 'http://localhost:5001' });
const { Ledgers } = blnk;

const newLedger = await Ledgers.create({
    name: "Customer Savings Account",
    meta_data: {
        project_owner: "YOUR_APP_NAME"
    }
});
console.log("Ledger Created:", newLedger);
```

This creates a new ledger for storing customer balances.

---

## 5. Creating Balances

Balances represent the store of value within a ledger, like a wallet or account. Each balance belongs to a ledger.

### Step-by-Step: Creating a Balance

To create a balance, specify the `ledger_id` and other details:

```typescript
const { LedgerBalances } = blnk;

const newBalance = await LedgerBalances.create({
    ledger_id: "ldg_073f7ffe-9dfd-42ce-aa50-d1dca1788adc",
    currency: "USD",
    meta_data: {
        first_name: "Alice",
        last_name: "Hart",
        account_number: "1234567890"
    }
});
console.log("Balance Created:", newBalance);
```

---

## 6. Recording Transactions

Transactions track financial activities within your application. Blnk ensures that each transaction is both immutable and idempotent.

### Step-by-Step: Recording a Transaction

To record a transaction, you’ll need the `source` and `destination` balance IDs:

```typescript
const { Transactions } = blnk;

const newTransaction = await Transactions.create({
    amount: 750,
    reference: "ref_001adcfgf",
    currency: "USD",
    precision: 100,
    source: "bln_28edb3e5-c168-4127-a1c4-16274e7a28d3",
    destination: "bln_ebcd230f-6265-4d4a-a4ca-45974c47f746",
    description: "Sent from app",
    meta_data: {
        sender_name: "John Doe",
        sender_account: "00000000000"
    }
});
console.log("Transaction Recorded:", newTransaction);
```

---

## 7. Bulk Transactions

The Blnk JavaScript SDK supports bulk transactions, allowing you to submit multiple transaction records in a single request for improved performance and atomic transaction processing.

### Overview

The bulk transactions API provides the following benefits:
- **Performance**: Submit multiple transactions in one API call
- **Atomicity**: Ensure all transactions succeed or fail together (when `atomic: true`)
- **Async Processing**: Process large batches asynchronously
- **Inflight Support**: Create multiple inflight transactions that can be committed or voided later

### Method Signature

```typescript
async createBulk<T extends Record<string, unknown>>(data: BulkTransactions<T>)
```

### Parameters

#### BulkTransactions Interface

```typescript
interface BulkTransactions<T extends Record<string, unknown>> {
  atomic?: boolean;        // Optional: All transactions succeed or fail together
  inflight?: boolean;      // Optional: Create transactions as inflight
  run_async?: boolean;     // Optional: Process transactions asynchronously
  transactions: CreateTransactions<T>[]; // Required: Array of transaction objects
}
```

### Usage Examples

#### Basic Bulk Transactions

```typescript
const { Transactions } = blnk;

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

const response = await Transactions.createBulk(basicBulkData);
console.log('Bulk transaction response:', response);
```

#### Atomic Bulk Transactions

```typescript
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

const atomicResponse = await Transactions.createBulk(atomicBulkData);
```

#### Async Bulk Transactions with All Options

```typescript
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

const asyncResponse = await Transactions.createBulk(asyncBulkData);
```

### Response Format

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

### Validation Rules

The bulk transactions API validates the following:

1. **Required Fields**: `transactions` array must be provided and cannot be empty
2. **Transaction Validation**: Each transaction in the array must pass standard transaction validation
3. **Unique References**: All transaction references must be unique within the bulk request
4. **Boolean Flags**: `atomic`, `inflight`, and `run_async` must be booleans if provided
5. **Standard Transaction Rules**: All existing transaction validation rules apply to each transaction

### Error Handling

```typescript
try {
  const response = await Transactions.createBulk(bulkData);
  if (response.status === 201) {
    console.log('Bulk transactions created successfully:', response.data);
  } else {
    console.error('Bulk transaction error:', response.message);
  }
} catch (error) {
  console.error('Network or system error:', error);
}
```

### Migration from Single Transactions

Converting from single transactions to bulk transactions is straightforward:

#### Before (Single Transactions)
```typescript
const tx1 = await Transactions.create(transactionData1);
const tx2 = await Transactions.create(transactionData2);
```

#### After (Bulk Transactions)
```typescript
const bulkResponse = await Transactions.createBulk({
  transactions: [transactionData1, transactionData2]
});
```

This migration provides better performance and the option for atomic processing.

---

## 8. Viewing Ledgers, Balances, and Transactions

The Blnk CLI allows you to list all ledgers, balances, and transactions quickly:

- **List Ledgers:** `blnk ledgers list`
- **List Balances:** `blnk balances list`
- **List Transactions:** `blnk transactions list`

---

## Additional Resources

For more examples and advanced use cases, please refer to the [Examples Code](https://github.com/blnkfinance/blnk-ts/tree/main/examples).

### Issue Reporting
If you encounter any issues, please [report them on GitHub](https://github.com/blnkfinance/blnk/issues).
