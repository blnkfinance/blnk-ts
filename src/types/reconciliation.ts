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

type Strategy = `one_to_one` | `one_to_many` | `many_to_one`;

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
