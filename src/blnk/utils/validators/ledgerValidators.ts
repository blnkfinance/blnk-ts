import {CreateLedger} from "../../../types/ledger";
import {isValidMetaData} from "./ledgerBalance";

export function ValidateCreateLedger<T extends Record<string, unknown>>(
  data: CreateLedger<T>,
): null | string {
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type CreateLedgerBalance`;
  }

  if (typeof data.name !== `string`) {
    return `name field must be a valid string`;
  }

  // Validate meta_data if provided
  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  return null;
}
