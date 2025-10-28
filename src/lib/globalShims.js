// Global shims for legacy references in debug pages or older code
// Avoids ReferenceError when some scripts expect globals.
import gccMap from '@/data/gccLocations.json';

try {
  if (typeof window !== 'undefined') {
    if (typeof window.gccCountries === 'undefined') {
      window.gccCountries = Object.keys(gccMap);
    }
    if (typeof window.gccIsoCodes === 'undefined') {
      window.gccIsoCodes = Object.fromEntries(
        Object.entries(gccMap).map(([name, cfg]) => [name, cfg?.iso || ''])
      );
    }
  }
} catch (e) {
  // Silently ignore in non-browser environments
}

