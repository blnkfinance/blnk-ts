import {Currency} from "../../../types/general";
import {CreateLedgerBalance} from "../../../types/ledgerBalances";
import {IsValidString} from "../stringUtils";

export function ValidateCreateLedgerBalance<T extends Record<string, unknown>>(
  data: CreateLedgerBalance<T>
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
  if (!isValidCurrency(data.currency)) {
    return `currency must be either 'USD' or 'NGN'`;
  }

  // Validate meta_data if provided
  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  // If all validations pass, return null
  return null;
}

const isValidCurrency = (currency: Currency) =>
  currency === `USD` || currency === `NGN`;

export const isValidMetaData = <T extends Record<string, unknown>>(meta: T) =>
  typeof meta === `object` && meta !== null;
