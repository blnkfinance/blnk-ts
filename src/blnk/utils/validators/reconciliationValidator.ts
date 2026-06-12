import {
  Criteria,
  CriteriaField,
  ExternalTransaction,
  Matcher,
  Operator,
  RunInstantReconData,
  Strategy,
} from "../../../types/reconciliation";
import {IsValidArray, IsValidNumber, IsValidString} from "../stringUtils";

const MAX_INSTANT_RECON_ITEMS = 10000;

export function ValidateMatcher(data: Matcher): string | null {
  // Validate if data is an object
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type Matcher`;
  }

  // Validate name
  if (!IsValidString(data.name)) {
    return `name must be a valid string`;
  }

  // Validate description
  if (!IsValidString(data.description)) {
    return `description must be a valid string`;
  }

  // Validate criteria
  if (!IsValidArray(data.criteria)) {
    return `criteria must be a valid array`;
  }

  for (const criterion of data.criteria) {
    if (!isValidCriteria(criterion)) {
      return `Each criterion must be a valid object of type Criteria with valid field, operator, and optional allowable_drift`;
    }
  }

  // If all validations pass, return null
  return null;
}

const isValidCriteriaField = (field: CriteriaField) =>
  [`amount`, `currency`, `reference`, `description`, `date`].includes(field);

const isValidOperator = (operator: Operator) =>
  [`equals`, `greater_than`, `less_than`, `contains`].includes(operator);

const isValidCriteria = (criteria: Criteria) =>
  criteria &&
  typeof criteria === `object` &&
  isValidCriteriaField(criteria.field) &&
  isValidOperator(criteria.operator) &&
  (criteria.allowable_drift === undefined ||
    IsValidNumber(criteria.allowable_drift));

const isValidStrategy = (strategy: Strategy) =>
  [`one_to_one`, `one_to_many`, `many_to_one`].includes(strategy);

const isValidExternalTransaction = (txn: ExternalTransaction) =>
  txn &&
  typeof txn === `object` &&
  IsValidString(txn.id) &&
  IsValidNumber(txn.amount) &&
  IsValidString(txn.reference) &&
  IsValidString(txn.currency) &&
  IsValidString(txn.description) &&
  IsValidString(txn.date) &&
  IsValidString(txn.source);

export function ValidateRunInstantReconData(
  data: RunInstantReconData,
): string | null {
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type RunInstantReconData`;
  }

  if (
    !IsValidArray(data.external_transactions) ||
    data.external_transactions.length === 0
  ) {
    return `external_transactions must be a non-empty array`;
  }

  if (data.external_transactions.length > MAX_INSTANT_RECON_ITEMS) {
    return `too many external_transactions; max is ${MAX_INSTANT_RECON_ITEMS}`;
  }

  for (const txn of data.external_transactions) {
    if (!isValidExternalTransaction(txn)) {
      return `Each external transaction must include id, amount, reference, currency, description, date, and source`;
    }
  }

  if (
    !IsValidString(data.strategy) ||
    !isValidStrategy(data.strategy as Strategy)
  ) {
    return `strategy must be one of: one_to_one, one_to_many, many_to_one`;
  }

  if (
    !IsValidArray(data.matching_rule_ids) ||
    data.matching_rule_ids.length === 0
  ) {
    return `matching_rule_ids must be a non-empty array`;
  }

  for (const ruleId of data.matching_rule_ids) {
    if (!IsValidString(ruleId)) {
      return `Each matching_rule_id must be a valid string`;
    }
  }

  if (data.dry_run !== undefined && typeof data.dry_run !== `boolean`) {
    return `dry_run must be a boolean`;
  }

  if (
    data.grouping_criteria !== undefined &&
    !IsValidString(data.grouping_criteria)
  ) {
    return `grouping_criteria must be a valid string`;
  }

  return null;
}
