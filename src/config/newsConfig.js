// News API Configuration
export const NEWS_CONFIG = {
  // API Keys (set these in your .env file)
  NEWS_API_KEY: process.env.REACT_APP_NEWS_API_KEY,
  CURRENTS_API_KEY: process.env.REACT_APP_CURRENTS_API_KEY,

  // API Endpoints
  ENDPOINTS: {
    NEWS_API: 'https://newsapi.org/v2/everything',
    GOOGLE_NEWS_RSS: 'https://news.google.com/rss/search',
    RSS_TO_JSON: 'https://api.rss2json.com/v1/api.json',
    CURRENTS_API: 'https://api.currentsapi.services/v1/search',
  },

  // Rate Limiting (milliseconds between requests)
  RATE_LIMITS: {
    NEWS_API: 100,
    GOOGLE_NEWS: 200,
    RSS_FEEDS: 300,
    CURRENTS_API: 150,
  },

  // Search Queries for different news sources
  SEARCH_QUERIES: {
    LABOR_MARKET: [
      'domestic workers UAE',
      'labor laws Saudi Arabia',
      'GCC employment visa',
      'housekeepers Qatar',
      'domestic help Kuwait',
      'migrant workers Bahrain',
      'employment regulations Oman',
    ],
    REGULATORY: [
      'visa regulations GCC',
      'labor law changes',
      'domestic worker rights',
      'employment visa updates',
      'work permit requirements',
    ],
    MARKET_TRENDS: [
      'domestic worker salary',
      'employment demand GCC',
      'labor market trends',
      'hiring statistics',
      'workforce migration',
    ],
  },

  // RSS Feed Sources
  RSS_FEEDS: [
    {
      url: 'https://gulfnews.com/uae/rss',
      source: 'Gulf News UAE',
      priority: 'high',
    },
    {
      url: 'https://www.arabnews.com/rss.xml',
      source: 'Arab News',
      priority: 'high',
    },
    {
      url: 'https://www.khaleejtimes.com/rss/homepage',
      source: 'Khaleej Times',
      priority: 'medium',
    },
    {
      url: 'https://www.thenationalnews.com/rss',
      source: 'The National UAE',
      priority: 'high',
    },
    {
      url: 'https://english.alarabiya.net/rss.xml',
      source: 'Al Arabiya English',
      priority: 'medium',
    },
  ],

  // Content Filtering
  RELEVANCE_KEYWORDS: [
    // Primary keywords (high weight)
    'domestic workers',
    'maids',
    'housekeepers',
    'domestic help',
    'labor laws',
    'employment visa',
    'work permit',

    // Secondary keywords (medium weight)
    'migrant workers',
    'household workers',
    'employment regulations',
    'visa requirements',
    'labor market',
    'workforce',

    // Tertiary keywords (low weight)
    'employment',
    'hiring',
    'recruitment',
    'workers rights',
    'labor ministry',
    'immigration',
  ],

  // GCC Countries for geo-targeting
  GCC_COUNTRIES: [
    { name: 'UAE', aliases: ['united arab emirates', 'dubai', 'abu dhabi'] },
    { name: 'Saudi Arabia', aliases: ['saudi', 'riyadh', 'jeddah'] },
    { name: 'Kuwait', aliases: ['kuwait city'] },
    { name: 'Qatar', aliases: ['doha'] },
    { name: 'Bahrain', aliases: ['manama'] },
    { name: 'Oman', aliases: ['muscat'] },
  ],

  // Content Quality Filters
  QUALITY_FILTERS: {
    MIN_TITLE_LENGTH: 10,
    MAX_TITLE_LENGTH: 200,
    MIN_RELEVANCE_SCORE: 0.3,
    MAX_AGE_DAYS: 30,
    SPAM_KEYWORDS: [
      'click here',
      'subscribe now',
      'limited time',
      'act now',
      'free trial',
      'special offer',
      'advertisement',
    ],
  },

  // Update Intervals
  UPDATE_INTERVALS: {
    HOURLY_UPDATE: 60 * 60 * 1000, // 1 hour
    QUICK_REFRESH: 5 * 60 * 1000, // 5 minutes
    RETRY_DELAY: 2 * 60 * 1000, // 2 minutes
    CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
  },

  // Error Handling
  ERROR_CONFIG: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 10000, // 10 seconds
    FALLBACK_TO_CACHE: true,
    LOG_ERRORS: true,
  },

  // Performance Settings
  PERFORMANCE: {
    MAX_CONCURRENT_REQUESTS: 3,
    MAX_ARTICLES_PER_SOURCE: 10,
    MAX_TOTAL_ARTICLES: 50,
    CACHE_SIZE_LIMIT: 100,
  },
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  NEWS_CONFIG.ERROR_CONFIG.LOG_ERRORS = true;
  NEWS_CONFIG.RATE_LIMITS = {
    NEWS_API: 200,
    GOOGLE_NEWS: 400,
    RSS_FEEDS: 500,
    CURRENTS_API: 300,
  };
}

if (process.env.NODE_ENV === 'production') {
  NEWS_CONFIG.ERROR_CONFIG.LOG_ERRORS = false;
  NEWS_CONFIG.PERFORMANCE.MAX_CONCURRENT_REQUESTS = 5;
}

// Validation function for API keys
export const validateAPIKeys = () => {
  const warnings = [];

  if (!NEWS_CONFIG.NEWS_API_KEY) {
    warnings.push('NewsAPI key not configured - using simulated data');
  }

  if (!NEWS_CONFIG.CURRENTS_API_KEY) {
    warnings.push('Currents API key not configured - skipping this source');
  }

  if (warnings.length > 0) {
    console.warn('News API Configuration Warnings:', warnings);
  }

  return warnings.length === 0;
};

// Helper function to get rate limit for a source
export const getRateLimit = (source) => {
  return NEWS_CONFIG.RATE_LIMITS[source] || 1000;
};

// Helper function to check if content is relevant
export const isContentRelevant = (title, content = '') => {
  const text = (title + ' ' + content).toLowerCase();
  const keywords = NEWS_CONFIG.RELEVANCE_KEYWORDS;

  let score = 0;
  keywords.forEach((keyword, index) => {
    if (text.includes(keyword.toLowerCase())) {
      // Higher weight for earlier keywords in the list
      score += (keywords.length - index) / keywords.length;
    }
  });

  return score >= NEWS_CONFIG.QUALITY_FILTERS.MIN_RELEVANCE_SCORE;
};

export default NEWS_CONFIG;
