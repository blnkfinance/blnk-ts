// Utility function to convert snake_case to camelCase
export const ToCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
};
