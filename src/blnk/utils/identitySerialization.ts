import {IdentityData, IdentityDateInput} from "../../types/identity";
import {
  isValidTransactionDateInput,
  serializeTransactionDate,
} from "./transactionSerialization";

export function isValidIdentityDateInput(value: IdentityDateInput): boolean {
  return isValidTransactionDateInput(value);
}

/**
 * Prepares an identity payload for the API, converting Date fields to ISO strings.
 */
export function serializeIdentityData<T extends Record<string, unknown>>(
  data: IdentityData<T>,
): IdentityData<T> {
  return {
    ...data,
    dob: serializeTransactionDate(data.dob) as IdentityData<T>[`dob`],
  };
}
