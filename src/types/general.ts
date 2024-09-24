import {BlnkLogger} from "./blnkClient";

export type BlnkRequest = <T, R>(
  endpoint: string,
  data: T,
  method: `POST` | `GET` | `PUT` | `DELETE`,
  headerOptions?: Record<string, string>
) => Promise<ApiResponse<R | null>>;

export interface ServiceConstructor {
  new (
    request: BlnkRequest,
    logger: BlnkLogger,
    formatResponse: FormatResponseType
  ): unknown;
}

export interface ServicesMap {
  [key: string]: ServiceConstructor;
}

export interface ServiceInstances {
  [key: string]: InstanceType<ServiceConstructor>;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface ApiResponseError {
  error: string;
}

export type FormatResponseType = <T>(
  status: number,
  message: string,
  data: T
) => ApiResponse<T>;

export type Currency = `USD`;

export type SourceWithAt = `@${string}`;

export type GenericMetaData<T extends Record<string, unknown>> = T;

export type HandleErrorType = (
  error: unknown,
  logger: BlnkLogger,
  formatResponse: FormatResponseType
) => ApiResponse<null>;
