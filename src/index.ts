import {BalanceMonitor} from "./blnk/endpoints/balanceMonitors";
import {Blnk} from "./blnk/endpoints/baseBlnkClient";
import {LedgerBalances} from "./blnk/endpoints/ledgerBalances";
import {Ledgers} from "./blnk/endpoints/ledgers";
import {Reconciliation} from "./blnk/endpoints/reconciliation";
import {Search} from "./blnk/endpoints/search";
import {Transactions} from "./blnk/endpoints/transactions";
import {FormatResponse} from "./blnk/utils/httpClient";
import {CustomLogger} from "./blnk/utils/logger";
import {BlnkClientOptions} from "./types/blnkClient";
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
    },
    FormatResponse,
    fetch
  );
}
//module.exports = BlnkInit as BlnkInitFn & {default: BlnkInitFn};
//export default BlnkInit;
//# sourceMappingURL=index.d.ts.map
