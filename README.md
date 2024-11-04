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

## 7. Viewing Ledgers, Balances, and Transactions

The Blnk CLI allows you to list all ledgers, balances, and transactions quickly:

- **List Ledgers:** `blnk ledgers list`
- **List Balances:** `blnk balances list`
- **List Transactions:** `blnk transactions list`

---

## Additional Information

### Immutability and Idempotency
All transactions in Blnk are immutable, meaning they cannot be altered once recorded. This ensures data integrity and accuracy. The use of a unique reference for each transaction enforces idempotency.

### Issue Reporting
If you encounter any issues, please [report them on GitHub](https://github.com/blnkfinance/blnk/issues).
