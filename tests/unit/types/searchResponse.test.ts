/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {Search} from "../../../src/blnk/endpoints/search";
import {FormatResponse} from "../../../src/blnk/utils/httpClient";
import {BlnkRequest} from "../../../src/types/general";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../mocks/blnkClientMocks";
import {
  SearchBalanceDocument,
  SearchCollection,
  SearchIdentityDocument,
  SearchLedgerDocument,
  SearchResponse,
  SearchTransactionDocument,
} from "../../../src/types/search";
import {
  assertLegacySearchResponseUsage,
  assertSearchSearchTypes,
} from "../../helpers/searchSearchInference";

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

  t.test(`Search.search infers transaction document fields`, async tt => {
    const transactionSearchResponse: SearchResponse<SearchTransactionDocument> =
      {
        found: 1,
        out_of: 11,
        page: 1,
        request_params: {collection_name: `transactions`, q: `payment`},
        search_time_ms: 2,
        hits: [
          {
            document: {
              id: `txn_8bb67c99-70b1-46c2-aa49-1ea3fc2f2233`,
              transaction_id: `txn_8bb67c99-70b1-46c2-aa49-1ea3fc2f2233`,
              status: `APPLIED`,
              precise_amount: `250000`,
              created_at: 1781028226,
            },
          },
        ],
      };

    const mockRequest: BlnkRequest = async <T, R>(
      _endpoint: string,
      _data: T,
      _method: `POST` | `GET` | `PUT` | `DELETE`,
    ) => ({
      status: 201,
      message: `Success`,
      data: transactionSearchResponse as unknown as R,
    });

    const search = new Search(mockRequest, createMockLogger(), FormatResponse);
    const response = await search.search({q: `payment`}, `transactions`);

    tt.equal(response.status, 201);
    tt.equal(response.data?.hits[0]?.document.status, `APPLIED`);
    tt.equal(
      response.data?.hits[0]?.document.transaction_id,
      `txn_8bb67c99-70b1-46c2-aa49-1ea3fc2f2233`,
    );
    tt.end();
  });

  t.test(
    `Search.search accepts dynamic SearchCollection variable`,
    async tt => {
      const mockLogger = createMockLogger();
      const thirdPartyRequest = createMockBlnkRequest(true, undefined, 201);
      const search = new Search(thirdPartyRequest, mockLogger, FormatResponse);
      const service: SearchCollection = `ledgers`;

      const response = await search.search({q: `General`}, service);

      tt.equal(response.status, 201);
      tt.end();
    },
  );

  t.test(`unparameterized SearchResponse remains valid`, tt => {
    const response: SearchResponse = {
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
            created_at: 1781222909,
          },
        },
      ],
    };

    tt.equal(typeof response.hits[0].document.balance, `string`);
    tt.equal(response.hits[0].document.balance_id.startsWith(`bln_`), true);
    tt.end();
  });

  t.test(`compile-time Search.search inference checks`, tt => {
    void assertSearchSearchTypes;
    void assertLegacySearchResponseUsage;
    tt.pass(`searchSearchInference.ts type checks compile`);
    tt.end();
  });

  t.end();
});
