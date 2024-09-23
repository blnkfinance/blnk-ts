import {Blnk} from "./blnk/endpoints/baseBlnkClient";
import {LedgerBalances} from "./blnk/endpoints/ledgerBalances";
import {Ledgers} from "./blnk/endpoints/ledgers";
import {Transactions} from "./blnk/endpoints/transactions";
import {FormatResponse} from "./blnk/utils/httpClient";
import {CustomLogger} from "./blnk/utils/logger";
import {BlnkClientOptions} from "./types/blnkClient";

// Export a function to initialize the SDK with default logger handling
export default function BlnkInit(apiKey: string, options: BlnkClientOptions) {
  if (options.logger === undefined) {
    options.logger = CustomLogger;
  }
  return new Blnk(
    apiKey,
    options,
    {Ledgers, LedgerBalances, Transactions},
    FormatResponse
  );
}

const b = BlnkInit(`ll`, {
  baseUrl: `ddd`,
  logger: console,
});

b.LedgerBalances.create<{d: string}>({
  currency: `USD`,
  ledger_id: `dd`,
  meta_data: {
    d: `ddd`,
  },
}).then(d => {
  d.data!.meta_data.d;
});