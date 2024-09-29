// Utility function to convert snake_case to camelCase
export const ToCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
};

export const IsValidString = (val: string) => typeof val === `string`;

export const IsValidNumber = (val: number) => typeof val === `number`;

export const IsValidArray = <T>(val: T[]) => Array.isArray(val);
