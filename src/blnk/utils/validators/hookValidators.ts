import {CreateHookData, HookType, UpdateHookData} from "../../../types/hooks";
import {IsValidNumber, IsValidString} from "../stringUtils";

const isValidHookType = (type: HookType) =>
  [`PRE_TRANSACTION`, `POST_TRANSACTION`].includes(type);

export function ValidateCreateHookData(data: CreateHookData): string | null {
  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type CreateHookData`;
  }

  if (!IsValidString(data.name) || data.name === ``) {
    return `name is required`;
  }

  if (!IsValidString(data.url) || data.url === ``) {
    return `url is required`;
  }

  if (!IsValidString(data.type) || !isValidHookType(data.type)) {
    return `type must be PRE_TRANSACTION or POST_TRANSACTION`;
  }

  if (typeof data.active !== `boolean`) {
    return `active must be a boolean`;
  }

  if (!IsValidNumber(data.timeout) || data.timeout <= 0) {
    return `timeout must be a positive number`;
  }

  if (!IsValidNumber(data.retry_count) || data.retry_count < 0) {
    return `retry_count must be a non-negative number`;
  }

  return null;
}

export function ValidateUpdateHookData(data: UpdateHookData): string | null {
  return ValidateCreateHookData(data);
}
