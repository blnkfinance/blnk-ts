export interface BlnkClientOptions {
  baseUrl: string; // Required
  timeout?: number; // Optional HTTP timeout in ms (default 3000)
  logger?: BlnkLogger;
}

export interface BlnkLogger {
  info(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
  debug?(message: string, ...meta: unknown[]): void; // Optional for more detailed logs
}

/** Platform fetch (Node 18+ global `fetch`). */
export type FetchType = typeof fetch;
