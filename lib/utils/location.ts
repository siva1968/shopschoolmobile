import { State, City, Country } from 'country-state-city';

export interface LocationOption {
  value: string;
  label: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Get all states for a specific country as options for autocomplete
 * @param countryCode - The ISO code of the country (e.g., 'IN' for India, 'US' for United States)
 * @returns Array of state options with isoCode as value and name as label
 */
export const getStates = (countryCode: string): LocationOption[] => {
  if (!countryCode) return [];
  const states = State.getStatesOfCountry(countryCode.toUpperCase());
  return states.map(state => ({
    value: state.isoCode,
    label: state.name
  }));
};

/**
 * Get all cities for a specific state in a country
 * @param countryCode - The ISO code of the country (e.g., 'IN' for India, 'US' for United States)
 * @param stateCode - The ISO code of the state (e.g., 'MH' for Maharashtra)
 * @returns Array of city options with name as both value and label
 */
export const getCities = (countryCode: string, stateCode: string): LocationOption[] => {
  if (!countryCode || !stateCode) return [];
  const cities = City.getCitiesOfState(countryCode.toUpperCase(), stateCode);
  return cities.map(city => ({
    value: city.name,
    label: city.name
  }));
};

/**
 * Get state name from state code
 * @param stateCode - The ISO code of the state
 * @returns The full name of the state or the code if not found
 */
export const getStateName = (stateCode: string): string => {
  if (!stateCode) return '';
  const states = State.getStatesOfCountry('IN');
  const state = states.find(s => s.isoCode === stateCode);
  return state ? state.name : stateCode;
};

/**
 * Get state code from state name
 * @param stateName - The full name of the state
 * @returns The ISO code of the state or empty string if not found
 */
export const getStateCode = (stateName: string): string => {
  if (!stateName) return '';
  const states = State.getStatesOfCountry('IN');
  const state = states.find(s => s.name.toLowerCase() === stateName.toLowerCase());
  return state ? state.isoCode : '';
};

/**
 * Check if a city exists in a specific state
 * @param cityName - The name of the city
 * @param stateCode - The ISO code of the state
 * @returns True if the city exists in the state, false otherwise
 */
export const isCityInState = (cityName: string, stateCode: string): boolean => {
  if (!cityName || !stateCode) return false;
  const cities = City.getCitiesOfState('IN', stateCode);
  return cities.some(city => city.name.toLowerCase() === cityName.toLowerCase());
};

/**
 * Get all Indian cities (regardless of state) - useful for general city search
 * @returns Array of all city options in India
 */
export const getAllIndianCities = (): LocationOption[] => {
  const states = State.getStatesOfCountry('IN');
  const allCities: LocationOption[] = [];
  
  states.forEach(state => {
    const cities = City.getCitiesOfState('IN', state.isoCode);
    cities.forEach(city => {
      // Avoid duplicates by checking if city already exists
      if (!allCities.some(existingCity => existingCity.value === city.name)) {
        allCities.push({
          value: city.name,
          label: `${city.name}, ${state.name}`
        });
      }
    });
  });
  
  return allCities.sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Display utility functions for converting codes to human-readable names
 */

/**
 * Get country display name from country code
 * @param countryCode - The ISO code of the country (e.g., 'IN', 'US')
 * @returns The full name of the country or the code if not found
 */
export const getCountryDisplayName = (countryCode: string): string => {
  if (!countryCode) return '';
  
  // Handle common country codes
  if (countryCode.toLowerCase() === 'in') return 'India';
  if (countryCode.toLowerCase() === 'us') return 'United States';
  
  const country = Country.getCountryByCode(countryCode.toUpperCase());
  return country ? country.name : countryCode.toUpperCase();
};

/**
 * Get state display name from state code and country
 * @param stateCode - The ISO code of the state (e.g., 'TG', 'MH')
 * @param countryCode - The ISO code of the country (default: 'IN')
 * @returns The full name of the state or the code if not found
 */
export const getStateDisplayName = (stateCode: string, countryCode: string = 'IN'): string => {
  if (!stateCode) return '';
  
  const states = State.getStatesOfCountry(countryCode.toUpperCase());
  const state = states.find(s => s.isoCode.toLowerCase() === stateCode.toLowerCase());
  return state ? state.name : stateCode;
};

/**
 * Get city display name (validates if city exists in the given state)
 * @param cityName - The name of the city
 * @param stateCode - The ISO code of the state (optional, for validation)
 * @param countryCode - The ISO code of the country (default: 'IN')
 * @returns The proper case city name or original if not found
 */
export const getCityDisplayName = (cityName: string, stateCode?: string, countryCode: string = 'IN'): string => {
  if (!cityName) return '';
  
  // If state code is provided, validate the city exists in that state
  if (stateCode) {
    const cities = City.getCitiesOfState(countryCode.toUpperCase(), stateCode.toUpperCase());
    const city = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    return city ? city.name : cityName;
  }
  
  // Otherwise, just return proper case city name
  return cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
};

/**
 * Format complete address for display
 * @param address - Address object with city, province, country_code
 * @returns Formatted address string
 */
export const formatAddressForDisplay = (address: {
  city?: string;
  province?: string;
  country_code?: string;
  postal_code?: string;
}): string => {
  if (!address) return '';
  
  const city = address.city ? getCityDisplayName(address.city, address.province, address.country_code) : '';
  const state = address.province ? getStateDisplayName(address.province, address.country_code) : '';
  const country = address.country_code ? getCountryDisplayName(address.country_code) : '';
  const postalCode = address.postal_code || '';
  
  const parts: string[] = [];
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (postalCode) parts.push(`- ${postalCode}`);
  
  const locationPart = parts.join(', ');
  if (country && locationPart) {
    return `${locationPart}\n${country}`;
  }
  
  return locationPart || country || '';
};
