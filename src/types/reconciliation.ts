export interface ReconciliationUploadResp {
  upload_id: string;
  record_count: number;
  source: string;
}

type CriteriaField =
  | `amount`
  | `currency`
  | `reference`
  | `description`
  | `date`;

type Operator = `equals` | `greater_than` | `less_than` | `contains`;

interface Criteria {
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
