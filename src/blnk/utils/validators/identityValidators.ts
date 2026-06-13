import {
  DetokenizeIdentityData,
  IdentityData,
  TokenizableIdentityField,
  TokenizeIdentityData,
} from "../../../types/identity";
import {isValidMetaData} from "./ledgerBalance";
import {isValidIdentityDateInput} from "../identitySerialization";
import {IsValidArray, IsValidString} from "../stringUtils";

const IDENTITY_ID_PATTERN =
  /^idt_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_GENDERS = [`male`, `female`, `other`] as const;

export function ValidateIdentity<T extends Record<string, unknown>>(
  data: IdentityData<T>,
): string | null {
  if (
    data.identity_type !== `individual` &&
    data.identity_type !== `organization`
  ) {
    return `identity_type must be individual or organization`;
  }

  if (
    data.identity_id !== undefined &&
    !IDENTITY_ID_PATTERN.test(data.identity_id)
  ) {
    return `identity_id must start with idt_ followed by a valid UUID`;
  }

  if (data.dob !== undefined && !isValidIdentityDateInput(data.dob)) {
    return `dob must be a valid ISO 8601 date string or Date`;
  }

  if (data.gender !== undefined && !VALID_GENDERS.includes(data.gender)) {
    return `gender must be male, female, or other if provided`;
  }

  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  return null;
}

export function ValidateIdentityId(id: string): string | null {
  if (!IsValidString(id) || id === ``) {
    return `identity id is required`;
  }

  return null;
}

export function ValidateTokenizeIdentityField(
  id: string,
  field: TokenizableIdentityField,
): string | null {
  const idError = ValidateIdentityId(id);
  if (idError) {
    return idError;
  }

  if (!IsValidString(field) || String(field).length === 0) {
    return `field name is required`;
  }

  return null;
}

export function ValidateDetokenizeIdentityData(
  id: string,
  data: DetokenizeIdentityData,
): string | null {
  const idError = ValidateIdentityId(id);
  if (idError) {
    return idError;
  }

  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type DetokenizeIdentityData`;
  }

  if (!IsValidArray(data.fields)) {
    return `fields must be an array`;
  }

  for (const field of data.fields) {
    if (!IsValidString(field) || String(field).length === 0) {
      return `each field must be a non-empty string`;
    }
  }

  return null;
}

export function ValidateTokenizeIdentityData(
  id: string,
  data: TokenizeIdentityData,
): string | null {
  const idError = ValidateIdentityId(id);
  if (idError) {
    return idError;
  }

  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type TokenizeIdentityData`;
  }

  if (!IsValidArray(data.fields) || data.fields.length === 0) {
    return `at least one field must be specified`;
  }

  for (const field of data.fields) {
    if (!IsValidString(field) || String(field).length === 0) {
      return `each field must be a non-empty string`;
    }
  }

  return null;
}
