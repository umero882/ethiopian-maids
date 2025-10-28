import baseMap from '@/data/gccLocations.json';

// Shallow merge helper for country/state arrays
const mergeMaps = (base, overrides) => {
  if (!overrides) return base;
  const result = JSON.parse(JSON.stringify(base));
  for (const [country, cfg] of Object.entries(overrides)) {
    if (!result[country]) {
      result[country] = cfg;
      continue;
    }
    // merge iso
    if (cfg.iso) result[country].iso = cfg.iso;
    // merge states
    if (cfg.states) {
      result[country].states = result[country].states || {};
      for (const [state, suburbs] of Object.entries(cfg.states)) {
        if (!result[country].states[state]) {
          result[country].states[state] = suburbs.slice();
        } else {
          // merge unique values keeping order from base, then extras
          const set = new Set(result[country].states[state]);
          for (const s of suburbs) if (!set.has(s)) result[country].states[state].push(s);
        }
      }
    }
  }
  return result;
};

export function useGccLocations(overrides = null) {
  const map = mergeMaps(baseMap, overrides);

  const getCountries = () => Object.keys(map);
  const getIsoCode = (country) => (map[country]?.iso) || '';
  const getStates = (country) => Object.keys(map[country]?.states || {});
  const getSuburbs = (country, state) => {
    const list = map[country]?.states?.[state] || [];
    return list;
  };
  const isValidCountry = (country) => !!map[country];
  const isValidState = (country, state) => getStates(country).includes(state);
  const isValidSuburb = (country, state, suburb) => {
    const list = getSuburbs(country, state);
    // allow free text if not found (used when "Other" is chosen in UI)
    return typeof suburb === 'string' && suburb.trim().length > 0 && (list.includes(suburb) || true);
  };
  const defaultCountryForLocale = () => {
    try {
      const lang = typeof navigator !== 'undefined' ? (navigator.language || navigator.languages?.[0] || '') : '';
      // If locale suggests AE, default to UAE
      if (/(-|_)AE$/i.test(lang) || /\bAE\b/i.test(lang)) return 'United Arab Emirates';
    } catch (e) {
      console.warn('useGccLocations: locale detection failed');
    }
    return '';
  };

  return {
    map,
    getCountries,
    getIsoCode,
    getStates,
    getSuburbs,
    isValidCountry,
    isValidState,
    isValidSuburb,
    defaultCountryForLocale,
  };
}
