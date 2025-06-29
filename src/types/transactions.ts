export interface CreateTransactions<T extends Record<string, unknown>> {
  amount: number;
  precision: number;
  reference: string;
  description: string;
  currency: string;
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

export type PryTransactionStatus =
  | `QUEUED`
  | `APPLIED`
  | `REJECTED`
  | `COMMIT`
  | `VOID`
  | `INFLIGHT`
  | `EXPIRED`;
export type InflightStatus = `commit` | `void`;
export type StatusType = PryTransactionStatus;

export type CreateTransactionResponse<T extends Record<string, unknown>> = {
  transaction_id: string;
  amount: number;
  precision: number;
  precise_amount: number;
  reference: string;
  description: string;
  rate: number;
  currency: string;
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
export type UpdateTransactionStatus<T extends Record<string, unknown>> = {
  status: InflightStatus;
  amount?: number;
  meta_data?: T;
};

export interface BulkTransactions<T extends Record<string, unknown>> {
  atomic?: boolean;
  inflight?: boolean;
  run_async?: boolean;
  transactions: CreateTransactions<T>[];
}

export interface BulkTransactionResponse<T extends Record<string, unknown>> {
  id: string;
  atomic: boolean;
  inflight: boolean;
  run_async: boolean;
  transactions: CreateTransactionResponse<T>[];
  created_at: Date;
}
