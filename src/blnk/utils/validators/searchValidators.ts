import {
  FilterCondition,
  FilterLogicalOperator,
  FilterOperator,
  FilterParams,
  FilterSortOrder,
  SearchCollection,
  SearchParams,
  StartReindexRequest,
} from "../../../types/search";

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

const FILTER_OPERATORS: FilterOperator[] = [
  `eq`,
  `ne`,
  `gt`,
  `gte`,
  `lt`,
  `lte`,
  `in`,
  `between`,
  `like`,
  `ilike`,
  `isnull`,
  `isnotnull`,
];

const VALUELESS_OPERATORS: FilterOperator[] = [`isnull`, `isnotnull`];
const VALUES_ARRAY_OPERATORS: FilterOperator[] = [`in`, `between`];

const MAX_FILTER_LIMIT = 100;

function isFilterLogicalOperator(
  value: string,
): value is FilterLogicalOperator {
  return value === `and` || value === `or`;
}

function isFilterSortOrder(value: string): value is FilterSortOrder {
  return value === `asc` || value === `desc`;
}

function validateFilterCondition(
  filter: FilterCondition,
  index: number,
): string | null {
  if (!filter || typeof filter !== `object`) {
    return `filters[${index}] must be a valid object`;
  }

  if (typeof filter.field !== `string` || filter.field.trim() === ``) {
    return `filters[${index}].field must be a non-empty string`;
  }

  if (
    typeof filter.operator !== `string` ||
    !FILTER_OPERATORS.includes(filter.operator as FilterOperator)
  ) {
    return `filters[${index}].operator must be a supported filter operator`;
  }

  if (VALUES_ARRAY_OPERATORS.includes(filter.operator)) {
    if (!Array.isArray(filter.values) || filter.values.length === 0) {
      return `filters[${index}].values must be a non-empty array for operator "${filter.operator}"`;
    }
    return null;
  }

  if (VALUELESS_OPERATORS.includes(filter.operator)) {
    return null;
  }

  if (filter.value === undefined || filter.value === null) {
    return `filters[${index}].value is required for operator "${filter.operator}"`;
  }

  return null;
}

export function ValidateFilterParams(data: FilterParams): string | null {
  if (!data || typeof data !== `object`) {
    return `Filter params must be a valid object`;
  }

  if (!Array.isArray(data.filters)) {
    return `filters must be an array`;
  }

  for (let index = 0; index < data.filters.length; index++) {
    const filterError = validateFilterCondition(data.filters[index], index);
    if (filterError) {
      return filterError;
    }
  }

  if (
    data.logical_operator !== undefined &&
    (typeof data.logical_operator !== `string` ||
      !isFilterLogicalOperator(data.logical_operator))
  ) {
    return `logical_operator must be "and" or "or" if provided`;
  }

  if (data.sort_by !== undefined && typeof data.sort_by !== `string`) {
    return `sort_by must be a string if provided`;
  }

  if (
    data.sort_order !== undefined &&
    (typeof data.sort_order !== `string` || !isFilterSortOrder(data.sort_order))
  ) {
    return `sort_order must be "asc" or "desc" if provided`;
  }

  if (
    data.include_count !== undefined &&
    typeof data.include_count !== `boolean`
  ) {
    return `include_count must be a boolean if provided`;
  }

  if (
    data.limit !== undefined &&
    (!Number.isInteger(data.limit) ||
      data.limit < 1 ||
      data.limit > MAX_FILTER_LIMIT)
  ) {
    return `limit must be an integer between 1 and 100 if provided`;
  }

  if (
    data.offset !== undefined &&
    (!Number.isInteger(data.offset) || data.offset < 0)
  ) {
    return `offset must be a non-negative integer if provided`;
  }

  return null;
}

export function ValidateStartReindexRequest(
  data: StartReindexRequest,
): string | null {
  if (!data || typeof data !== `object`) {
    return `Reindex options must be a valid object`;
  }

  if (
    data.batch_size !== undefined &&
    (!Number.isInteger(data.batch_size) || data.batch_size < 1)
  ) {
    return `batch_size must be a positive integer if provided`;
  }

  return null;
}
