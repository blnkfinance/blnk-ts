import { BlnkLogger } from "../../../types/blnkClient";
import { BlnkRequest, FormatResponseType } from "../../../types/general";
import { CreateTransactionResponse, CreateTransactions } from "../../../types/transactions";

export class Transactions {
    private request: BlnkRequest;
    private logger: BlnkLogger;
    private formatResponse: FormatResponseType;

    constructor(request: BlnkRequest, logger: BlnkLogger, formatResponse: FormatResponseType) {
        this.request = request;
        this.logger = logger;
        this.formatResponse = formatResponse;
    }

    async create<T extends Record<string, any>>(data: CreateTransactions<T>){
        try {
            const response = await this.request<CreateTransactions<T>, CreateTransactionResponse<T>>(`ledgers`, data, "POST");

            if (response.data === null) {
              // Handle the error case
              this.logger.error("error heree")
              return response;
            }
      
            return response
        } catch (error: any) {
            this.logger.error(`${this.create.name}`, error);
            return this.formatResponse(500, error.message, undefined)   
        }
    }
}