import {
  CreateApiKeyData,
  DeleteApiKeyOptions,
  ListApiKeysOptions,
} from "../../../types/apiKeys";
import {IsValidArray, IsValidString} from "../stringUtils";
import {isValidTransactionDateInput} from "../transactionSerialization";

export function ValidateCreateApiKeyData(
  data: CreateApiKeyData,
): string | null {
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type CreateApiKeyData`;
  }

  if (!IsValidString(data.name) || data.name === ``) {
    return `name is required`;
  }

  if (!IsValidString(data.owner) || data.owner === ``) {
    return `owner is required`;
  }

  if (!IsValidArray(data.scopes) || data.scopes.length === 0) {
    return `at least one scope must be specified`;
  }

  for (const scope of data.scopes) {
    if (!IsValidString(scope) || scope === ``) {
      return `each scope must be a non-empty string`;
    }
  }

  if (
    !IsValidString(data.expires_at) ||
    !isValidTransactionDateInput(data.expires_at)
  ) {
    return `expires_at must be a valid ISO 8601 datetime string`;
  }

  return null;
}

export function ValidateListApiKeysOptions(
  options?: ListApiKeysOptions,
): string | null {
  if (options === undefined) {
    return null;
  }

  if (!options || typeof options !== `object`) {
    return `options must be a valid object`;
  }

  if (
    options.owner !== undefined &&
    (!IsValidString(options.owner) || options.owner === ``)
  ) {
    return `owner must be a non-empty string`;
  }

  return null;
}

export function ValidateDeleteApiKeyOptions(
  options?: DeleteApiKeyOptions,
): string | null {
  return ValidateListApiKeysOptions(options);
}
