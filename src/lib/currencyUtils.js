// GCC Countries Currency Map (Platform is intended for GCC countries only)
export const countryCurrencyMap = {
  UAE: { currency: 'AED', symbol: 'AED', range: [1500, 4000] },
  'Saudi Arabia': { currency: 'SAR', symbol: 'SAR', range: [1500, 4000] },
  Qatar: { currency: 'QAR', symbol: 'QAR', range: [1500, 4000] },
  Kuwait: { currency: 'KWD', symbol: 'KWD', range: [150, 400] },
  Bahrain: { currency: 'BHD', symbol: 'BHD', range: [150, 500] },
  Oman: { currency: 'OMR', symbol: 'OMR', range: [150, 500] },
  Default: { currency: 'USD', symbol: '$', range: [500, 1500] },
};

// GCC Currency Codes to Symbols (Platform is intended for GCC countries only)
const currencySymbolMap = {
  AED: 'AED',  // UAE Dirham
  SAR: 'SAR',  // Saudi Riyal
  QAR: 'QAR',  // Qatari Riyal
  KWD: 'KWD',  // Kuwaiti Dinar
  BHD: 'BHD',  // Bahraini Dinar
  OMR: 'OMR',  // Omani Rial
  USD: '$',    // US Dollar (fallback)
};

export const getSalaryString = (
  originCountry,
  salaryRangeString,
  displayCountry = null,
  currency = null
) => {
  // If currency is provided, use it directly
  let symbol;
  let countryData;

  if (currency && currencySymbolMap[currency]) {
    symbol = currencySymbolMap[currency];
  } else {
    // Fallback to country-based lookup
    const targetCountryForCurrency = displayCountry || originCountry;
    countryData =
      countryCurrencyMap[targetCountryForCurrency] ||
      countryCurrencyMap[originCountry] ||
      countryCurrencyMap['Default'];
    symbol = countryData.symbol;
  }

  if (salaryRangeString) {
    const parts = salaryRangeString
      .toString()
      .replace(/[^\d-]/g, '')
      .split('-');
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${symbol}${parts[0]} - ${symbol}${parts[1]}`;
    } else if (parts.length === 1 && parts[0]) {
      return `${symbol}${parts[0]}`;
    }
  }

  // Fallback: use countryData if available, otherwise use default range
  if (!countryData) {
    countryData = countryCurrencyMap['Default'];
  }
  return `${symbol}${countryData.range[0]} - ${symbol}${countryData.range[1]}`;
};

export const getCurrencySymbol = (country) => {
  const countryData =
    countryCurrencyMap[country] || countryCurrencyMap['Default'];
  return countryData.symbol;
};
