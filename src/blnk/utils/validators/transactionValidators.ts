import {
  BulkTransactions,
  CreateTransactions,
  MultipleSourcesT,
  UpdateTransactionStatus,
} from "../../../types/transactions";
import {IsValidString} from "../stringUtils";
import {isValidMetaData} from "./ledgerBalance";

export function ValidateCreateTransactions<T extends Record<string, unknown>>(
  data: CreateTransactions<T>
): string | null {
  if (typeof data.amount !== `number`) {
    return `Amount must be a number.`;
  }
  if (typeof data.precision !== `number`) {
    return `Precision must be a number.`;
  }
  if (typeof data.reference !== `string`) {
    return `Reference must be a string.`;
  }
  if (typeof data.description !== `string`) {
    return `Description must be a string.`;
  }
  if (!IsValidString(data.currency)) {
    return `Invalid currency.`;
  }

  if (data.source && data.sources) {
    return `Both 'source' and 'sources' cannot be provided together.`;
  }

  if (data.sources) {
    const sourcesError = validateSources(data.sources, data.amount);
    if (sourcesError) return sourcesError;
  }

  if (data.source && typeof data.source !== `string`) {
    return `Invalid source.`;
  }

  if (data.destination && typeof data.destination !== `string`) {
    return `Destination must be a string.`;
  }

  if (data.destination && data.destinations) {
    return `Both 'source' and 'sources' cannot be provided together.`;
  }

  if (data.destinations) {
    const destinationsError = validateSources(data.destinations, data.amount);
    if (destinationsError) return destinationsError;
  }

  if (data.inflight !== undefined && typeof data.inflight !== `boolean`) {
    return `Inflight must be a boolean if provided.`;
  }

  if (
    data.inflight_expiry_date &&
    !(
      data.inflight_expiry_date instanceof Date &&
      !isNaN(data.inflight_expiry_date.getTime())
    )
  ) {
    return `Invalid inflight expiry date.`;
  }

  if (
    data.scheduled_for &&
    !(
      data.scheduled_for instanceof Date && !isNaN(data.scheduled_for.getTime())
    )
  ) {
    return `Invalid scheduled date.`;
  }

  if (
    data.allow_overdraft !== undefined &&
    typeof data.allow_overdraft !== `boolean`
  ) {
    return `Allow overdraft must be a boolean if provided.`;
  }

  // Validate meta_data if provided
  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  return null; // No errors
}

function validateSources(
  sources: MultipleSourcesT[],
  amount: number
): string | null {
  let sum = 0;
  let hasLeft = false;

  for (const source of sources) {
    const {distribution} = source;

    if (distribution.endsWith(`%`)) {
      const percentageValue = parseFloat(distribution.slice(0, -1));
      if (
        isNaN(percentageValue) ||
        percentageValue < 0 ||
        percentageValue > 100
      ) {
        return `Invalid percentage value in source: ${source.identifier}`;
      }
      sum += (percentageValue / 100) * amount;
    } else if (!isNaN(Number(distribution))) {
      const numericValue = parseFloat(distribution);
      if (numericValue < 0) {
        return `Invalid numeric value in source: ${source.identifier}`;
      }
      sum += numericValue;
    } else if (distribution === `left`) {
      if (hasLeft) {
        return `Multiple 'left' distribution types are not allowed.`;
      }
      hasLeft = true;
    } else {
      return `Invalid distribution type for source: ${source.identifier}`;
    }
  }

  if (hasLeft) {
    const remaining = amount - sum;
    if (remaining < 0) {
      return `Total distribution exceeds the specified amount.`;
    }
  } else if (sum !== amount) {
    return `Total distribution sum (${sum}) does not equal the specified amount (${amount}).`;
  }

  return null;
}

export function ValidateUpdateTransactions<T extends Record<string, unknown>>(
  data: UpdateTransactionStatus<T>
): string | null {
  if (typeof data.status !== `string`) {
    return `Status must be a string.`;
  }

  //if amount exists, it must be a number
  if (data.amount !== undefined && typeof data.amount !== `number`) {
    return `Amount must be a number.`;
  }

  // Validate meta_data if provided
  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  //if any field not  in the type is provided, throw an error
  const allowedFields = [`status`, `amount`, `meta_data`];
  for (const key in data) {
    if (!allowedFields.includes(key)) {
      return `Invalid field: ${key}`;
    }
  }

  return null;
}

export function ValidateBulkTransactions<T extends Record<string, unknown>>(
  data: BulkTransactions<T>
): string | null {
  // Validate atomic field
  if (data.atomic !== undefined && typeof data.atomic !== `boolean`) {
    return `Atomic must be a boolean if provided.`;
  }

  // Validate inflight field
  if (data.inflight !== undefined && typeof data.inflight !== `boolean`) {
    return `Inflight must be a boolean if provided.`;
  }

  // Validate run_async field
  if (data.run_async !== undefined && typeof data.run_async !== `boolean`) {
    return `Run_async must be a boolean if provided.`;
  }

  // Validate transactions array
  if (!Array.isArray(data.transactions)) {
    return `Transactions must be an array.`;
  }

  if (data.transactions.length === 0) {
    return `Transactions array cannot be empty.`;
  }

  // Validate each transaction in the array
  for (let i = 0; i < data.transactions.length; i++) {
    const transaction = data.transactions[i];
    const validationError = ValidateCreateTransactions(transaction);
    if (validationError) {
      return `Transaction at index ${i}: ${validationError}`;
    }
  }

  // Validate reference uniqueness within the batch
  const references = data.transactions.map(t => t.reference);
  const uniqueReferences = new Set(references);
  if (references.length !== uniqueReferences.size) {
    return `All transactions must have unique references within the bulk request.`;
  }

  return null;
}
