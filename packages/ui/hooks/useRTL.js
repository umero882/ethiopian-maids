/**
 * useRTL Hook
 *
 * Provides RTL-aware utilities for components.
 */

import { useMemo } from 'react';

export function useRTL(direction = 'ltr') {
  return useMemo(() => {
    const isRTL = direction === 'rtl';

    return {
      isRTL,
      dir: direction,

      // Logical properties helpers
      start: isRTL ? 'right' : 'left',
      end: isRTL ? 'left' : 'right',

      // Margin helpers
      marginStart: (value) => ({
        [isRTL ? 'marginRight' : 'marginLeft']: value,
      }),
      marginEnd: (value) => ({
        [isRTL ? 'marginLeft' : 'marginRight']: value,
      }),

      // Padding helpers
      paddingStart: (value) => ({
        [isRTL ? 'paddingRight' : 'paddingLeft']: value,
      }),
      paddingEnd: (value) => ({
        [isRTL ? 'paddingLeft' : 'paddingRight']: value,
      }),

      // Transform helpers
      flipX: (value) => isRTL ? -value : value,

      // Class name helper
      rtlClass: (baseClass, rtlClass) => isRTL ? rtlClass : baseClass,
    };
  }, [direction]);
}
