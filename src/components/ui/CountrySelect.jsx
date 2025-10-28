import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Country Select Component
 * Features: Search functionality, flags, GCC countries highlighted, responsive design
 */
const CountrySelect = ({
  countries = [],
  value = '',
  onChange,
  placeholder = 'Select Country',
  className = '',
  disabled = false,
  isLoading = false,
  showFlags = true,
  highlightGCC = true,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);


  // Filter countries based on search term
  const filteredCountries = (countries || []).filter(country =>
    country?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country?.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group countries: GCC first, then others
  const groupedCountries = React.useMemo(() => {
    if (!highlightGCC) return filteredCountries;

    const gccCountries = filteredCountries.filter(country => country?.is_gcc);
    const otherCountries = filteredCountries.filter(country => !country?.is_gcc);

    return [...gccCountries, ...otherCountries];
  }, [filteredCountries, highlightGCC]);

  const selectedCountry = countries.find(country => country.name === value);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev =>
          prev < groupedCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : groupedCountries.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && groupedCountries[focusedIndex]) {
          handleSelect(groupedCountries[focusedIndex]);
        }
        break;
    }
  };

  const handleSelect = (country) => {
    onChange(country.name);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleToggle = () => {
    if (disabled || isLoading) return;
    setIsOpen(!isOpen);
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Main Select Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          relative w-full pl-10 pr-10 py-2.5
          bg-white/10 border border-white/20 rounded-md
          text-left text-white
          hover:bg-white/15 hover:border-white/30
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${isOpen ? 'border-purple-500 bg-white/15' : ''}
        `}
      >
        {/* Map Pin Icon */}
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

        {/* Selected Value */}
        <span className="block truncate">
          {isLoading ? (
            'Loading countries...'
          ) : selectedCountry ? (
            <span className="flex items-center gap-2">
              {showFlags && selectedCountry.flag && (
                <span className="text-lg">{selectedCountry.flag}</span>
              )}
              {selectedCountry.name}
              {highlightGCC && selectedCountry.is_gcc && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">
                  GCC
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-300">{placeholder}</span>
          )}
        </span>

        {/* Chevron Icon */}
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-1 bg-gray-800/95 backdrop-blur-sm border border-white/20 rounded-md shadow-xl max-h-60 overflow-hidden"
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search countries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Countries List */}
            <div className="max-h-48 overflow-y-auto">
              {groupedCountries.length === 0 ? (
                <div className="px-3 py-2 text-gray-400 text-sm">
                  No countries found
                </div>
              ) : (
                groupedCountries.map((country, index) => {
                  const isSelected = country.name === value;
                  const isFocused = index === focusedIndex;

                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleSelect(country)}
                      className={`
                        w-full px-3 py-2 text-left flex items-center gap-2 text-white
                        transition-colors duration-150
                        ${isFocused ? 'bg-purple-600/50' : 'hover:bg-white/10'}
                        ${isSelected ? 'bg-purple-600/30' : ''}
                      `}
                    >
                      {/* Flag */}
                      {showFlags && country.flag && (
                        <span className="text-lg">{country.flag}</span>
                      )}

                      {/* Country Name */}
                      <span className="flex-1 truncate">{country.name}</span>

                      {/* GCC Badge */}
                      {highlightGCC && country.is_gcc && (
                        <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">
                          GCC
                        </span>
                      )}

                      {/* Selected Check */}
                      {isSelected && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* GCC Info */}
            {highlightGCC && filteredCountries.some(c => c.is_gcc) && (
              <div className="p-2 border-t border-white/10 bg-purple-900/20">
                <p className="text-xs text-purple-300">
                  <span className="font-medium">GCC:</span> Gulf Cooperation Council countries
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountrySelect;