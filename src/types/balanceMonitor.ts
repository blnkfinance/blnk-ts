export interface MonitorCondition {
  field: string;
  operator: MonitorConditionOperators;
  /**
   * Threshold in major units. Core stores `precise_value = value × precision`,
   * so $100 at precision 100 is `value: 100`, not `10000`.
   */
  value: number;
  precision: number;
}

export type MonitorConditionOperators = `>` | `<` | `=` | `!=` | `>=` | `<=`;

/**
 * When a monitor fires (Core 0.15.7+).
 *
 * - `edge` (Core's default): alerts once when the condition goes from false
 *   to true, then re-arms after it goes false again.
 * - `level`: alerts on every transaction while the condition holds.
 */
export type MonitorTrigger = `edge` | `level`;

export interface MonitorData {
  condition: MonitorCondition;
  description?: string;
  balance_id: string;
  call_back_url?: string;
  /** `edge` or `level`. Omit to use Core's default, `edge`. */
  trigger?: MonitorTrigger;
}

/** A monitor condition as Core returns it. */
export interface MonitorConditionResp extends MonitorCondition {
  /**
   * `value × precision` in minor units, computed by Core. Can exceed
   * `Number.MAX_SAFE_INTEGER` for large thresholds.
   */
  precise_value?: number | string;
}

export interface MonitorDataResp extends MonitorData {
  monitor_id: string;
  created_at: string; // ISO date string
  condition: MonitorConditionResp;
  /** The stored trigger mode. */
  trigger?: MonitorTrigger;
  /**
   * The last observed truth value of the condition, used by `edge` monitors.
   * Omitted until the monitor has been evaluated.
   */
  condition_state?: boolean;
}

/** Condition fields to change in `BalanceMonitor.updatePartial`. */
export interface UpdateMonitorCondition {
  field?: string;
  operator?: MonitorConditionOperators;
  /**
   * New threshold in major units. `0` moves the threshold to zero; omit it to
   * keep the stored threshold.
   */
  value?: number;
  /**
   * New precision. Core ignores a precision change unless `value` is sent
   * with it, and reports that with `precision_unchanged: true`.
   */
  precision?: number;
}

/**
 * Request body for `PUT /balance-monitors/{id}` (Core 0.15.9+). Core keeps
 * every field the request leaves out, so set only the fields to change.
 *
 * There is no `call_back_url`: Core ignores it on update.
 */
export interface UpdateMonitorRequest {
  /** Moves the monitor to another balance. */
  balance_id?: string;
  /** `""` clears the description. */
  description?: string;
  trigger?: MonitorTrigger;
  condition?: UpdateMonitorCondition;
}

/** Response from `PUT /balance-monitors/{id}`. */
export interface UpdateMonitorResp {
  message: string;
  /**
   * True when `condition.precision` was sent without `condition.value`, so
   * Core kept the stored precision.
   */
  precision_unchanged?: boolean;
}

export interface DeleteBalanceMonitorResp {
  message: string;
}
