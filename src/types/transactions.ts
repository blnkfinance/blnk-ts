import { Currency, SourceWithAt } from './general';

export interface CreateTransactions<T extends Record<string, any>> {
    amount: number;
    precision: number;
    reference: string;
    description: string;
    currency: Currency;
    source: SourceWithAt;
    destination: string;
    inflight?: boolean;
    scheduled_for?: string;
    allow_overdraft?: boolean;
    meta_data?: T;
}

export interface CreateTransactionResponse <T extends Record<string, any>>{
    transaction_id: string;
    amount: number;
    precision: number;
    precise_amount: number;
    reference: string;
    description: string;
    currency: Currency;
    status: PryTransactionStatus & InflightStatus;//this should be replaced with string types like INFLIGHT etc
    source: SourceWithAt;
    destination: string;
    created_at: string;
    meta_data?: T;
}

export type PryTransactionStatus = 'QUEUED' | 'APPLIED' | 'REJECTED';
export type InflightStatus = 'INFLIGHT' | 'COMMIT' | 'VOID' | 'EXPIRED';
//we can only update transactions with COMMIT or VOID
//create function called commit, that takes in a transaction id and commits it
//do the same for void
//so transaction.commit(id), transaction.commitPartial(id,amount)
