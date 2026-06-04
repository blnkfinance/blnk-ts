import {
  BulkTransactions,
  CreateTransactions,
  MultipleSourcesT,
  UpdateTransactionStatus,
} from "../../../types/transactions";
import {IsValidString} from "../stringUtils";
import {isValidMetaData} from "./ledgerBalance";

/**
 * Resolves the numeric total used for split-leg distribution checks.
 * API accepts either `amount` or `precise_amount` (see create-transaction reference).
 */
function resolveTransactionAmount(
  data: CreateTransactions<Record<string, unknown>>,
): number | null {
  const hasAmount = typeof data.amount === `number`;
  const hasPreciseAmount = typeof data.precise_amount === `number`;

  if (!hasAmount && !hasPreciseAmount) {
    return null;
  }

  if (hasAmount) {
    return data.amount as number;
  }

  return data.precise_amount as number;
}

function validateSplitLegRouting(
  data: CreateTransactions<Record<string, unknown>>,
): string | null {
  const hasSource = Boolean(data.source);
  const hasSources = Boolean(data.sources && data.sources.length > 0);
  const hasDestination = Boolean(data.destination);
  const hasDestinations = Boolean(
    data.destinations && data.destinations.length > 0,
  );

  if (hasSource && hasSources) {
    return `Both 'source' and 'sources' cannot be provided together.`;
  }

  if (hasDestination && hasDestinations) {
    return `Both 'destination' and 'destinations' cannot be provided together.`;
  }

  if (hasSources) {
    if (hasDestinations) {
      return `'sources' requires a single 'destination'; use 'destination' instead of 'destinations'.`;
    }
    if (!hasDestination) {
      return `'destination' is required when using 'sources'.`;
    }
  }

  if (hasDestinations) {
    if (hasSources) {
      return `'destinations' requires a single 'source'; use 'source' instead of 'sources'.`;
    }
    if (!hasSource) {
      return `'source' is required when using 'destinations'.`;
    }
  }

  return null;
}

export function ValidateCreateTransactions<T extends Record<string, unknown>>(
  data: CreateTransactions<T>,
): string | null {
  const transactionAmount = resolveTransactionAmount(data);
  if (transactionAmount === null) {
    return `Either 'amount' or 'precise_amount' must be provided.`;
  }

  if (data.amount !== undefined && typeof data.amount !== `number`) {
    return `Amount must be a number.`;
  }

  if (
    data.precise_amount !== undefined &&
    typeof data.precise_amount !== `number`
  ) {
    return `precise_amount must be a number.`;
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

  const splitLegError = validateSplitLegRouting(data);
  if (splitLegError) {
    return splitLegError;
  }

  if (data.source && typeof data.source !== `string`) {
    return `Invalid source.`;
  }

  if (data.destination && typeof data.destination !== `string`) {
    return `Destination must be a string.`;
  }

  if (data.sources) {
    const sourcesError = validateSplitLegs(
      data.sources,
      transactionAmount,
      `source`,
    );
    if (sourcesError) return sourcesError;
  }

  if (data.destinations) {
    const destinationsError = validateSplitLegs(
      data.destinations,
      transactionAmount,
      `destination`,
    );
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

  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  return null;
}

function validateSplitLegs(
  legs: MultipleSourcesT[],
  amount: number,
  legLabel: `source` | `destination`,
): string | null {
  if (!Array.isArray(legs) || legs.length === 0) {
    return `'${legLabel === `source` ? `sources` : `destinations`}' must be a non-empty array.`;
  }

  for (const leg of legs) {
    if (!IsValidString(leg.identifier)) {
      return `Each ${legLabel} leg must include a valid identifier.`;
    }
    if (!IsValidString(leg.distribution)) {
      return `Each ${legLabel} leg must include a valid distribution.`;
    }
  }

  return validateSources(legs, amount);
}

function validateSources(
  sources: MultipleSourcesT[],
  amount: number,
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
  data: UpdateTransactionStatus<T>,
): string | null {
  if (typeof data.status !== `string`) {
    return `Status must be a string.`;
  }

  if (data.amount !== undefined && typeof data.amount !== `number`) {
    return `Amount must be a number.`;
  }

  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  const allowedFields = [`status`, `amount`, `meta_data`];
  for (const key in data) {
    if (!allowedFields.includes(key)) {
      return `Invalid field: ${key}`;
    }
  }

  return null;
}

export function ValidateBulkTransactions<T extends Record<string, unknown>>(
  data: BulkTransactions<T>,
): string | null {
  if (data.atomic !== undefined && typeof data.atomic !== `boolean`) {
    return `Atomic must be a boolean if provided.`;
  }

  if (data.inflight !== undefined && typeof data.inflight !== `boolean`) {
    return `Inflight must be a boolean if provided.`;
  }

  if (data.run_async !== undefined && typeof data.run_async !== `boolean`) {
    return `Run_async must be a boolean if provided.`;
  }

  if (!Array.isArray(data.transactions)) {
    return `Transactions must be an array.`;
  }

  if (data.transactions.length === 0) {
    return `Transactions array cannot be empty.`;
  }

  for (let i = 0; i < data.transactions.length; i++) {
    const transaction = data.transactions[i];
    const validationError = ValidateCreateTransactions(transaction);
    if (validationError) {
      return `Transaction at index ${i}: ${validationError}`;
    }
  }

  const references = data.transactions.map(t => t.reference);
  const uniqueReferences = new Set(references);
  if (references.length !== uniqueReferences.size) {
    return `All transactions must have unique references within the bulk request.`;
  }

  return null;
}
