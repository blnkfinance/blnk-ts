import {Search} from "../../src/blnk/endpoints/search";
import {
  SearchCollection,
  SearchParams,
  SearchResponse,
} from "../../src/types/search";

/** Compile-time checks for `Search.search` overload inference (issue #52). */
export async function assertSearchSearchTypes(search: Search): Promise<void> {
  const params: SearchParams = {q: `*`};

  const transactionsResponse = await search.search(params, `transactions`);
  const transactionHit = transactionsResponse.data?.hits[0];
  if (transactionHit) {
    const status: string | undefined = transactionHit.document.status;
    const transactionId: string = transactionHit.document.transaction_id;
    void status;
    void transactionId;
    // @ts-expect-error balance is indexed on balance documents only
    const _balance: string = transactionHit.document.balance;
    void _balance;
  }

  const dynamicSearch = async (service: SearchCollection) => {
    const response = await search.search(params, service);
    const hit = response.data?.hits[0];
    if (hit) {
      const id: string = hit.document.id;
      void id;
    }
  };
  void dynamicSearch;
}

/** Ensures unparameterized `SearchResponse` imports still compile (SDK compat). */
export function assertLegacySearchResponseUsage(): void {
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
          credit_balance: `0`,
          debit_balance: `0`,
          currency: `USD`,
          ledger_id: `ldg_0921bd99-ff7c-4a06-b6d7-319f0bb12f87`,
          created_at: 1781222909,
        },
      },
    ],
  };

  const balanceId: string = response.hits[0].document.balance_id;
  void balanceId;
}
