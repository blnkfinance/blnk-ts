import {SearchCollection, SearchParams} from "../../../types/search";

const SEARCH_COLLECTIONS: SearchCollection[] = [
  `ledgers`,
  `transactions`,
  `balances`,
  `identities`,
];

const MAX_PER_PAGE = 250;

export function ValidateSearchCollection(service: string): string | null {
  if (!SEARCH_COLLECTIONS.includes(service as SearchCollection)) {
    return `collection must be ledgers, transactions, balances, or identities`;
  }
  return null;
}

export function ValidateSearchParams(data: SearchParams): string | null {
  if (!data || typeof data !== `object`) {
    return `Search params must be a valid object`;
  }

  if (typeof data.q !== `string` || data.q.trim() === ``) {
    return `Field "q" must be filled`;
  }

  if (
    data.page !== undefined &&
    (!Number.isInteger(data.page) || data.page < 1)
  ) {
    return `page must be a positive integer if provided`;
  }

  if (
    data.per_page !== undefined &&
    (!Number.isInteger(data.per_page) ||
      data.per_page < 1 ||
      data.per_page > MAX_PER_PAGE)
  ) {
    return `per_page must be an integer between 1 and 250 if provided`;
  }

  if (data.query_by !== undefined && typeof data.query_by !== `string`) {
    return `query_by must be a string if provided`;
  }

  if (data.filter_by !== undefined && typeof data.filter_by !== `string`) {
    return `filter_by must be a string if provided`;
  }

  if (data.sort_by !== undefined && typeof data.sort_by !== `string`) {
    return `sort_by must be a string if provided`;
  }

  return null;
}
