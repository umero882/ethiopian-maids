import React, { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import SingleSelect from '@/components/ui/single-select';
import { useGccLocations } from '@/hooks/useGccLocations';

/**
 * Props:
 *  - country, stateProvince, suburb, isoCountryCode
 *  - onChange: ({ country, isoCountryCode, stateProvince, suburb }) => void
 *  - errors: { country?: string, stateProvince?: string, suburb?: string }
 */
const GccLocationSelector = ({
  country = '',
  stateProvince = '',
  suburb = '',
  isoCountryCode = '',
  onChange,
  errors = {},
  overrides = null,
  allowOtherCountry = false,
}) => {
  const { getCountries, getIsoCode, getStates, getSuburbs, isValidCountry, defaultCountryForLocale } = useGccLocations(overrides);

  const [customSuburb, setCustomSuburb] = useState('');
  const isGccCountry = useMemo(() => isValidCountry(country), [country, isValidCountry]);

  const countries = useMemo(
    () => (allowOtherCountry ? [...getCountries(), 'Other'] : getCountries()),
    [getCountries, allowOtherCountry]
  );
  const states = useMemo(() => (country ? getStates(country) : []), [country, getStates]);
  const suburbs = useMemo(() => (country && stateProvince ? getSuburbs(country, stateProvince) : []), [country, stateProvince, getSuburbs]);

  // Default to UAE if locale indicates AE
  useEffect(() => {
    if (!country) {
      const def = defaultCountryForLocale();
      if (def) {
        const iso = getIsoCode(def);
        onChange?.({ country: def, isoCountryCode: iso, stateProvince: '', suburb: '' });
      }
    }
     
  }, []);

  const handleCountryChange = (val) => {
    if (val === 'Other') {
      onChange?.({ country: '', isoCountryCode: '', stateProvince: '', suburb: '' });
    } else {
      const iso = getIsoCode(val);
      onChange?.({ country: val, isoCountryCode: iso, stateProvince: '', suburb: '' });
    }
    setCustomSuburb('');
  };
  const handleStateChange = (val) => {
    onChange?.({ country, isoCountryCode: isoCountryCode || getIsoCode(country), stateProvince: val, suburb: '' });
    setCustomSuburb('');
  };
  const handleSuburbChange = (val) => {
    if (val === 'Other') {
      // keep suburb empty until user types
      onChange?.({ country, isoCountryCode, stateProvince, suburb: '' });
    } else {
      onChange?.({ country, isoCountryCode, stateProvince, suburb: val });
    }
  };

  const showCustomSuburb = suburb === '' && country && stateProvince && (suburbs.length === 0 || true);

  const selectedCountryValue = useMemo(() => {
    if (!country) return '';
    return isGccCountry ? country : (allowOtherCountry ? 'Other' : country);
  }, [country, isGccCountry, allowOtherCountry]);

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='space-y-2'>
        <Label htmlFor='loc-country' className='text-sm font-semibold text-gray-900'>
          Country <span className='text-red-500'>*</span>
        </Label>
        <SingleSelect
          id='loc-country'
          ariaLabel='Select Country'
          options={countries}
          value={selectedCountryValue}
          placeholder='Select country'
          onChange={handleCountryChange}
        />
        {errors.country && <p className='text-sm text-red-600'>{errors.country}</p>}

        {/* Free-text country when Other selected */}
        {allowOtherCountry && selectedCountryValue === 'Other' && (
          <div className='pt-1'>
            <Input
              id='loc-country-other'
              placeholder='Enter your country'
              value={country}
              onChange={(e) => {
                const val = e.target.value;
                onChange?.({ country: val, isoCountryCode: '', stateProvince: '', suburb: '' });
              }}
            />
          </div>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='loc-state' className='text-sm font-semibold text-gray-900'>
          State / Province <span className='text-red-500'>*</span>
        </Label>
        {isGccCountry ? (
          <SingleSelect
            id='loc-state'
            ariaLabel='Select State or Province'
            options={states}
            value={stateProvince}
            placeholder={country ? 'Select state / province' : 'Select country first'}
            disabled={!country}
            onChange={handleStateChange}
          />
        ) : (
          <Input
            id='loc-state'
            placeholder={country ? 'Enter state / province' : 'Select country first'}
            value={stateProvince}
            disabled={!country}
            onChange={(e) => onChange?.({ country, isoCountryCode, stateProvince: e.target.value, suburb: '' })}
          />
        )}
        {errors.stateProvince && <p className='text-sm text-red-600'>{errors.stateProvince}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='loc-suburb' className='text-sm font-semibold text-gray-900'>
          Suburb / City / District <span className='text-red-500'>*</span>
        </Label>
        {isGccCountry ? (
          <>
            <SingleSelect
              id='loc-suburb'
              ariaLabel='Select Suburb, City or District'
              options={[...suburbs, 'Other']}
              value={suburb || (suburbs.includes(suburb) ? suburb : '')}
              placeholder={stateProvince ? 'Select suburb / city / district' : 'Select state / province first'}
              disabled={!stateProvince}
              onChange={handleSuburbChange}
            />
            {/* Free-text fallback when Other selected or not in list */}
            {stateProvince && (
              <div className='pt-1'>
                <Input
                  id='loc-suburb-other'
                  placeholder='Enter suburb/city/district if not listed'
                  value={suburb && !suburbs.includes(suburb) ? suburb : customSuburb}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomSuburb(val);
                    onChange?.({ country, isoCountryCode, stateProvince, suburb: val });
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <Input
            id='loc-suburb'
            placeholder={stateProvince ? 'Enter suburb / city / district' : 'Enter state / province first'}
            value={suburb}
            disabled={!stateProvince}
            onChange={(e) => onChange?.({ country, isoCountryCode, stateProvince, suburb: e.target.value })}
          />
        )}
        {errors.suburb && <p className='text-sm text-red-600'>{errors.suburb}</p>}
      </div>
    </div>
  );
};

export default GccLocationSelector;
