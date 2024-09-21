export interface BlnkClientOptions {
  baseUrl: string; // Required
  timeout?: number; // Optional, default to a reasonable value like 30 seconds
  headers?: Record<string, string>; // Optional headers, like 'User-Agent'
  logger: BlnkLogger;
}

export interface BlnkLogger {
  info(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
  debug?(message: string, ...meta: unknown[]): void; // Optional for more detailed logs
}
