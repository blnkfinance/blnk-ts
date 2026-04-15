import {ApiResponse} from "../../types/general";
import {ToCamelCase} from "./stringUtils";

/**
 * Maps the response object to a new object based on the specified fields to keep.
 *
 * @param response The input response object to map.
 * @param keepFields An array of keys representing the fields to keep in the mapped object.
 * @returns The mapped object with only the specified fields.
 */
export function MapResponse<
  TInput extends Record<string, unknown>,
  TOutput extends Record<string, unknown>,
>(response: TInput, keepFields: (keyof TInput)[]): TOutput {
  const result = {} as Record<string, unknown>; // Use a generic object first

  Object.keys(response).forEach(key => {
    const newKey = keepFields.includes(key as keyof TInput)
      ? key
      : ToCamelCase(key);
    result[newKey] = response[key as keyof TInput];
  });

  return result as TOutput; // Cast it to TOutput at the end
}

export function FormatResponse<T>(
  status: number,
  message: string,
  data: T,
): ApiResponse<T> {
  return {status, message, data};
}
