// Curated list of primary countries where domestic helpers typically originate from
export const originCountries = [
  { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬' },
  { name: 'Tanzania', code: 'TZ', flag: '🇹🇿' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
  { name: 'India', code: 'IN', flag: '🇮🇳' },
];

// GCC (Gulf Cooperation Council) countries where domestic helpers are typically employed
export const destinationCountries = [
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭' },
  { name: 'Oman', code: 'OM', flag: '🇴🇲' },
];

// Special option for custom input
export const OTHERS_OPTION = {
  name: 'Others',
  code: 'OTHER',
  flag: '🌍',
  isCustom: true,
};

// Combined lists with Others option
export const nationalityOptions = [...originCountries, OTHERS_OPTION];
export const countryOptions = [...destinationCountries, OTHERS_OPTION];

// Helper function to check if a value is the "Others" option
export const isOthersOption = (value) => {
  return value === OTHERS_OPTION.name || value === 'Others';
};

// Helper function to get country by name
export const getCountryByName = (name, list) => {
  return list.find((country) => country.name === name);
};

// Helper function to format country display with flag
export const formatCountryDisplay = (country) => {
  if (!country) return '';
  return `${country.flag} ${country.name}`;
};
