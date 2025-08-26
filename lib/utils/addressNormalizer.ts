/**
 * Address normalization utilities for form prefilling and payload preparation
 * Handles conversion between backend response format and frontend form values
 */

import { getStates, getCities, getAllIndianCities } from './location';
import { getCountryOptions } from './countryOptions';

// Import Address type from the file where it's defined
interface Address {
  id: string;
  address_name?: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
  company?: string | null;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string | null;
  city: string;
  country_code: string;
  province: string;
  postal_code: string;
  phone?: string | null;
  email?: string | null;
  customer_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

interface AddressFormData {
  address_name: string;
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  province: string;
  country_code: string;
  postal_code: string;
  phone: string;
}

export interface AddressResponse {
  id: string;
  address_name?: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
  company?: string | null;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string | null;
  city: string;
  country_code: string;
  province: string;
  postal_code: string;
  phone?: string | null;
  email?: string | null;
  customer_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface NormalizedAddressForm {
  address_name: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  province: string;
  country_code: string;
  postal_code: string;
  phone: string;
}

/**
 * Find country option value from country code
 * @param countryCode - Country code from backend (e.g., "in")
 * @returns Matching country option value or default
 */
export const findCountryValue = (countryCode: string): string => {
  const countryOptions = getCountryOptions();
  const normalizedCode = countryCode.toLowerCase();
  
  const country = countryOptions.find(option => 
    option.value.toString().toLowerCase() === normalizedCode
  );
  
  return country ? country.value.toString() : 'in'; // Default to India
};

/**
 * Find state/province option value from province code
 * @param provinceCode - Province code from backend (e.g., "tg")
 * @param countryCode - Country code to get correct state list
 * @returns Matching state option value or empty string
 */
export const findStateValue = (provinceCode: string, countryCode: string = 'in'): string => {
  if (!provinceCode) return '';
  
  const stateOptions = getStates(countryCode);
  const normalizedCode = provinceCode.toLowerCase();
  
  // Try exact match first
  let state = stateOptions.find(option => 
    option.value.toString().toLowerCase() === normalizedCode
  );
  
  // If no exact match, try by label (case-insensitive)
  if (!state) {
    state = stateOptions.find(option => 
      option.label.toLowerCase().includes(normalizedCode) ||
      normalizedCode.includes(option.label.toLowerCase())
    );
  }
  
  return state ? state.value.toString() : '';
};

/**
 * Find city option value from city name
 * @param cityName - City name from backend (e.g., "hyderabad")
 * @param countryCode - Country code to get correct city list
 * @param provinceCode - Province code to get correct city list
 * @returns Matching city option value or empty string
 */
export const findCityValue = (cityName: string, countryCode: string, provinceCode: string): string => {
  if (!cityName || !countryCode || !provinceCode) {
    return '';
  }

  const cityOptions = getCities(countryCode, provinceCode);
  
  const normalizedName = cityName.toLowerCase().trim();
  
  // First try exact match (case-insensitive)
  const exactMatch = cityOptions.find(option => 
    option.value.toLowerCase() === normalizedName
  );
  
  if (exactMatch) {
    return exactMatch.value;
  }

  // If no exact match, try partial match
  const partialMatch = cityOptions.find(option => 
    option.value.toLowerCase().includes(normalizedName) || 
    normalizedName.includes(option.value.toLowerCase())
  );
  
  const result = partialMatch ? partialMatch.value : '';
  return result;
};

/**
 * Normalize address response for form prefilling
 * @param address - Address response from backend
 * @param fallbackPhone - Fallback phone number if address doesn't have one
 * @returns Normalized form data
 */
export const normalizeAddressForForm = (address: Address, defaultPhone: string = ''): AddressFormData => {
  const countryValue = findCountryValue(address.country_code || '');
  const stateValue = findStateValue(address.province || '', countryValue);
  
  let cityValue = '';
  
  // Try with normalized state first
  if (stateValue) {
    cityValue = findCityValue(address.city || '', countryValue, stateValue);
  }
  
  // If no city found with normalized state, try with backend province directly
  if (!cityValue && address.province) {
    cityValue = findCityValue(address.city || '', countryValue, address.province);
  }
  
  // Final fallback: search all cities in the country
  if (!cityValue && address.city) {
    const allCitiesForCountry = getAllIndianCities();
    
    const normalizedCityName = address.city.toLowerCase().trim();
    const fallbackCity = allCitiesForCountry.find(city => 
      city.value.toLowerCase() === normalizedCityName ||
      city.value.toLowerCase().includes(normalizedCityName) ||
      normalizedCityName.includes(city.value.toLowerCase())
    );
    
    cityValue = fallbackCity ? fallbackCity.value : address.city;
  }

  const result: AddressFormData = {
    address_name: address.address_name || '',
    first_name: address.first_name || '',
    last_name: address.last_name || '',
    company: address.company || '',
    address_1: address.address_1 || '',
    address_2: address.address_2 || '',
    city: cityValue || address.city || '',
    country_code: countryValue,
    province: stateValue || address.province || '',
    postal_code: address.postal_code || '',
    phone: address.phone || defaultPhone,
  };
  
  return result;
};

/**
 * Prepare address form data for backend payload
 * @param formData - Form data from frontend
 * @param additionalData - Additional data like is_default_billing etc.
 * @returns Payload ready for backend API
 */
export const prepareAddressPayload = (
  formData: NormalizedAddressForm,
  additionalData: {
    is_default_billing?: boolean;
    is_default_shipping?: boolean;
    cart_billing_address_id?: string;
    cart_shipping_address_id?: string;
    [key: string]: string | boolean | number | undefined;
  } = {}
) => {
  return {
    address_name: formData.address_name,
    first_name: formData.first_name,
    last_name: formData.last_name,
    address_1: formData.address_1,
    address_2: formData.address_2,
    city: formData.city.toLowerCase(), // Send city in lowercase
    province: formData.province.toLowerCase(), // Send province in lowercase
    country_code: formData.country_code.toLowerCase(), // Send country in lowercase
    postal_code: formData.postal_code,
    phone: formData.phone,
    ...additionalData
  };
};

/**
 * Validate if address has all required location fields
 * @param address - Address to validate
 * @returns Object with validation results
 */
export const validateAddressLocation = (address: AddressResponse) => {
  const countryValid = !!findCountryValue(address.country_code);
  const stateValid = !!findStateValue(address.province, address.country_code);
  const cityValid = !!findCityValue(address.city, address.country_code, address.province);
  
  return {
    isValid: countryValid && stateValid && cityValid,
    country: countryValid,
    state: stateValid,
    city: cityValid,
    issues: {
      ...(countryValid ? {} : { country: `Unknown country code: ${address.country_code}` }),
      ...(stateValid ? {} : { state: `Unknown state code: ${address.province}` }),
      ...(cityValid ? {} : { city: `Unknown city: ${address.city}` })
    }
  };
};
