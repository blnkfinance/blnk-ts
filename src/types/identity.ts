type IdentityType = `individual` | `organization`;

export interface IdentityData<T extends Record<string, unknown>> {
  identity_type: IdentityType;
  first_name?: string;
  last_name?: string;
  other_names?: string;
  gender?: `male` | `female` | `other`;
  dob?: Date;
  email_address: string;
  phone_number: string;
  nationality?: string;
  organization_name?: string;
  category: string;
  street: string;
  country: string;
  state: string;
  post_code: string;
  city: string;
  meta_data?: T;
}

export interface IdentityDataResponse<T extends Record<string, unknown>>
  extends IdentityData<T> {
  created_at: string;
  identity_id: string;
}
