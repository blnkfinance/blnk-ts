import {IdentityData} from "../../../types/identity";
import {isValidMetaData} from "./ledgerBalance";

export function ValidateIdentity<T extends Record<string, unknown>>(
  data: IdentityData<T>
): string | null {
  if (data.identity_type === `individual`) {
    // Validate fields for individuals
    if (!data.first_name) {
      return `First name is required for individuals.`;
    }
    if (!data.last_name) {
      return `Last name is required for individuals.`;
    }
    if (!data.dob) {
      return `Date of birth is required for individuals.`;
    }
    if (!data.gender) {
      return `Gender is required for individuals.`;
    }
    if (!data.nationality) {
      return `Nationality is required for individuals.`;
    }
  } else if (data.identity_type === `organization`) {
    // Validate fields for organizations
    if (!data.organization_name || data.organization_name.trim() === ``) {
      return `Organization name is required for organizations.`;
    }
  }

  // Validate common fields for both individuals and organizations
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
  // Validate meta_data if provided
  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  // Return errors if any, otherwise return an empty array
  return null;
}
