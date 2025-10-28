import { describe, it, expect, vi } from 'vitest';
import { useGccLocations } from '@/hooks/useGccLocations';

describe('useGccLocations', () => {
  it('exposes GCC countries and ISO codes', () => {
    const { getCountries, getIsoCode } = useGccLocations();
    const countries = getCountries();
    // Ensure all supported countries are present
    const expected = [
      'United Arab Emirates',
      'Saudi Arabia',
      'Qatar',
      'Kuwait',
      'Bahrain',
      'Oman',
    ];
    expected.forEach((c) => expect(countries).toContain(c));

    expect(getIsoCode('United Arab Emirates')).toBe('AE');
    expect(getIsoCode('Saudi Arabia')).toBe('SA');
    expect(getIsoCode('Qatar')).toBe('QA');
    expect(getIsoCode('Kuwait')).toBe('KW');
    expect(getIsoCode('Bahrain')).toBe('BH');
    expect(getIsoCode('Oman')).toBe('OM');
  });

  it('returns states and suburbs for UAE', () => {
    const { getStates, getSuburbs } = useGccLocations();
    const states = getStates('United Arab Emirates');
    expect(states).toContain('Dubai');
    const suburbs = getSuburbs('United Arab Emirates', 'Dubai');
    expect(suburbs).toContain('Deira');
    expect(suburbs).toContain('Dubai Marina');
  });
});

