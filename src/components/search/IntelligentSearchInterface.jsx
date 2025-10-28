/**
 * 🔍 Intelligent Search Interface
 * AI-powered search with smart recommendations and predictive filtering
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Brain,
  Target,
  Zap,
  Star,
  MapPin,
  Clock,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import intelligentMatchingService from '@/services/intelligentMatchingService';
import userAnalytics from '@/utils/userAnalytics';

const IntelligentSearchInterface = ({
  userType = 'sponsor',
  onResults,
  onSearchChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    skills: [],
    experience: [0, 10],
    location: '',
    availability: 'any',
    rating: [0, 5],
    languages: [],
  });
  const [searchMode, setSearchMode] = useState('intelligent'); // 'intelligent' or 'manual'
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // =============================================
  // SEARCH LOGIC
  // =============================================

  const performIntelligentSearch = useCallback(
    async (query, searchFilters) => {
      setIsSearching(true);

      try {
        // Track search initiation
        userAnalytics.trackFirstSearch({
          query,
          filters: searchFilters,
          mode: searchMode,
        });

        let results = [];

        if (searchMode === 'intelligent') {
          // Use AI-powered matching
          results = await intelligentMatchingService.findMatches(
            'current-user-id', // In production, get from auth context
            {
              searchQuery: query,
              ...searchFilters,
            },
            20
          );
        } else {
          // Traditional search
          results = await performTraditionalSearch(query, searchFilters);
        }

        // Generate AI recommendations based on search
        const recommendations = await generateSearchRecommendations(
          query,
          searchFilters,
          results
        );
        setAiRecommendations(recommendations);

        // Update search history
        updateSearchHistory(query, searchFilters, results.length);

        // Notify parent component
        onResults?.(results);
        onSearchChange?.({ query, filters: searchFilters, results });

        return results;
      } catch (error) {
        console.error('Search failed:', error);
        userAnalytics.trackUserError('search_error', error.message, {
          query,
          filters: searchFilters,
          mode: searchMode,
        });
      } finally {
        setIsSearching(false);
      }
    },
    [searchMode, onResults, onSearchChange]
  );

  const performTraditionalSearch = async (query, searchFilters) => {
    // Traditional keyword-based search implementation
    // This would typically call your existing search API
    return [];
  };

  const generateSearchRecommendations = async (
    query,
    searchFilters,
    results
  ) => {
    const recommendations = [];

    // Skill-based recommendations
    if (results.length < 5) {
      recommendations.push({
        type: 'skill_expansion',
        title: 'Expand Your Skills Search',
        description: 'Try searching for related skills to find more matches',
        suggestions: ['housekeeping', 'cooking', 'elderly care', 'pet care'],
        icon: <Sparkles className='h-4 w-4' />,
      });
    }

    // Location-based recommendations
    if (searchFilters.location && results.length < 10) {
      recommendations.push({
        type: 'location_expansion',
        title: 'Consider Nearby Locations',
        description: 'Expand your search to nearby cities or regions',
        suggestions: ['Riyadh', 'Jeddah', 'Dammam', 'Dubai'],
        icon: <MapPin className='h-4 w-4' />,
      });
    }

    // Experience recommendations
    if (searchFilters.experience[0] > 2) {
      recommendations.push({
        type: 'experience_adjustment',
        title: 'Consider Less Experienced Candidates',
        description:
          'Talented candidates with 1-2 years experience might be perfect',
        action: () =>
          setFilters((prev) => ({
            ...prev,
            experience: [0, prev.experience[1]],
          })),
        icon: <TrendingUp className='h-4 w-4' />,
      });
    }

    // AI-powered recommendations based on successful matches
    const aiSuggestions = await getAIRecommendations(query, searchFilters);
    recommendations.push(...aiSuggestions);

    return recommendations;
  };

  const getAIRecommendations = async (query, searchFilters) => {
    // Simulate AI recommendations based on successful matches
    return [
      {
        type: 'ai_suggestion',
        title: 'AI Recommendation',
        description:
          'Based on successful matches, consider candidates with childcare experience',
        confidence: 0.85,
        icon: <Brain className='h-4 w-4' />,
      },
    ];
  };

  // =============================================
  // SEARCH SUGGESTIONS & AUTOCOMPLETE
  // =============================================

  const generateSearchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    // Generate intelligent suggestions
    const suggestions = [
      // Skill-based suggestions
      ...getSkillSuggestions(query),
      // Location-based suggestions
      ...getLocationSuggestions(query),
      // Experience-based suggestions
      ...getExperienceSuggestions(query),
      // Popular searches
      ...getPopularSearches(query),
    ].slice(0, 8);

    setSearchSuggestions(suggestions);
  }, []);

  const getSkillSuggestions = (query) => {
    const skills = [
      'housekeeping',
      'cooking',
      'childcare',
      'elderly care',
      'pet care',
      'laundry',
      'ironing',
      'cleaning',
      'babysitting',
      'tutoring',
    ];

    return skills
      .filter((skill) => skill.toLowerCase().includes(query.toLowerCase()))
      .map((skill) => ({
        type: 'skill',
        text: skill,
        icon: <Award className='h-4 w-4' />,
        category: 'Skills',
      }));
  };

  const getLocationSuggestions = (query) => {
    const locations = [
      'Riyadh',
      'Jeddah',
      'Dammam',
      'Dubai',
      'Abu Dhabi',
      'Kuwait City',
      'Doha',
      'Manama',
      'Muscat',
    ];

    return locations
      .filter((location) =>
        location.toLowerCase().includes(query.toLowerCase())
      )
      .map((location) => ({
        type: 'location',
        text: location,
        icon: <MapPin className='h-4 w-4' />,
        category: 'Locations',
      }));
  };

  const getExperienceSuggestions = (query) => {
    const experienceTerms = [
      'experienced',
      'beginner',
      'expert',
      'professional',
    ];

    return experienceTerms
      .filter((term) => term.toLowerCase().includes(query.toLowerCase()))
      .map((term) => ({
        type: 'experience',
        text: term,
        icon: <Star className='h-4 w-4' />,
        category: 'Experience',
      }));
  };

  const getPopularSearches = (query) => {
    const popular = [
      'housekeeping expert',
      'cooking specialist',
      'childcare professional',
    ];

    return popular
      .filter((search) => search.toLowerCase().includes(query.toLowerCase()))
      .map((search) => ({
        type: 'popular',
        text: search,
        icon: <TrendingUp className='h-4 w-4' />,
        category: 'Popular',
      }));
  };

  // =============================================
  // TRENDING & HISTORY
  // =============================================

  const loadTrendingSearches = useCallback(async () => {
    // In production, fetch from analytics service
    const trending = [
      { query: 'housekeeping expert', count: 156, trend: '+12%' },
      { query: 'cooking specialist', count: 134, trend: '+8%' },
      { query: 'childcare professional', count: 98, trend: '+15%' },
      { query: 'elderly care', count: 87, trend: '+5%' },
      { query: 'pet care', count: 76, trend: '+22%' },
    ];

    setTrendingSearches(trending);
  }, []);

  const updateSearchHistory = (query, searchFilters, resultCount) => {
    const searchEntry = {
      query,
      filters: searchFilters,
      resultCount,
      timestamp: Date.now(),
      id: Date.now().toString(),
    };

    setSearchHistory((prev) => [searchEntry, ...prev.slice(0, 9)]); // Keep last 10 searches

    // Store in localStorage
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history.unshift(searchEntry);
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 50)));
  };

  // =============================================
  // EFFECTS
  // =============================================

  useEffect(() => {
    loadTrendingSearches();

    // Load search history
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history.slice(0, 10));
  }, [loadTrendingSearches]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generateSearchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, generateSearchSuggestions]);

  // =============================================
  // EVENT HANDLERS
  // =============================================

  const handleSearch = () => {
    if (
      searchQuery.trim() ||
      Object.values(filters).some((f) => f && f.length > 0)
    ) {
      performIntelligentSearch(searchQuery, filters);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.text);
    setSearchSuggestions([]);

    // Auto-search on suggestion click
    setTimeout(() => {
      performIntelligentSearch(suggestion.text, filters);
    }, 100);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    // Auto-search if there's a query
    if (searchQuery.trim()) {
      performIntelligentSearch(searchQuery, newFilters);
    }
  };

  const handleTrendingClick = (trending) => {
    setSearchQuery(trending.query);
    performIntelligentSearch(trending.query, filters);

    userAnalytics.trackInteraction('trending_search_click', trending.query);
  };

  const handleHistoryClick = (historyItem) => {
    setSearchQuery(historyItem.query);
    setFilters(historyItem.filters);
    performIntelligentSearch(historyItem.query, historyItem.filters);

    userAnalytics.trackInteraction('search_history_click', historyItem.query);
  };

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className='space-y-6'>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Brain className='h-5 w-5 text-blue-600' />
            Intelligent Search
            <Badge variant='secondary' className='ml-2'>
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Search Mode Toggle */}
          <div className='flex items-center gap-4'>
            <Button
              variant={searchMode === 'intelligent' ? 'default' : 'outline'}
              onClick={() => setSearchMode('intelligent')}
              className='flex items-center gap-2'
            >
              <Sparkles className='h-4 w-4' />
              AI Search
            </Button>
            <Button
              variant={searchMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setSearchMode('manual')}
              className='flex items-center gap-2'
            >
              <Search className='h-4 w-4' />
              Manual Search
            </Button>
          </div>

          {/* Main Search Input */}
          <div className='relative'>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder={
                    searchMode === 'intelligent'
                      ? "Describe what you're looking for..."
                      : 'Search by skills, location, or keywords...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className='pl-10'
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className='flex items-center gap-2'
              >
                {isSearching ? (
                  <div className='animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full' />
                ) : (
                  <Zap className='h-4 w-4' />
                )}
                Search
              </Button>
            </div>

            {/* Search Suggestions */}
            {searchSuggestions.length > 0 && (
              <div className='absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className='w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3'
                  >
                    {suggestion.icon}
                    <div>
                      <div className='font-medium'>{suggestion.text}</div>
                      <div className='text-xs text-gray-500'>
                        {suggestion.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Tabs */}
      <Tabs defaultValue='filters' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='filters'>Filters</TabsTrigger>
          <TabsTrigger value='trending'>Trending</TabsTrigger>
          <TabsTrigger value='history'>History</TabsTrigger>
          <TabsTrigger value='recommendations'>AI Tips</TabsTrigger>
        </TabsList>

        <TabsContent value='filters' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Filter className='h-5 w-5' />
                Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Experience Range */}
              <div>
                <label className='text-sm font-medium mb-2 block'>
                  Experience (Years): {filters.experience[0]} -{' '}
                  {filters.experience[1]}
                </label>
                <Slider
                  value={filters.experience}
                  onValueChange={(value) =>
                    handleFilterChange('experience', value)
                  }
                  max={10}
                  step={1}
                  className='w-full'
                />
              </div>

              {/* Rating Range */}
              <div>
                <label className='text-sm font-medium mb-2 block'>
                  Minimum Rating: {filters.rating[0]} stars
                </label>
                <Slider
                  value={filters.rating}
                  onValueChange={(value) => handleFilterChange('rating', value)}
                  max={5}
                  step={0.5}
                  className='w-full'
                />
              </div>

              {/* Location Filter */}
              <div>
                <label className='text-sm font-medium mb-2 block'>
                  Location
                </label>
                <Input
                  placeholder='Enter city or country'
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange('location', e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='trending'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Trending Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {trendingSearches.map((trending, index) => (
                  <button
                    key={index}
                    onClick={() => handleTrendingClick(trending)}
                    className='w-full p-3 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium'>{trending.query}</div>
                        <div className='text-sm text-gray-500'>
                          {trending.count} searches
                        </div>
                      </div>
                      <Badge variant='secondary' className='text-green-600'>
                        {trending.trend}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchHistory.length === 0 ? (
                <p className='text-gray-500 text-center py-4'>
                  No recent searches
                </p>
              ) : (
                <div className='space-y-3'>
                  {searchHistory.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleHistoryClick(item)}
                      className='w-full p-3 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-medium'>
                            {item.query || 'Advanced search'}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {item.resultCount} results •{' '}
                            {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='recommendations'>
          <div className='space-y-4'>
            {aiRecommendations.map((rec, index) => (
              <Card key={index}>
                <CardContent className='p-4'>
                  <div className='flex items-start gap-3'>
                    <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
                      {rec.icon}
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-medium'>{rec.title}</h4>
                      <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                        {rec.description}
                      </p>
                      {rec.suggestions && (
                        <div className='flex flex-wrap gap-2 mt-2'>
                          {rec.suggestions.map((suggestion, i) => (
                            <Badge
                              key={i}
                              variant='outline'
                              className='cursor-pointer'
                            >
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {rec.confidence && (
                        <div className='mt-2'>
                          <Badge variant='secondary'>
                            {Math.round(rec.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentSearchInterface;
