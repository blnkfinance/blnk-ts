export type IdentityDateInput = string | Date;

type IdentityType = `individual` | `organization`;

export interface IdentityData<T extends Record<string, unknown>> {
  /** Optional caller-supplied id (`idt_` + UUID). */
  identity_id?: string;
  identity_type: IdentityType;
  first_name?: string;
  last_name?: string;
  other_names?: string;
  gender?: `male` | `female` | `other`;
  /** ISO 8601 string (RFC3339) or `Date` (serialized before the API call). */
  dob?: IdentityDateInput;
  email_address?: string;
  phone_number?: string;
  nationality?: string;
  organization_name?: string;
  category?: string;
  street?: string;
  country?: string;
  state?: string;
  post_code?: string;
  city?: string;
  meta_data?: T;
}

export interface IdentityDataResponse<
  T extends Record<string, unknown>,
> extends Omit<IdentityData<T>, `dob`> {
  created_at: string;
  identity_id: string;
  /** Date of birth as returned by the API (ISO 8601 string). */
  dob?: string;
}

export interface TokenizeIdentityData {
  /** Identity field names to tokenize (e.g. `firstName`, `emailAddress`). */
  fields: string[];
}

export interface TokenizeIdentityResp {
  message: string;
}
