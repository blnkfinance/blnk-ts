import { BlnkLogger } from "../../../types/blnkClient";
import { ApiResponse, BlnkRequest, FormatResponseType, ServiceConstructor } from "../../../types/general";
import { CreateLedgerBalance, CreateLedgerBalanceResp } from "../../../types/ledgerBalances";

export class LedgerBalances {
    private request: BlnkRequest;
    private logger: BlnkLogger;
    private formatResponse: FormatResponseType;

    constructor(request: BlnkRequest, logger: BlnkLogger, formatResponse: FormatResponseType) {
        this.request = request;
        this.logger = logger;
        this.formatResponse = formatResponse;
    }

    /**
 * Asynchronously creates a ledger using the provided data.
 * 
 * @param data - The data object containing the ledger information to be created takes in a Generic type `T` for meta_data.
 * @returns A promise that resolves with the response data upon successful creation or an error response.
 */
    async create<T extends Record<string, any>>(data: CreateLedgerBalance<T>) {
        try {
            const response = await this.request<CreateLedgerBalance<T>, CreateLedgerBalanceResp<T>>('balances', data, "POST");

            return response;
        } catch (error: any) {
            this.logger.error(`${this.create.name}`, error);
            return this.formatResponse(500, error.message, null)
        }
    }

    async getBalance(id: string) {
        try {
            const response = await this.request(`balances/${id}`, undefined, 'GET');

            return response;
        } catch (error: any) {
            this.logger.error(`${this.create.name}`, error);
            return this.formatResponse(500, error.message, null);
        }
    }
}