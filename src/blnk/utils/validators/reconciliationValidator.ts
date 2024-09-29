import {
  Criteria,
  CriteriaField,
  Matcher,
  Operator,
} from "../../../types/reconciliation";
import {IsValidArray, IsValidNumber, IsValidString} from "../stringUtils";

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
