/**
 * Country Options Utility
 * Provides reusable country options for forms across the application
 */

export interface CountryOption {
  value: string | number;
  label: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Get country options for forms
 * Currently configured to show only India
 * Can be extended in the future to include more countries
 */
export const getCountryOptions = (): CountryOption[] => [
  { label: "India", value: "in" }
];

/**
 * Default country options array
 * @deprecated Use getCountryOptions() function instead for better consistency
 */
export const countryOptions: CountryOption[] = [
  { label: "India", value: "in" }
];

export default getCountryOptions;
