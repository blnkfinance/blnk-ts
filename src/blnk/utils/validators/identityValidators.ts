import {IdentityData} from "../../../types/identity";
import {isValidMetaData} from "./ledgerBalance";
import {isValidIdentityDateInput} from "../identitySerialization";

const IDENTITY_ID_PATTERN =
  /^idt_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ValidateIdentity<T extends Record<string, unknown>>(
  data: IdentityData<T>,
): string | null {
  if (
    data.identity_id !== undefined &&
    !IDENTITY_ID_PATTERN.test(data.identity_id)
  ) {
    return `identity_id must start with idt_ followed by a valid UUID`;
  }

  if (data.identity_type === `individual`) {
    if (!data.first_name) {
      return `First name is required for individuals.`;
    }
    if (!data.last_name) {
      return `Last name is required for individuals.`;
    }
    if (!data.dob) {
      return `Date of birth is required for individuals.`;
    }
    if (!isValidIdentityDateInput(data.dob)) {
      return `dob must be a valid ISO 8601 date string or Date`;
    }
    if (!data.gender) {
      return `Gender is required for individuals.`;
    }
    if (!data.nationality) {
      return `Nationality is required for individuals.`;
    }
  } else if (data.identity_type === `organization`) {
    if (!data.organization_name || data.organization_name.trim() === ``) {
      return `Organization name is required for organizations.`;
    }
  }

  if (!data.street) {
    return `Street address is required.`;
  }
  if (!data.city) {
    return `City is required.`;
  }
  if (!data.state) {
    return `State is required.`;
  }
  if (!data.country) {
    return `Country is required.`;
  }
  if (!data.post_code) {
    return `Postal code is required.`;
  }
  if (!data.category) {
    return `Category is required.`;
  }
  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  return null;
}
