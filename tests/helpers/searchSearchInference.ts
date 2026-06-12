import {Search} from "../../src/blnk/endpoints/search";
import {SearchCollection, SearchParams} from "../../src/types/search";

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
