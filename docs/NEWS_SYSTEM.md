# Ethiopian Maids News Feed System

## Overview

The Ethiopian Maids platform features an automated news feed system that provides real-time updates about labor market trends, regulatory changes, and platform activities across GCC countries. The system integrates multiple news sources and displays information in a scrolling ticker banner.

## Features

### 🔄 **Automated News Aggregation**

- **Multiple Sources**: NewsAPI, Google News, RSS feeds, Gulf-specific sources
- **Hourly Updates**: Automatic refresh every hour with real-time content
- **Smart Filtering**: AI-powered relevance scoring and content categorization
- **Fallback System**: Graceful degradation to cached/simulated content

### 📊 **Content Processing**

- **Categorization**: Automatic sorting into regulatory, market trends, platform updates, etc.
- **Relevance Scoring**: Intelligent filtering based on keywords and context
- **Content Sanitization**: Clean, ticker-friendly formatting
- **Duplicate Detection**: Prevents redundant news items

### 🎯 **User Experience**

- **Infinite Scroll**: Seamless right-to-left ticker animation
- **Interactive Controls**: Pause on hover, manual refresh, close button
- **Live Indicators**: Visual distinction between live and cached content
- **Responsive Design**: Optimized for all device sizes

## Architecture

### Core Components

```
src/
├── services/
│   └── newsService.js          # Main news aggregation service
├── utils/
│   ├── newsProcessor.js        # Content processing utilities
│   └── newsApiClient.js        # Enhanced API client with retry logic
├── config/
│   └── newsConfig.js           # Configuration and settings
└── components/layout/
    └── AnnouncementBanner.jsx  # UI component
```

### Data Flow

```
News Sources → API Client → News Service → Content Processor → UI Component
     ↓              ↓            ↓              ↓              ↓
  NewsAPI      Rate Limiting  Aggregation   Formatting    Display
  RSS Feeds    Error Handling Categorization Sanitization  Animation
  Google News  Caching        Scoring       Truncation     Controls
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Required for real news fetching
REACT_APP_NEWS_API_KEY=your_newsapi_key_here
REACT_APP_CURRENTS_API_KEY=your_currents_api_key_here

# Optional configuration
REACT_APP_ENABLE_REAL_NEWS=true
REACT_APP_NEWS_UPDATE_INTERVAL=60
REACT_APP_MAX_NEWS_ITEMS=20
```

### API Keys Setup

#### NewsAPI (Primary Source)

1. Visit [NewsAPI.org](https://newsapi.org/register)
2. Create free account (1000 requests/day)
3. Get API key from dashboard
4. Add to `.env` as `REACT_APP_NEWS_API_KEY`

#### Currents API (Secondary Source)

1. Visit [Currents API](https://currentsapi.services/en/register)
2. Sign up for free account
3. Get API key from dashboard
4. Add to `.env` as `REACT_APP_CURRENTS_API_KEY`

## News Sources

### 🌐 **External APIs**

- **NewsAPI**: Global news aggregator with GCC coverage
- **Currents API**: Alternative source with regional focus
- **Google News RSS**: Real-time news feeds
- **Gulf News RSS**: Regional news from major outlets

### 📰 **RSS Feeds**

- Gulf News UAE
- Arab News
- Khaleej Times
- The National UAE
- Al Arabiya English

### 🏢 **Platform Generated**

- User success stories
- Platform statistics
- Feature announcements
- Performance metrics

## Content Categories

### 📋 **Regulatory News**

- Visa policy changes
- Labor law updates
- Government announcements
- Ministry directives

### 📈 **Market Trends**

- Salary benchmarks
- Employment statistics
- Demand patterns
- Industry reports

### 🛡️ **Security Updates**

- Verification improvements
- Safety measures
- Background check enhancements
- Protection policies

### ⭐ **Success Stories**

- User testimonials
- Placement achievements
- Platform milestones
- Rating highlights

## Technical Implementation

### News Service Class

```javascript
import newsService from '@/services/newsService';

// Get formatted announcements for display
const announcements = newsService.getFormattedAnnouncements();

// Manual refresh
await newsService.forceUpdate();

// Check update status
const isUpdating = newsService.isCurrentlyUpdating();
const lastUpdate = newsService.getLastUpdateTime();
```

### API Client Features

```javascript
import newsAPIClient from '@/utils/newsApiClient';

// Rate-limited requests with retry logic
const data = await newsAPIClient.makeRequest(url, options, 'NEWS_API');

// Batch requests with concurrency control
const results = await newsAPIClient.batchRequests(requests);

// Cache management
const stats = newsAPIClient.getCacheStats();
```

### Content Processing

```javascript
import { processNewsForTicker } from '@/utils/newsProcessor';

// Process raw news for display
const processedNews = processNewsForTicker(rawNewsItems);

// Individual utilities
const cleaned = sanitizeContent(rawContent);
const truncated = truncateForTicker(longText, 120);
const enhanced = enhanceTitle(title, content);
```

## Error Handling

### Graceful Degradation

1. **API Failures**: Falls back to cached content
2. **Network Issues**: Uses local fallback news
3. **Rate Limiting**: Implements exponential backoff
4. **Invalid Content**: Filters and sanitizes automatically

### Retry Logic

- **Exponential Backoff**: 1s, 2s, 4s delays
- **Max Retries**: 3 attempts per request
- **Circuit Breaker**: Temporary disable on repeated failures
- **Fallback Cache**: Uses stale data when necessary

## Performance Optimization

### Caching Strategy

- **Memory Cache**: 30-minute TTL for API responses
- **Stale-While-Revalidate**: Serve cached while updating
- **Size Limits**: Maximum 100 cached entries
- **Cleanup**: Automatic removal of expired entries

### Rate Limiting

- **NewsAPI**: 100ms between requests
- **Google News**: 200ms between requests
- **RSS Feeds**: 300ms between requests
- **Concurrent Limit**: Maximum 3 simultaneous requests

## Monitoring & Analytics

### Metrics Tracked

- **Success Rate**: API call success percentage
- **Response Times**: Average API response latency
- **Cache Hit Rate**: Percentage of cached responses
- **Error Frequency**: Failed request patterns

### Logging

```javascript
// Development mode: Full logging
console.log('News updated:', newsItems.length, 'items');

// Production mode: Error logging only
console.error('API failure:', error.message);
```

## Customization

### Adding New Sources

1. **Create Source Function**:

```javascript
async fetchFromNewSource() {
  // Implement API integration
  return processedNewsItems;
}
```

2. **Update Configuration**:

```javascript
// Add to newsConfig.js
NEW_SOURCE: {
  endpoint: 'https://api.newsource.com',
  rateLimit: 200,
  priority: 'medium'
}
```

3. **Integrate in Service**:

```javascript
// Add to fetchFromMultipleSources()
promises.push(this.fetchFromNewSource());
```

### Modifying Categories

```javascript
// Update NEWS_CATEGORIES in newsService.js
CUSTOM_CATEGORY: {
  icon: CustomIcon,
  color: 'text-custom-600',
  bgColor: 'bg-custom-50',
  keywords: ['custom', 'keywords']
}
```

## Troubleshooting

### Common Issues

#### No News Displaying

1. Check API keys in `.env`
2. Verify network connectivity
3. Check browser console for errors
4. Ensure `REACT_APP_ENABLE_REAL_NEWS=true`

#### Slow Updates

1. Check rate limiting settings
2. Verify API quotas not exceeded
3. Monitor network performance
4. Review cache configuration

#### Irrelevant Content

1. Adjust relevance keywords
2. Modify scoring algorithm
3. Update content filters
4. Review source quality

### Debug Mode

Enable detailed logging:

```bash
REACT_APP_DEBUG_MODE=true
NODE_ENV=development
```

## Future Enhancements

### Planned Features

- **AI Summarization**: Automatic content summarization
- **Sentiment Analysis**: Positive/negative news classification
- **User Preferences**: Personalized news filtering
- **Push Notifications**: Real-time alerts for important news
- **Multi-language**: Arabic and Amharic translations

### Integration Opportunities

- **Social Media**: Twitter/LinkedIn news feeds
- **Government APIs**: Direct ministry announcements
- **Industry Reports**: Labor statistics integration
- **User Generated**: Community news submissions

## Support

For technical support or feature requests:

- Create GitHub issue with `news-system` label
- Include error logs and configuration details
- Specify browser and environment information
