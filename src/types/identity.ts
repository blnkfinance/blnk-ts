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

/** Core tokenization field names (Go struct fields), not `IdentityData` JSON keys. */
export type TokenizableIdentityField =
  | `FirstName`
  | `LastName`
  | `OtherNames`
  | `EmailAddress`
  | `PhoneNumber`
  | `Street`
  | `PostCode`;

export interface TokenizeIdentityData {
  /**
   * Field names to tokenize. Use PascalCase struct names (`FirstName`,
   * `EmailAddress`), not the snake_case keys on `IdentityData` (`first_name`,
   * `email_address`) — Core rejects snake_case with "field is not tokenizable".
   */
  fields: TokenizableIdentityField[];
}

export interface TokenizeIdentityResp {
  message: string;
}

export interface GetTokenizedFieldsResp {
  tokenized_fields: TokenizableIdentityField[];
}
