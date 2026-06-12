/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  SearchBalanceDocument,
  SearchIdentityDocument,
  SearchLedgerDocument,
  SearchResponse,
  SearchTransactionDocument,
} from "../../../src/types/search";

tap.test(`Issue #52 — SearchResponse per collection`, t => {
  t.test(`ledger document uses indexed fields`, tt => {
    const response: SearchResponse<SearchLedgerDocument> = {
      found: 1,
      out_of: 15,
      page: 1,
      request_params: {collection_name: `ledgers`, q: `*`},
      search_time_ms: 0,
      hits: [
        {
          document: {
            id: `general_ledger_id`,
            ledger_id: `general_ledger_id`,
            name: `General Ledger`,
            created_at: 1781226501,
          },
        },
      ],
    };

    tt.equal(typeof response.hits[0].document.created_at, `number`);
    tt.equal(response.hits[0].document.ledger_id, `general_ledger_id`);
    tt.end();
  });

  t.test(`balance document uses string minor-unit fields`, tt => {
    const response: SearchResponse<SearchBalanceDocument> = {
      found: 1,
      out_of: 45,
      page: 1,
      request_params: {collection_name: `balances`, q: `*`},
      search_time_ms: 1,
      hits: [
        {
          document: {
            id: `bln_15168eb4-bdb1-4e46-9331-f58a6a16b254`,
            balance_id: `bln_15168eb4-bdb1-4e46-9331-f58a6a16b254`,
            balance: `0`,
            credit_balance: `0`,
            debit_balance: `0`,
            currency: `USD`,
            ledger_id: `ldg_0921bd99-ff7c-4a06-b6d7-319f0bb12f87`,
            created_at: 1781222909,
            track_fund_lineage: true,
          },
        },
      ],
    };

    tt.equal(typeof response.hits[0].document.balance, `string`);
    tt.equal(response.hits[0].document.balance_id.startsWith(`bln_`), true);
    tt.end();
  });

  t.test(`transaction document includes status and precise_amount`, tt => {
    const response: SearchResponse<SearchTransactionDocument> = {
      found: 1,
      out_of: 11,
      page: 1,
      request_params: {collection_name: `transactions`, q: `*`},
      search_time_ms: 2,
      hits: [
        {
          document: {
            id: `txn_8bb67c99-70b1-46c2-aa49-1ea3fc2f2233`,
            transaction_id: `txn_8bb67c99-70b1-46c2-aa49-1ea3fc2f2233`,
            amount: 250000,
            precise_amount: `250000`,
            status: `APPLIED`,
            created_at: 1781028226,
          },
        },
      ],
    };

    tt.equal(response.hits[0].document.status, `APPLIED`);
    tt.equal(typeof response.hits[0].document.created_at, `number`);
    tt.end();
  });

  t.test(`identity document includes indexed fields`, tt => {
    const response: SearchResponse<SearchIdentityDocument> = {
      found: 1,
      out_of: 13,
      page: 1,
      request_params: {collection_name: `identities`, q: `*`},
      search_time_ms: 5,
      hits: [
        {
          document: {
            id: `idt_fbf6a26c-82c6-46fb-9237-8fbba55a23c0`,
            identity_id: `idt_fbf6a26c-82c6-46fb-9237-8fbba55a23c0`,
            identity_type: `organization`,
            created_at: 1781225782,
          },
        },
      ],
    };

    tt.equal(response.hits[0].document.identity_id.startsWith(`idt_`), true);
    tt.end();
  });

  t.end();
});
