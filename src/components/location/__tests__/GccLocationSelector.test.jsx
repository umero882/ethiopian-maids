import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GccLocationSelector from '@/components/location/GccLocationSelector';

// Mock AccessibilityContext to avoid matchMedia issues
vi.mock('@/contexts/AccessibilityContext', () => ({
  AccessibilityProvider: ({ children }) => children,
  useAccessibility: () => ({
    state: {
      highContrast: false,
      reducedMotion: false,
      keyboardNav: false,
      screenReader: false,
      fontSize: 'medium',
    },
    dispatch: vi.fn(),
  }),
}));

describe('GccLocationSelector', () => {
  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  it('allows selecting country, state and suburb with typeahead', async () => {
    const user = userEvent.setup();
    let latest;

    function Wrapper() {
      const [form, setForm] = React.useState({
        country: '',
        stateProvince: '',
        suburb: '',
        isoCountryCode: '',
      });
      const handleChange = (v) => {
        latest = v;
        setForm(v);
      };
      return (
        <GccLocationSelector
          country={form.country}
          stateProvince={form.stateProvince}
          suburb={form.suburb}
          isoCountryCode={form.isoCountryCode}
          onChange={handleChange}
          errors={{}}
        />
      );
    }

    render(
      <BrowserRouter>
        <Wrapper />
      </BrowserRouter>
    );

    // Open country combobox
    const countryButton = screen.getByRole('combobox', { name: /select country/i });
    await user.click(countryButton);

    // Search and choose UAE
    const search = screen.getByPlaceholderText(/search/i);
    await user.type(search, 'United Arab');
    const uae = await screen.findByText(/United Arab Emirates/i);
    await user.click(uae);

    // Country change should set ISO AE
    expect(latest.country).toBe('United Arab Emirates');
    expect(latest.isoCountryCode).toBe('AE');

    // Ensure trigger reflects the selected country before proceeding
    await within(countryButton).findByText(/United Arab Emirates/i);

    // Wait for state combobox to become available
    const stateButton = await screen.findByRole('combobox', { name: /select state/i });
    await user.click(stateButton);
    const dubai = await screen.findByText(/Dubai/i);
    await user.click(dubai);

    // Wait for suburb combobox to become available
    const suburbButton = await screen.findByRole('combobox', { name: /select suburb/i });
    await user.click(suburbButton);
    const deira = await screen.findByText(/Deira/i);
    await user.click(deira);

    // Verify final callback structure
    expect(latest).toEqual(
      expect.objectContaining({
        country: 'United Arab Emirates',
        stateProvince: 'Dubai',
        suburb: 'Deira',
        isoCountryCode: 'AE',
      })
    );
  });
});
