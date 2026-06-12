import {
  AllocationStrategy,
  CreateBalanceSnapshotRequest,
  CreateLedgerBalance,
  GetBalanceAtRequest,
  UpdateBalanceIdentity,
} from "../../../types/ledgerBalances";
import {IsValidString} from "../stringUtils";

const ALLOCATION_STRATEGIES: AllocationStrategy[] = [
  `FIFO`,
  `LIFO`,
  `PROPORTIONAL`,
];

export function ValidateCreateLedgerBalance<T extends Record<string, unknown>>(
  data: CreateLedgerBalance<T>,
): null | string {
  // Validate if data is an object
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type CreateLedgerBalance`;
  }

  // Validate ledger_id
  if (!IsValidString(data.ledger_id)) {
    return `ledger_id must be a valid string`;
  }

  // Validate identity_id if provided
  if (data.identity_id !== undefined && !IsValidString(data.identity_id)) {
    return `identity_id must be a valid string if provided`;
  }

  // Validate currency
  if (!IsValidString(data.currency)) {
    return `currency must be either 'USD' or 'NGN'`;
  }

  // Validate meta_data if provided
  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  if (
    data.track_fund_lineage !== undefined &&
    typeof data.track_fund_lineage !== `boolean`
  ) {
    return `track_fund_lineage must be a boolean if provided`;
  }

  if (
    data.allocation_strategy !== undefined &&
    !ALLOCATION_STRATEGIES.includes(data.allocation_strategy)
  ) {
    return `allocation_strategy must be one of FIFO, LIFO, or PROPORTIONAL`;
  }

  // If all validations pass, return null
  return null;
}

export const isValidMetaData = <T extends Record<string, unknown>>(meta: T) =>
  typeof meta === `object` && meta !== null;

export function ValidateGetByIndicator(
  indicator: string,
  currency: string,
): null | string {
  if (!IsValidString(indicator) || indicator === ``) {
    return `indicator is required`;
  }

  if (!IsValidString(currency) || currency === ``) {
    return `currency is required`;
  }

  return null;
}

export function ValidateUpdateBalanceIdentity(
  data: UpdateBalanceIdentity,
): null | string {
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type UpdateBalanceIdentity`;
  }

  if (!IsValidString(data.identity_id) || data.identity_id === ``) {
    return `identity_id is required`;
  }

  return null;
}

export function ValidateCreateBalanceSnapshot(
  data?: CreateBalanceSnapshotRequest,
): null | string {
  if (data === undefined) {
    return null;
  }

  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type CreateBalanceSnapshotRequest`;
  }

  if (data.batch_size !== undefined && data.batch_size < 0) {
    return `batch_size must be positive`;
  }

  return null;
}

export function ValidateGetBalanceAt(data: GetBalanceAtRequest): null | string {
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type GetBalanceAtRequest`;
  }

  if (!IsValidString(data.timestamp) || data.timestamp === ``) {
    return `timestamp is required`;
  }

  return null;
}
