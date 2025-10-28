import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';

// Main search hook with advanced filtering capabilities
export const useSearch = (data = [], options = {}) => {
  const {
    searchFields = [],
    initialQuery = '',
    debounceMs = 300,
    caseSensitive = false,
    exactMatch = false,
    highlightMatches = false,
    filters = {},
    sortConfig = null,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [activeFilters, setActiveFilters] = useState(filters);
  const [sortBy, setSortBy] = useState(sortConfig);

  const debouncedQuery = useDebounce(query, debounceMs);

  // Search function
  const searchItems = useCallback((items, searchQuery) => {
    if (!searchQuery.trim()) return items;

    const searchTerm = caseSensitive ? searchQuery : searchQuery.toLowerCase();

    return items.filter(item => {
      // If searchFields is specified, only search those fields
      if (searchFields.length > 0) {
        return searchFields.some(field => {
          const value = getNestedValue(item, field);
          const stringValue = String(value || '');
          const searchIn = caseSensitive ? stringValue : stringValue.toLowerCase();

          return exactMatch
            ? searchIn === searchTerm
            : searchIn.includes(searchTerm);
        });
      }

      // Otherwise search all string fields
      return Object.values(item).some(value => {
        if (typeof value !== 'string' && typeof value !== 'number') return false;
        const stringValue = String(value);
        const searchIn = caseSensitive ? stringValue : stringValue.toLowerCase();

        return exactMatch
          ? searchIn === searchTerm
          : searchIn.includes(searchTerm);
      });
    });
  }, [searchFields, caseSensitive, exactMatch]);

  // Filter function
  const filterItems = useCallback((items, filters) => {
    return items.filter(item => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue) return true;

        const itemValue = getNestedValue(item, key);

        if (typeof filterValue === 'function') {
          return filterValue(itemValue, item);
        }

        if (Array.isArray(filterValue)) {
          return filterValue.includes(itemValue);
        }

        if (typeof filterValue === 'object' && filterValue !== null) {
          // Range filter
          if (filterValue.min !== undefined || filterValue.max !== undefined) {
            const numValue = Number(itemValue);
            const min = filterValue.min !== undefined ? Number(filterValue.min) : -Infinity;
            const max = filterValue.max !== undefined ? Number(filterValue.max) : Infinity;
            return numValue >= min && numValue <= max;
          }

          // Date range filter
          if (filterValue.startDate || filterValue.endDate) {
            const itemDate = new Date(itemValue);
            const startDate = filterValue.startDate ? new Date(filterValue.startDate) : new Date(0);
            const endDate = filterValue.endDate ? new Date(filterValue.endDate) : new Date();
            return itemDate >= startDate && itemDate <= endDate;
          }
        }

        // String contains filter
        const searchIn = caseSensitive ? String(itemValue) : String(itemValue).toLowerCase();
        const filterIn = caseSensitive ? String(filterValue) : String(filterValue).toLowerCase();
        return searchIn.includes(filterIn);
      });
    });
  }, [caseSensitive]);

  // Sort function
  const sortItems = useCallback((items, sortConfig) => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);

      let comparison = 0;

      if (sortConfig.type === 'number') {
        comparison = Number(aValue || 0) - Number(bValue || 0);
      } else if (sortConfig.type === 'date') {
        comparison = new Date(aValue || 0) - new Date(bValue || 0);
      } else {
        // String comparison
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, []);

  // Highlight matches function
  const highlightText = useCallback((text, query) => {
    if (!highlightMatches || !query.trim()) return text;

    const searchTerm = caseSensitive ? query : query.toLowerCase();
    const textToSearch = caseSensitive ? text : text.toLowerCase();
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, caseSensitive ? 'g' : 'gi');

    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }, [highlightMatches, caseSensitive]);

  // Process data through search, filter, and sort pipeline
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters first
    if (Object.keys(activeFilters).length > 0) {
      result = filterItems(result, activeFilters);
    }

    // Then search
    if (debouncedQuery) {
      result = searchItems(result, debouncedQuery);
    }

    // Finally sort
    if (sortBy) {
      result = sortItems(result, sortBy);
    }

    return result;
  }, [data, debouncedQuery, activeFilters, sortBy, searchItems, filterItems, sortItems]);

  // Update functions
  const updateQuery = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateSort = useCallback((field, direction = 'asc', type = 'string') => {
    setSortBy({ field, direction, type });
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const clearSort = useCallback(() => {
    setSortBy(null);
  }, []);

  const clearAll = useCallback(() => {
    setQuery('');
    setActiveFilters({});
    setSortBy(null);
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: data.length,
    filtered: processedData.length,
    hasQuery: Boolean(debouncedQuery),
    hasFilters: Object.keys(activeFilters).length > 0,
    hasSort: Boolean(sortBy),
  }), [data.length, processedData.length, debouncedQuery, activeFilters, sortBy]);

  return {
    // Current state
    query,
    debouncedQuery,
    activeFilters,
    sortBy,

    // Processed data
    results: processedData,

    // Update functions
    updateQuery,
    updateFilters,
    updateSort,

    // Clear functions
    clearSearch,
    clearFilters,
    clearSort,
    clearAll,

    // Utilities
    highlightText,
    stats,
  };
};

// Specialized hooks
export const useSimpleSearch = (data, searchFields, debounceMs = 300) => {
  return useSearch(data, { searchFields, debounceMs });
};

export const useFuzzySearch = (data, options = {}) => {
  const { threshold = 0.3 } = options;

  return useSearch(data, {
    ...options,
    exactMatch: false,
    caseSensitive: false,
  });
};

// Hook for search with categories/facets
export const useFacetedSearch = (data, facetConfig = {}) => {
  const [selectedFacets, setSelectedFacets] = useState({});

  const searchHook = useSearch(data, {
    filters: selectedFacets,
  });

  // Calculate facet counts
  const facets = useMemo(() => {
    const result = {};

    Object.entries(facetConfig).forEach(([facetKey, config]) => {
      result[facetKey] = {};

      data.forEach(item => {
        const value = getNestedValue(item, config.field);
        if (value !== undefined && value !== null) {
          const displayValue = config.formatter ? config.formatter(value) : String(value);
          result[facetKey][value] = result[facetKey][value] || {
            value,
            displayValue,
            count: 0
          };
          result[facetKey][value].count++;
        }
      });

      // Convert to array and sort
      result[facetKey] = Object.values(result[facetKey]).sort((a, b) => {
        if (config.sortBy === 'count') return b.count - a.count;
        return a.displayValue.localeCompare(b.displayValue);
      });
    });

    return result;
  }, [data, facetConfig]);

  const toggleFacet = useCallback((facetKey, value) => {
    setSelectedFacets(prev => {
      const currentValues = prev[facetKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [facetKey]: newValues.length > 0 ? newValues : undefined,
      };
    });
  }, []);

  const clearFacet = useCallback((facetKey) => {
    setSelectedFacets(prev => {
      const { [facetKey]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    ...searchHook,
    facets,
    selectedFacets,
    toggleFacet,
    clearFacet,
  };
};

// Utility functions
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// (debounce hook moved to separate './useDebounce')
