import {MonitorCondition, MonitorData} from "../../../types/balanceMonitor";
import {IsValidNumber, IsValidString} from "../stringUtils";

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

  // If all validations pass, return null
  return null;
}

const isValidCondition = (condition: MonitorCondition) => {
  return (
    condition &&
    typeof condition === `object` &&
    IsValidString(condition.field) &&
    IsValidString(condition.operator) &&
    IsValidNumber(condition.value)
  );
};
