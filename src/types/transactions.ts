import {Currency} from "./general";

export interface CreateTransactions<T extends Record<string, never>> {
  amount: number;
  precision: number;
  reference: string;
  description: string;
  currency: Currency;
  rate?: number;
  source?: string;
  sources?: MultipleSourcesT[];
  destinations?: MultipleSourcesT[];
  destination?: string;
  inflight?: boolean;
  inflight_expiry_date?: Date;
  scheduled_for?: Date;
  allow_overdraft?: boolean;
  meta_data?: T;
}

export type PryTransactionStatus = `QUEUED` | `APPLIED` | `REJECTED`;
export type InflightStatus = `INFLIGHT` | `COMMIT` | `VOID` | `EXPIRED`;
export type StatusType = PryTransactionStatus | InflightStatus;

export type CreateTransactionResponse<T extends Record<string, never>> = {
  transaction_id: string;
  amount: number;
  precision: number;
  precise_amount: number;
  reference: string;
  description: string;
  currency: Currency;
  status: StatusType;
  source?: string;
  destination?: string;
  sources?: MultipleSourcesT[];
  destinations?: MultipleSourcesT[];
  created_at: Date;
  meta_data?: T;
};

export type MultipleSourcesT = {
  identifier: string;
  distribution: Distribution;
  narration?: string;
};

export type Distribution = `${number}%` | `${number}` | `left`;

//we can only update transactions with COMMIT or VOID
//create function called commit, that takes in a transaction id and commits it
//do the same for void
//so transaction.commit(id), transaction.commitPartial(id,amount)
export type UpdateTransactionStatus<T extends Record<string, never>> = {
  status: InflightStatusWithoutInFlightAndExpired;
  amount?: number;
  meta_data?: T;
};

export type InflightStatusWithoutInFlightAndExpired = Exclude<
  InflightStatus,
  `INFLIGHT` | `EXPIRED`
>;
