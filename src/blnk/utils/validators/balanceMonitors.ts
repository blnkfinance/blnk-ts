import {
  MonitorCondition,
  MonitorData,
  MonitorTrigger,
  UpdateMonitorRequest,
} from "../../../types/balanceMonitor";
import {IsValidNumber, IsValidOperator, IsValidString} from "../stringUtils";

/** Trigger modes Core accepts (`model.NormalizeTrigger`). */
export const MONITOR_TRIGGERS: readonly MonitorTrigger[] = [`edge`, `level`];

/** Returns an error for a trigger Core would reject, or null. */
export function ValidateMonitorTrigger(trigger: unknown): string | null {
  if (trigger === undefined) {
    return null;
  }
  if (!MONITOR_TRIGGERS.includes(trigger as MonitorTrigger)) {
    return `trigger must be either "edge" or "level" if provided`;
  }
  return null;
}

const isFiniteNumber = (val: unknown): val is number =>
  typeof val === `number` && Number.isFinite(val);

/**
 * Validates a partial monitor update. Every field is optional, but a field
 * that is set must be valid, and at least one field must be set. Empty
 * `balance_id`, `field` and `operator` are rejected: Core would treat them as
 * "keep the stored value", which hides the mistake.
 */
export function ValidateUpdateMonitorRequest(
  data: UpdateMonitorRequest,
): string | null {
  if (!data || typeof data !== `object` || Array.isArray(data)) {
    return `Data must be a valid object of type UpdateMonitorRequest`;
  }

  if (
    data.balance_id !== undefined &&
    (!IsValidString(data.balance_id) || data.balance_id.trim() === ``)
  ) {
    return `balance_id must be a non-empty string if provided`;
  }

  if (data.description !== undefined && !IsValidString(data.description)) {
    return `description must be a valid string if provided`;
  }

  const triggerError = ValidateMonitorTrigger(data.trigger);
  if (triggerError) {
    return triggerError;
  }

  const condition = data.condition;
  if (condition !== undefined) {
    if (
      !condition ||
      typeof condition !== `object` ||
      Array.isArray(condition)
    ) {
      return `condition must be an object if provided`;
    }
    if (
      condition.field !== undefined &&
      (!IsValidString(condition.field) || condition.field === ``)
    ) {
      return `condition.field must be a non-empty string if provided`;
    }
    if (
      condition.operator !== undefined &&
      !IsValidOperator(condition.operator)
    ) {
      return `condition.operator must be one of >, <, >=, <=, =, != if provided`;
    }
    if (condition.value !== undefined && !isFiniteNumber(condition.value)) {
      return `condition.value must be a finite number if provided`;
    }
    if (
      condition.precision !== undefined &&
      (!isFiniteNumber(condition.precision) || condition.precision <= 0)
    ) {
      return `condition.precision must be a positive number if provided`;
    }
  }

  const hasConditionField =
    condition !== undefined &&
    (condition.field !== undefined ||
      condition.operator !== undefined ||
      condition.value !== undefined ||
      condition.precision !== undefined);
  if (
    data.balance_id === undefined &&
    data.description === undefined &&
    data.trigger === undefined &&
    !hasConditionField
  ) {
    return `at least one field must be set to update a balance monitor`;
  }

  return null;
}

export function ValidateMonitorId(id: string): string | null {
  if (!IsValidString(id) || id === ``) {
    return `monitor id is required`;
  }

  return null;
}

export function ValidateBalanceId(id: string): string | null {
  if (!IsValidString(id) || id.trim() === ``) {
    return `balance id is required`;
  }

  return null;
}

export function ValidateMonitorData(data: MonitorData): string | null {
  // Validate if data is an object
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type MonitorData`;
  }

  // Validate balance_id
  if (!IsValidString(data.balance_id)) {
    return `balance_id must be a valid string`;
  }

  // Validate condition
  if (!isValidCondition(data.condition)) {
    return `condition must be a valid MonitorCondition object`;
  }

  // Validate description if provided
  if (data.description !== undefined && !IsValidString(data.description)) {
    return `description must be a valid string if provided`;
  }

  // Validate call_back_url if provided
  if (data.call_back_url !== undefined && !IsValidString(data.call_back_url)) {
    return `call_back_url must be a valid string if provided`;
  }

  const triggerError = ValidateMonitorTrigger(data.trigger);
  if (triggerError) {
    return triggerError;
  }

  // If all validations pass, return null
  return null;
}

const isValidCondition = (condition: MonitorCondition) => {
  return (
    condition &&
    typeof condition === `object` &&
    IsValidString(condition.field) &&
    IsValidOperator(condition.operator) &&
    IsValidNumber(condition.value) &&
    IsValidNumber(condition.precision)
  );
};
