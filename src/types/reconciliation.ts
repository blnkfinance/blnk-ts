export interface ReconciliationUploadResp {
  upload_id: string;
  record_count: number;
  source: string;
}

export type CriteriaField =
  | `amount`
  | `currency`
  | `reference`
  | `description`
  | `date`;

export type Operator = `equals` | `greater_than` | `less_than` | `contains`;

export interface Criteria {
  field: CriteriaField;
  operator: Operator;
  allowable_drift?: number; // Optional field for fields that support allowable drift
}

export interface Matcher {
  name: string;
  description: string;
  criteria: Criteria[];
}

export type Strategy = `one_to_one` | `one_to_many` | `many_to_one`;

export interface RunReconData {
  upload_id: string;
  strategy: Strategy;
  dry_run: boolean;
  grouping_criteria: CriteriaField;
  matching_rule_ids: string[];
}

export interface RunReconResp extends Matcher {
  rule_id: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalTransaction {
  id: string;
  amount: number;
  reference: string;
  currency: string;
  description: string;
  date: string;
  source: string;
}

export interface RunInstantReconData {
  external_transactions: ExternalTransaction[];
  strategy: Strategy;
  dry_run?: boolean;
  grouping_criteria?: string;
  matching_rule_ids: string[];
}

export interface RunInstantReconResp {
  reconciliation_id: string;
}
