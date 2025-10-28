// Content processing utilities for news items

/**
 * Sanitize and format news content for display
 */
export const sanitizeContent = (content) => {
  if (!content) return '';

  // Remove HTML tags
  const withoutHtml = content.replace(/<[^>]*>/g, '');

  // Remove extra whitespace
  const cleaned = withoutHtml.replace(/\s+/g, ' ').trim();

  // Remove common unwanted phrases
  const unwantedPhrases = [
    'Read more',
    'Continue reading',
    'Click here',
    'Subscribe',
    'Advertisement',
    'Sponsored content',
  ];

  let sanitized = cleaned;
  unwantedPhrases.forEach((phrase) => {
    const regex = new RegExp(phrase, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  return sanitized.trim();
};

/**
 * Truncate content to fit ticker display
 */
export const truncateForTicker = (text, maxLength = 120) => {
  if (!text) return '';

  const sanitized = sanitizeContent(text);

  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  // Find the last complete word within the limit
  const truncated = sanitized.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
};

/**
 * Extract key information from news content
 */
export const extractKeyInfo = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();

  const keyInfo = {
    countries: [],
    amounts: [],
    dates: [],
    organizations: [],
  };

  // Extract GCC countries
  const gccCountries = [
    'uae',
    'saudi arabia',
    'kuwait',
    'qatar',
    'bahrain',
    'oman',
  ];
  gccCountries.forEach((country) => {
    if (text.includes(country)) {
      keyInfo.countries.push(country);
    }
  });

  // Extract monetary amounts
  const amountRegex = /(?:aed|sar|kwd|qar|bhd|omr|usd)\s*[\d,]+/gi;
  const amounts = text.match(amountRegex);
  if (amounts) {
    keyInfo.amounts = amounts.slice(0, 3); // Limit to 3 amounts
  }

  // Extract dates
  const dateRegex =
    /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{4}|\b\d{4}-\d{2}-\d{2}\b/gi;
  const dates = text.match(dateRegex);
  if (dates) {
    keyInfo.dates = dates.slice(0, 2); // Limit to 2 dates
  }

  // Extract organizations/ministries
  const orgRegex =
    /\b(?:ministry|department|authority|commission|council|government|agency)\s+of\s+[\w\s]+/gi;
  const orgs = text.match(orgRegex);
  if (orgs) {
    keyInfo.organizations = orgs.slice(0, 2); // Limit to 2 organizations
  }

  return keyInfo;
};

/**
 * Generate enhanced title with key information
 */
export const enhanceTitle = (title, content) => {
  const keyInfo = extractKeyInfo(title, content);
  let enhanced = title;

  // Add country context if not already present
  if (
    keyInfo.countries.length > 0 &&
    !title.toLowerCase().includes(keyInfo.countries[0])
  ) {
    const country = keyInfo.countries[0].toUpperCase();
    enhanced = `${country}: ${enhanced}`;
  }

  // Add amount context if relevant
  if (keyInfo.amounts.length > 0 && !title.includes(keyInfo.amounts[0])) {
    enhanced = `${enhanced} (${keyInfo.amounts[0]})`;
  }

  return truncateForTicker(enhanced);
};

/**
 * Determine urgency level based on content
 */
export const determineUrgency = (title, content, publishedAt) => {
  const text = `${title} ${content}`.toLowerCase();
  const now = new Date();
  const publishDate = new Date(publishedAt);
  const hoursOld = (now - publishDate) / (1000 * 60 * 60);

  // High urgency keywords
  const urgentKeywords = [
    'breaking',
    'urgent',
    'immediate',
    'emergency',
    'suspended',
    'banned',
    'new law',
    'effective immediately',
    'announced today',
    'just announced',
  ];

  // Medium urgency keywords
  const mediumKeywords = [
    'new',
    'updated',
    'changed',
    'revised',
    'launched',
    'introduced',
    'effective',
    'starting',
    'beginning',
  ];

  // Check for urgent keywords
  if (urgentKeywords.some((keyword) => text.includes(keyword))) {
    return 'high';
  }

  // Check for medium keywords and recency
  if (
    mediumKeywords.some((keyword) => text.includes(keyword)) ||
    hoursOld < 6
  ) {
    return 'medium';
  }

  // Check recency
  if (hoursOld < 24) {
    return 'medium';
  }

  return 'low';
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * Generate ticker-friendly summary
 */
export const generateTickerSummary = (newsItem) => {
  const { title, content, source, timestamp, category } = newsItem;

  // Enhance the title with key information
  const enhancedTitle = enhanceTitle(title, content || '');

  // Determine urgency
  const urgency = determineUrgency(title, content || '', timestamp);

  // Format timestamp
  const timeAgo = formatTimestamp(timestamp);

  // Add urgency indicator for high priority items
  let prefix = '';
  if (urgency === 'high') {
    prefix = '🔴 BREAKING: ';
  } else if (urgency === 'medium') {
    prefix = '🟡 UPDATE: ';
  }

  return {
    displayText: `${prefix}${enhancedTitle}`,
    urgency,
    timeAgo,
    source: source || 'News Source',
  };
};

/**
 * Filter news by relevance and quality
 */
export const filterNewsQuality = (newsItems, minRelevanceScore = 0.3) => {
  return newsItems.filter((item) => {
    // Check minimum relevance score
    if (item.relevanceScore < minRelevanceScore) {
      return false;
    }

    // Check title length (too short or too long)
    if (!item.title || item.title.length < 10 || item.title.length > 200) {
      return false;
    }

    // Check for spam indicators
    const spamKeywords = [
      'click here',
      'subscribe now',
      'limited time',
      'act now',
    ];
    const titleLower = item.title.toLowerCase();
    if (spamKeywords.some((keyword) => titleLower.includes(keyword))) {
      return false;
    }

    // Check timestamp validity
    const itemDate = new Date(item.timestamp);
    const now = new Date();
    const daysDiff = (now - itemDate) / (1000 * 60 * 60 * 24);

    // Reject items older than 30 days
    if (daysDiff > 30) {
      return false;
    }

    return true;
  });
};

/**
 * Sort news by priority and recency
 */
export const sortNewsByPriority = (newsItems) => {
  return newsItems.sort((a, b) => {
    // First sort by urgency
    const urgencyA = determineUrgency(a.title, a.content || '', a.timestamp);
    const urgencyB = determineUrgency(b.title, b.content || '', b.timestamp);

    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    const urgencyDiff = urgencyOrder[urgencyB] - urgencyOrder[urgencyA];

    if (urgencyDiff !== 0) {
      return urgencyDiff;
    }

    // Then sort by relevance score
    const relevanceDiff = b.relevanceScore - a.relevanceScore;
    if (Math.abs(relevanceDiff) > 0.1) {
      return relevanceDiff;
    }

    // Finally sort by recency
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
};

/**
 * Process raw news data for ticker display
 */
export const processNewsForTicker = (rawNewsItems) => {
  // Filter for quality
  const qualityNews = filterNewsQuality(rawNewsItems);

  // Sort by priority
  const sortedNews = sortNewsByPriority(qualityNews);

  // Generate ticker summaries
  const processedNews = sortedNews.map((item) => {
    const summary = generateTickerSummary(item);

    return {
      ...item,
      displayText: summary.displayText,
      urgency: summary.urgency,
      timeAgo: summary.timeAgo,
      formattedSource: summary.source,
    };
  });

  return processedNews;
};
