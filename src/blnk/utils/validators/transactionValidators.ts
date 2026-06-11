/* eslint-disable n/no-unsupported-features/es-builtins */
import {
  BulkCommitInflightRequest,
  BulkTransactions,
  CreateTransactions,
  MAX_BULK_INFLIGHT_ITEMS,
  MultipleSourcesT,
  RefundTransactionRequest,
  TransactionDateInput,
  UpdateTransactionStatus,
} from "../../../types/transactions";
import {IsValidString} from "../stringUtils";
import {isValidTransactionDateInput} from "../transactionSerialization";
import {isValidMetaData} from "./ledgerBalance";

const NON_NEGATIVE_INTEGER_STRING = /^\d+$/;

function validateOptionalDateField(
  value: TransactionDateInput | undefined,
  fieldName: string,
): string | null {
  if (value === undefined) {
    return null;
  }
  if (!isValidTransactionDateInput(value)) {
    return `Invalid ${fieldName}.`;
  }
  return null;
}

type TransactionTotal =
  | {arithmetic: `number`; value: number}
  | {arithmetic: `bigint`; value: bigint};

/**
 * Parses a non-negative integer for precise amount/distribution fields.
 * Uses BigInt so string values larger than Number.MAX_SAFE_INTEGER stay exact.
 */
function parsePreciseInteger(value: string | number): bigint | null {
  if (typeof value === `number`) {
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      return null;
    }
    return BigInt(value);
  }

  const trimmed = value.trim();
  if (!NON_NEGATIVE_INTEGER_STRING.test(trimmed)) {
    return null;
  }

  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

function hasPreciseDistribution(leg: MultipleSourcesT): boolean {
  return (
    leg.precise_distribution !== undefined && leg.precise_distribution !== null
  );
}

function usesPreciseIntegerArithmetic(
  data: CreateTransactions<Record<string, unknown>>,
): boolean {
  if (data.sources?.some(hasPreciseDistribution)) {
    return true;
  }
  if (data.destinations?.some(hasPreciseDistribution)) {
    return true;
  }
  if (typeof data.precise_amount === `string`) {
    return true;
  }
  if (
    data.precise_amount !== undefined &&
    data.precise_amount !== null &&
    typeof data.amount !== `number`
  ) {
    return true;
  }
  return false;
}

/**
 * Resolves the transaction total for split-leg distribution checks.
 * When both `amount` and `precise_amount` are provided, `amount` takes precedence.
 */
function resolveTransactionTotal(
  data: CreateTransactions<Record<string, unknown>>,
): TransactionTotal | null {
  const hasAmount = typeof data.amount === `number`;
  const hasPreciseAmount =
    data.precise_amount !== undefined && data.precise_amount !== null;

  if (!hasAmount && !hasPreciseAmount) {
    return null;
  }

  if (usesPreciseIntegerArithmetic(data)) {
    if (hasAmount) {
      return {
        arithmetic: `bigint`,
        value: BigInt(Math.trunc(data.amount as number)),
      };
    }

    const parsed = parsePreciseInteger(data.precise_amount as string | number);
    if (parsed === null) {
      return null;
    }
    return {arithmetic: `bigint`, value: parsed};
  }

  if (hasAmount) {
    return {arithmetic: `number`, value: data.amount as number};
  }

  const parsed = parsePreciseInteger(data.precise_amount as string | number);
  if (parsed === null) {
    return null;
  }

  if (parsed <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return {arithmetic: `number`, value: Number(parsed)};
  }

  return {arithmetic: `bigint`, value: parsed};
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
  const transactionTotal = resolveTransactionTotal(data);
  if (transactionTotal === null) {
    if (
      data.precise_amount !== undefined &&
      data.precise_amount !== null &&
      typeof data.amount !== `number`
    ) {
      return `precise_amount must be a non-negative integer string or number.`;
    }
    return `Either 'amount' or 'precise_amount' must be provided.`;
  }

  if (data.amount !== undefined && typeof data.amount !== `number`) {
    return `Amount must be a number.`;
  }

  if (data.precise_amount !== undefined && data.precise_amount !== null) {
    const isValidPreciseAmount =
      typeof data.precise_amount === `number` ||
      typeof data.precise_amount === `string`;
    if (!isValidPreciseAmount) {
      return `precise_amount must be a string or number.`;
    }
    if (parsePreciseInteger(data.precise_amount) === null) {
      return `precise_amount must be a non-negative integer string or number.`;
    }
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
      transactionTotal,
      `source`,
    );
    if (sourcesError) return sourcesError;
  }

  if (data.destinations) {
    const destinationsError = validateSplitLegs(
      data.destinations,
      transactionTotal,
      `destination`,
    );
    if (destinationsError) return destinationsError;
  }

  if (data.inflight !== undefined && typeof data.inflight !== `boolean`) {
    return `Inflight must be a boolean if provided.`;
  }

  const inflightExpiryError = validateOptionalDateField(
    data.inflight_expiry_date,
    `inflight expiry date`,
  );
  if (inflightExpiryError) {
    return inflightExpiryError;
  }

  const scheduledForError = validateOptionalDateField(
    data.scheduled_for,
    `scheduled date`,
  );
  if (scheduledForError) {
    return scheduledForError;
  }

  const effectiveDateError = validateOptionalDateField(
    data.effective_date,
    `effective_date`,
  );
  if (effectiveDateError) {
    return effectiveDateError;
  }

  const inflightCommitError = validateOptionalDateField(
    data.inflight_commit_date,
    `inflight_commit_date`,
  );
  if (inflightCommitError) {
    return inflightCommitError;
  }

  if (data.skip_queue !== undefined && typeof data.skip_queue !== `boolean`) {
    return `skip_queue must be a boolean if provided.`;
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
  total: TransactionTotal,
  legLabel: `source` | `destination`,
): string | null {
  const legArrayName = legLabel === `source` ? `sources` : `destinations`;

  if (!Array.isArray(legs) || legs.length === 0) {
    return `'${legArrayName}' must be a non-empty array.`;
  }

  for (const leg of legs) {
    if (!IsValidString(leg.identifier)) {
      return `Each ${legLabel} leg must include a valid identifier.`;
    }

    const hasDistribution =
      leg.distribution !== undefined && leg.distribution !== null;
    const hasPreciseDistributionValue = hasPreciseDistribution(leg);

    if (!hasDistribution && !hasPreciseDistributionValue) {
      return `Each ${legLabel} leg must include either 'distribution' or 'precise_distribution'.`;
    }

    if (
      hasPreciseDistributionValue &&
      leg.precise_distribution !== undefined &&
      typeof leg.precise_distribution !== `string` &&
      typeof leg.precise_distribution !== `number`
    ) {
      return `precise_distribution must be a string or number for leg: ${leg.identifier}.`;
    }
  }

  if (total.arithmetic === `bigint`) {
    return validateDistributionLegsBigInt(legs, total.value);
  }

  return validateDistributionLegsNumber(legs, total.value);
}

/**
 * Fixed-amount split legs: non-negative integer or decimal strings only.
 * Rejects exponent (`1e3`), hex (`0x10`), and whitespace-padded values.
 */
const FIXED_AMOUNT_DISTRIBUTION = /^(?:\d+|\d+\.\d+)$/;

/** Percentage split legs such as `20%` or `33.33%`. */
const PERCENTAGE_DISTRIBUTION = /^(?:\d+|\d+\.\d+)%$/;

const DISTRIBUTION_SUM_EPSILON = 1e-9;

function parsePercentageDistribution(distribution: string): number | null {
  if (!PERCENTAGE_DISTRIBUTION.test(distribution)) {
    return null;
  }

  const value = Number(distribution.slice(0, -1));
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return null;
  }

  return value;
}

function parseFixedAmountDistribution(distribution: string): number | null {
  if (distribution.trim() !== distribution) {
    return null;
  }

  if (!FIXED_AMOUNT_DISTRIBUTION.test(distribution)) {
    return null;
  }

  const value = Number(distribution);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

function distributionTotalsApproximatelyEqual(
  sum: number,
  amount: number,
): boolean {
  return Math.abs(sum - amount) <= DISTRIBUTION_SUM_EPSILON;
}

function isFixedDecimalDistribution(distribution: string): boolean {
  const parsed = parseFixedAmountDistribution(distribution);
  return parsed !== null && !Number.isInteger(parsed);
}

function hasDecimalPercentageDistribution(distribution: string): boolean {
  const parsed = parsePercentageDistribution(distribution);
  return parsed !== null && !Number.isInteger(parsed);
}

function legUsesDecimalDistribution(leg: MultipleSourcesT): boolean {
  if (leg.distribution === undefined) {
    return false;
  }

  return (
    isFixedDecimalDistribution(leg.distribution) ||
    hasDecimalPercentageDistribution(leg.distribution)
  );
}

function validateDistributionLegsBigInt(
  legs: MultipleSourcesT[],
  total: bigint,
): string | null {
  const hasDecimalDistribution = legs.some(legUsesDecimalDistribution);

  if (hasDecimalDistribution && total > BigInt(Number.MAX_SAFE_INTEGER)) {
    return `Decimal distribution values are not supported with precise amounts beyond Number.MAX_SAFE_INTEGER.`;
  }

  if (hasDecimalDistribution && total <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return validateDistributionLegsWithDecimals(legs, Number(total));
  }

  let sum = BigInt(0);
  let hasLeft = false;

  for (const leg of legs) {
    if (hasPreciseDistribution(leg)) {
      const preciseValue = parsePreciseInteger(leg.precise_distribution!);
      if (preciseValue === null) {
        return `Invalid precise_distribution for leg: ${leg.identifier}.`;
      }
      sum += preciseValue;
      continue;
    }

    const distribution = leg.distribution;
    if (!distribution || !IsValidString(distribution)) {
      return `Invalid distribution type for leg: ${leg.identifier}.`;
    }

    if (distribution.endsWith(`%`)) {
      const percentageValue = parsePercentageDistribution(distribution);
      if (percentageValue === null) {
        return `Invalid percentage value in leg: ${leg.identifier}.`;
      }
      sum += (total * BigInt(percentageValue)) / BigInt(100);
    } else if (distribution === `left`) {
      if (hasLeft) {
        return `Multiple 'left' distribution types are not allowed.`;
      }
      hasLeft = true;
    } else {
      const fixedAmount = parseFixedAmountDistribution(distribution);
      if (fixedAmount === null || !Number.isInteger(fixedAmount)) {
        return `Invalid distribution type for leg: ${leg.identifier}.`;
      }
      sum += BigInt(fixedAmount);
    }
  }

  if (hasLeft) {
    const remaining = total - sum;
    if (remaining < BigInt(0)) {
      return `Total distribution exceeds the specified amount.`;
    }
  } else if (sum !== total) {
    return `Total distribution sum (${sum}) does not equal the specified amount (${total}).`;
  }

  return null;
}

function validateDistributionLegsNumber(
  legs: MultipleSourcesT[],
  amount: number,
): string | null {
  return validateDistributionLegsWithDecimals(legs, amount);
}

function validateDistributionLegsWithDecimals(
  legs: MultipleSourcesT[],
  amount: number,
): string | null {
  let sum = 0;
  let hasLeft = false;

  for (const leg of legs) {
    if (hasPreciseDistribution(leg)) {
      const preciseValue = parsePreciseInteger(leg.precise_distribution!);
      if (preciseValue === null) {
        return `Invalid precise_distribution for leg: ${leg.identifier}.`;
      }
      if (preciseValue > BigInt(Number.MAX_SAFE_INTEGER)) {
        return `Invalid precise_distribution for leg: ${leg.identifier}.`;
      }
      sum += Number(preciseValue);
      continue;
    }

    const distribution = leg.distribution;
    if (!distribution || !IsValidString(distribution)) {
      return `Invalid distribution type for leg: ${leg.identifier}.`;
    }

    if (distribution.endsWith(`%`)) {
      const percentageValue = parsePercentageDistribution(distribution);
      if (percentageValue === null) {
        return `Invalid percentage value in leg: ${leg.identifier}.`;
      }
      sum += (percentageValue / 100) * amount;
    } else if (distribution === `left`) {
      if (hasLeft) {
        return `Multiple 'left' distribution types are not allowed.`;
      }
      hasLeft = true;
    } else {
      const fixedAmount = parseFixedAmountDistribution(distribution);
      if (fixedAmount === null) {
        return `Invalid distribution type for leg: ${leg.identifier}.`;
      }
      sum += fixedAmount;
    }
  }

  if (hasLeft) {
    const remaining = amount - sum;
    if (remaining < -DISTRIBUTION_SUM_EPSILON) {
      return `Total distribution exceeds the specified amount.`;
    }
  } else if (!distributionTotalsApproximatelyEqual(sum, amount)) {
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

  if (data.precise_amount !== undefined && data.precise_amount !== null) {
    const isValidPreciseAmount =
      typeof data.precise_amount === `number` ||
      typeof data.precise_amount === `string`;
    if (!isValidPreciseAmount) {
      return `precise_amount must be a string or number.`;
    }
    if (parsePreciseInteger(data.precise_amount) === null) {
      return `precise_amount must be a non-negative integer string or number.`;
    }
  }

  if (data.meta_data !== undefined && !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object if provided`;
  }

  const allowedFields = [`status`, `amount`, `precise_amount`, `meta_data`];
  for (const key in data) {
    if (!allowedFields.includes(key)) {
      return `Invalid field: ${key}`;
    }
  }

  return null;
}

export function ValidateRefundTransaction(
  data: RefundTransactionRequest,
): string | null {
  if (data.skip_queue !== undefined && typeof data.skip_queue !== `boolean`) {
    return `skip_queue must be a boolean if provided.`;
  }

  const allowedFields = [`skip_queue`];
  for (const key in data) {
    if (!allowedFields.includes(key)) {
      return `Invalid field: ${key}`;
    }
  }

  return null;
}

export function ValidateBulkCommitInflight(
  data: BulkCommitInflightRequest,
): string | null {
  if (!Array.isArray(data.transactions)) {
    return `Transactions must be an array.`;
  }

  if (data.transactions.length === 0) {
    return `Transactions array cannot be empty.`;
  }

  if (data.transactions.length > MAX_BULK_INFLIGHT_ITEMS) {
    return `Too many transactions; max is ${MAX_BULK_INFLIGHT_ITEMS}.`;
  }

  for (let i = 0; i < data.transactions.length; i++) {
    const item = data.transactions[i];

    if (
      typeof item.transaction_id !== `string` ||
      item.transaction_id.trim() === ``
    ) {
      return `transaction_id is required at index ${i}.`;
    }

    if (item.amount !== undefined && typeof item.amount !== `number`) {
      return `amount must be a number at index ${i}.`;
    }

    if (item.precise_amount !== undefined && item.precise_amount !== null) {
      const isValidPreciseAmount =
        typeof item.precise_amount === `number` ||
        typeof item.precise_amount === `string`;
      if (!isValidPreciseAmount) {
        return `precise_amount must be a string or number at index ${i}.`;
      }
      if (parsePreciseInteger(item.precise_amount) === null) {
        return `precise_amount must be a non-negative integer string or number at index ${i}.`;
      }
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

  if (data.skip_queue !== undefined && typeof data.skip_queue !== `boolean`) {
    return `skip_queue must be a boolean if provided.`;
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
