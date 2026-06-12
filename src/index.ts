import {ApiKeys} from "./blnk/endpoints/apiKeys";
import {BalanceMonitor} from "./blnk/endpoints/balanceMonitors";
import {Blnk} from "./blnk/endpoints/baseBlnkClient";
import {Hooks} from "./blnk/endpoints/hooks";
import {Identity} from "./blnk/endpoints/identity";
import {LedgerBalances} from "./blnk/endpoints/ledgerBalances";
import {Ledgers} from "./blnk/endpoints/ledgers";
import {Metadata} from "./blnk/endpoints/metadata";
import {Reconciliation} from "./blnk/endpoints/reconciliation";
import {Search} from "./blnk/endpoints/search";
import {System} from "./blnk/endpoints/system";
import {Transactions} from "./blnk/endpoints/transactions";
import {FormatResponse} from "./blnk/utils/httpClient";
import {CustomLogger} from "./blnk/utils/logger";
import {
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_TIMEOUT_MS,
} from "./blnk/constants/clientDefaults";
import {BlnkClientOptions} from "./types/blnkClient";
import {parseBlnkApiErrorBody} from "./types/errors";
//import {BlnkInitFn} from "./types/general";

// Export a function to initialize the SDK with default logger handling
export function BlnkInit(apiKey: string, options: BlnkClientOptions) {
  if (options.logger === undefined) {
    options.logger = CustomLogger;
  }
  return new Blnk(
    apiKey,
    options,
    {
      Ledgers,
      LedgerBalances,
      Transactions,
      BalanceMonitor,
      Reconciliation,
      Search,
      Identity,
      System,
      Metadata,
      Hooks,
      ApiKeys,
    },
    FormatResponse,
    globalThis.fetch,
  );
}
//module.exports = BlnkInit as BlnkInitFn & {default: BlnkInitFn};
export {
  DEFAULT_RETRY_COUNT,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_TIMEOUT_MS,
  parseBlnkApiErrorBody,
};
export type {BlnkApiErrorDetail} from "./types/errors";
//export default BlnkInit;
//# sourceMappingURL=index.d.ts.map
