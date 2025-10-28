/**
 * 🔔 Intelligent Notification Service
 * AI-powered notification system with smart prioritization and personalization
 */

import userAnalytics from '@/utils/userAnalytics';
import productionMonitor from '@/utils/productionMonitoring';

class IntelligentNotificationService {
  constructor() {
    this.notificationQueue = [];
    this.userPreferences = new Map();
    this.notificationHistory = new Map();
    this.aiModel = this.initializeAIModel();
    this.isProcessing = false;

    // Start processing queue
    this.startQueueProcessor();
  }

  // =============================================
  // AI MODEL INITIALIZATION
  // =============================================

  initializeAIModel() {
    return {
      priorityWeights: {
        urgency: 0.3,
        relevance: 0.25,
        userEngagement: 0.2,
        timing: 0.15,
        frequency: 0.1,
      },
      learningData: this.loadLearningData(),
      userBehaviorPatterns: new Map(),
    };
  }

  loadLearningData() {
    try {
      const data = localStorage.getItem('notificationAI_learningData');
      return data
        ? JSON.parse(data)
        : {
            engagementRates: {},
            optimalTiming: {},
            contentPreferences: {},
            channelPreferences: {},
          };
    } catch {
      return {
        engagementRates: {},
        optimalTiming: {},
        contentPreferences: {},
        channelPreferences: {},
      };
    }
  }

  // =============================================
  // CORE NOTIFICATION PROCESSING
  // =============================================

  async sendNotification(notification) {
    try {
      // Enhance notification with AI insights
      const enhancedNotification = await this.enhanceWithAI(notification);

      // Add to queue for processing
      this.notificationQueue.push(enhancedNotification);

      // Track notification creation
      this.trackNotificationMetrics('created', enhancedNotification);

      return enhancedNotification.id;
    } catch (error) {
      productionMonitor.reportError('Notification Service Error', {
        error: error.message,
        notification: notification,
      });
      throw error;
    }
  }

  async enhanceWithAI(notification) {
    const enhanced = {
      ...notification,
      id: this.generateNotificationId(),
      timestamp: Date.now(),
      aiScore: 0,
      priority: 'medium',
      personalizedContent: notification.content,
      optimalDeliveryTime: null,
      channels: ['in-app'], // Default channel
      metadata: {
        ...notification.metadata,
        aiEnhanced: true,
        processingTime: Date.now(),
      },
    };

    // Calculate AI priority score
    enhanced.aiScore = await this.calculateAIPriorityScore(enhanced);

    // Determine priority level
    enhanced.priority = this.determinePriority(enhanced.aiScore);

    // Personalize content
    enhanced.personalizedContent = await this.personalizeContent(enhanced);

    // Determine optimal delivery time
    enhanced.optimalDeliveryTime =
      await this.calculateOptimalDeliveryTime(enhanced);

    // Select best channels
    enhanced.channels = await this.selectOptimalChannels(enhanced);

    return enhanced;
  }

  async calculateAIPriorityScore(notification) {
    const scores = {
      urgency: this.calculateUrgencyScore(notification),
      relevance: await this.calculateRelevanceScore(notification),
      userEngagement: await this.calculateUserEngagementScore(notification),
      timing: this.calculateTimingScore(notification),
      frequency: this.calculateFrequencyScore(notification),
    };

    // Calculate weighted score
    const weightedScore = Object.entries(scores).reduce(
      (total, [key, score]) => {
        return total + score * this.aiModel.priorityWeights[key];
      },
      0
    );

    // Apply machine learning adjustments
    const adjustedScore = await this.applyMLAdjustments(
      notification,
      weightedScore
    );

    return Math.min(Math.max(adjustedScore, 0), 1);
  }

  calculateUrgencyScore(notification) {
    const urgencyLevels = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.2,
      info: 0.1,
    };

    return urgencyLevels[notification.urgency] || 0.5;
  }

  async calculateRelevanceScore(notification) {
    const userId = notification.userId;
    const userProfile = await this.getUserProfile(userId);

    if (!userProfile) return 0.5;

    let relevanceScore = 0.5; // Base score

    // Content relevance
    if (notification.category) {
      const userInterests = userProfile.interests || [];
      if (userInterests.includes(notification.category)) {
        relevanceScore += 0.3;
      }
    }

    // Role-based relevance
    if (
      notification.targetRole &&
      notification.targetRole === userProfile.role
    ) {
      relevanceScore += 0.2;
    }

    // Location relevance
    if (notification.location && userProfile.location) {
      if (notification.location === userProfile.location) {
        relevanceScore += 0.2;
      }
    }

    return Math.min(relevanceScore, 1.0);
  }

  async calculateUserEngagementScore(notification) {
    const userId = notification.userId;
    const userHistory = this.notificationHistory.get(userId) || [];

    if (userHistory.length === 0) return 0.5;

    // Calculate engagement rate for similar notifications
    const similarNotifications = userHistory.filter(
      (n) =>
        n.category === notification.category || n.type === notification.type
    );

    if (similarNotifications.length === 0) return 0.5;

    const engagementRate =
      similarNotifications.reduce((sum, n) => {
        return sum + (n.engaged ? 1 : 0);
      }, 0) / similarNotifications.length;

    return engagementRate;
  }

  calculateTimingScore(notification) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Optimal hours: 9-11 AM, 2-4 PM, 7-9 PM
    const optimalHours = [9, 10, 11, 14, 15, 16, 19, 20, 21];
    const hourScore = optimalHours.includes(hour) ? 1.0 : 0.3;

    // Weekdays generally better than weekends for business notifications
    const dayScore = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.0 : 0.7;

    return (hourScore + dayScore) / 2;
  }

  calculateFrequencyScore(notification) {
    const userId = notification.userId;
    const userHistory = this.notificationHistory.get(userId) || [];

    // Check recent notification frequency
    const recentNotifications = userHistory.filter(
      (n) => Date.now() - n.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    // Penalize high frequency
    if (recentNotifications.length > 10) return 0.1;
    if (recentNotifications.length > 5) return 0.5;
    if (recentNotifications.length > 2) return 0.8;

    return 1.0;
  }

  async applyMLAdjustments(notification, baseScore) {
    let adjustedScore = baseScore;

    // Historical success rate adjustment
    const historicalSuccess = await this.getHistoricalSuccessRate(notification);
    adjustedScore *= 0.7 + historicalSuccess * 0.6;

    // User behavior pattern adjustment
    const behaviorAdjustment =
      await this.getBehaviorPatternAdjustment(notification);
    adjustedScore *= behaviorAdjustment;

    // Time-based learning adjustment
    const timeAdjustment = this.getTimeBasedAdjustment(notification);
    adjustedScore *= timeAdjustment;

    return Math.min(adjustedScore, 1.0);
  }

  // =============================================
  // CONTENT PERSONALIZATION
  // =============================================

  async personalizeContent(notification) {
    const userId = notification.userId;
    const userProfile = await this.getUserProfile(userId);

    if (!userProfile) return notification.content;

    let personalizedContent = notification.content;

    // Personalize based on user name
    if (userProfile.name) {
      personalizedContent = personalizedContent.replace(
        /\{name\}/g,
        userProfile.name.split(' ')[0]
      );
    }

    // Personalize based on user role
    if (userProfile.role) {
      const roleSpecificContent = this.getRoleSpecificContent(
        notification,
        userProfile.role
      );
      if (roleSpecificContent) {
        personalizedContent = roleSpecificContent;
      }
    }

    // Personalize based on user preferences
    if (userProfile.preferences) {
      personalizedContent = this.applyPreferencePersonalization(
        personalizedContent,
        userProfile.preferences
      );
    }

    return personalizedContent;
  }

  getRoleSpecificContent(notification, role) {
    const roleContent = {
      maid: {
        new_job: 'A new job opportunity matches your skills!',
        profile_view: 'A sponsor viewed your profile!',
        message: 'You have a new message from a potential employer!',
      },
      sponsor: {
        new_maid: 'New maids matching your requirements are available!',
        application: 'A maid has applied for your job posting!',
        message: 'You have a new message from a maid!',
      },
      agency: {
        new_maid: 'A new maid has registered through your agency!',
        booking: 'You have a new booking request!',
        payment: 'Payment received for your services!',
      },
    };

    return roleContent[role]?.[notification.type];
  }

  applyPreferencePersonalization(content, preferences) {
    // Apply language preferences
    if (preferences.language && preferences.language !== 'en') {
      // In production, integrate with translation service
      content = this.translateContent(content, preferences.language);
    }

    // Apply communication style preferences
    if (preferences.communicationStyle === 'formal') {
      content = this.makeFormal(content);
    } else if (preferences.communicationStyle === 'casual') {
      content = this.makeCasual(content);
    }

    return content;
  }

  // =============================================
  // DELIVERY OPTIMIZATION
  // =============================================

  async calculateOptimalDeliveryTime(notification) {
    const userId = notification.userId;
    const userTimezone = await this.getUserTimezone(userId);
    const userActivityPattern = await this.getUserActivityPattern(userId);

    // If immediate delivery required
    if (notification.urgency === 'critical' || notification.immediate) {
      return Date.now();
    }

    // Calculate optimal time based on user activity
    const optimalHour = this.findOptimalHour(userActivityPattern);
    const optimalTime = this.calculateNextOptimalTime(
      optimalHour,
      userTimezone
    );

    // Don't delay more than 24 hours
    const maxDelay = Date.now() + 24 * 60 * 60 * 1000;
    return Math.min(optimalTime, maxDelay);
  }

  async selectOptimalChannels(notification) {
    const userId = notification.userId;
    const userPreferences = await this.getUserNotificationPreferences(userId);
    const availableChannels = ['in-app', 'email', 'sms', 'push'];

    // Filter based on user preferences
    let selectedChannels = availableChannels.filter(
      (channel) => userPreferences[channel] !== false
    );

    // Apply urgency-based channel selection
    if (notification.urgency === 'critical') {
      selectedChannels = ['in-app', 'push', 'sms']; // All immediate channels
    } else if (notification.urgency === 'high') {
      selectedChannels = ['in-app', 'push'];
    } else if (notification.urgency === 'low') {
      selectedChannels = ['in-app'];
    }

    // Apply AI-based channel optimization
    const optimizedChannels = await this.optimizeChannelsWithAI(
      notification,
      selectedChannels
    );

    return optimizedChannels;
  }

  async optimizeChannelsWithAI(notification, channels) {
    const userId = notification.userId;
    const channelPerformance = await this.getChannelPerformance(userId);

    // Sort channels by performance for this user
    const sortedChannels = channels.sort((a, b) => {
      const performanceA = channelPerformance[a] || 0.5;
      const performanceB = channelPerformance[b] || 0.5;
      return performanceB - performanceA;
    });

    // Return top performing channels (max 2 for non-critical notifications)
    const maxChannels = notification.urgency === 'critical' ? 3 : 2;
    return sortedChannels.slice(0, maxChannels);
  }

  // =============================================
  // QUEUE PROCESSING
  // =============================================

  startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.notificationQueue.length > 0) {
        this.processQueue();
      }
    }, 1000); // Process every second
  }

  async processQueue() {
    this.isProcessing = true;

    try {
      // Sort queue by AI score and urgency
      this.notificationQueue.sort((a, b) => {
        if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
        if (b.urgency === 'critical' && a.urgency !== 'critical') return 1;
        return b.aiScore - a.aiScore;
      });

      // Process notifications
      const now = Date.now();
      const readyNotifications = this.notificationQueue.filter(
        (n) => !n.optimalDeliveryTime || n.optimalDeliveryTime <= now
      );

      for (const notification of readyNotifications) {
        await this.deliverNotification(notification);

        // Remove from queue
        const index = this.notificationQueue.indexOf(notification);
        if (index > -1) {
          this.notificationQueue.splice(index, 1);
        }
      }
    } catch (error) {
      productionMonitor.reportError('Notification Queue Processing Error', {
        error: error.message,
        queueSize: this.notificationQueue.length,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  async deliverNotification(notification) {
    try {
      // Deliver through selected channels
      const deliveryPromises = notification.channels.map((channel) =>
        this.deliverThroughChannel(notification, channel)
      );

      await Promise.all(deliveryPromises);

      // Update notification history
      this.updateNotificationHistory(notification);

      // Track delivery
      this.trackNotificationMetrics('delivered', notification);

      // Learn from delivery
      this.updateLearningData(notification);
    } catch (error) {
      productionMonitor.reportError('Notification Delivery Error', {
        error: error.message,
        notificationId: notification.id,
        channels: notification.channels,
      });
    }
  }

  async deliverThroughChannel(notification, channel) {
    switch (channel) {
      case 'in-app':
        return this.deliverInApp(notification);
      case 'email':
        return this.deliverEmail(notification);
      case 'sms':
        return this.deliverSMS(notification);
      case 'push':
        return this.deliverPush(notification);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  async deliverInApp(notification) {
    // Store in-app notification
    const inAppNotifications = JSON.parse(
      localStorage.getItem(`notifications_${notification.userId}`) || '[]'
    );

    inAppNotifications.unshift({
      id: notification.id,
      title: notification.title,
      content: notification.personalizedContent,
      type: notification.type,
      timestamp: Date.now(),
      read: false,
      priority: notification.priority,
    });

    localStorage.setItem(
      `notifications_${notification.userId}`,
      JSON.stringify(inAppNotifications.slice(0, 100)) // Keep last 100
    );

    // Trigger real-time update
    this.triggerInAppUpdate(notification.userId);
  }

  async deliverEmail(notification) {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
  }

  async deliverSMS(notification) {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
  }

  async deliverPush(notification) {
    // In production, integrate with push notification service
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Send push notification
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  determinePriority(aiScore) {
    if (aiScore >= 0.8) return 'high';
    if (aiScore >= 0.6) return 'medium';
    if (aiScore >= 0.3) return 'low';
    return 'info';
  }

  triggerInAppUpdate(userId) {
    // Trigger custom event for real-time UI updates
    const event = new CustomEvent('notificationUpdate', {
      detail: { userId },
    });
    document.dispatchEvent(event);
  }

  updateNotificationHistory(notification) {
    const userId = notification.userId;
    const history = this.notificationHistory.get(userId) || [];

    history.unshift({
      id: notification.id,
      type: notification.type,
      category: notification.category,
      timestamp: notification.timestamp,
      delivered: true,
      engaged: false, // Will be updated when user interacts
    });

    // Keep last 1000 notifications per user
    this.notificationHistory.set(userId, history.slice(0, 1000));
  }

  trackNotificationMetrics(action, notification) {
    userAnalytics.trackConversion(`notification_${action}`, {
      notificationId: notification.id,
      type: notification.type,
      category: notification.category,
      priority: notification.priority,
      aiScore: notification.aiScore,
      channels: notification.channels,
    });
  }

  updateLearningData(notification) {
    // Update AI learning data based on delivery
    const learningData = this.aiModel.learningData;

    // Update engagement rates (will be updated when user interacts)
    if (!learningData.engagementRates[notification.type]) {
      learningData.engagementRates[notification.type] = [];
    }

    // Save updated learning data
    localStorage.setItem(
      'notificationAI_learningData',
      JSON.stringify(learningData)
    );
  }

  // Mock data methods (replace with real API calls in production)
  async getUserProfile(userId) {
    return {
      id: userId,
      name: 'John Doe',
      role: 'sponsor',
      location: 'Riyadh',
      interests: ['housekeeping', 'childcare'],
      preferences: {
        language: 'en',
        communicationStyle: 'professional',
      },
    };
  }

  async getUserTimezone(userId) {
    return 'Asia/Riyadh';
  }

  async getUserActivityPattern(userId) {
    return {
      peakHours: [9, 10, 11, 14, 15, 16, 19, 20],
      activedays: [1, 2, 3, 4, 5], // Monday to Friday
      averageSessionDuration: 15, // minutes
    };
  }

  async getUserNotificationPreferences(userId) {
    return {
      'in-app': true,
      email: true,
      sms: false,
      push: true,
    };
  }

  async getChannelPerformance(userId) {
    return {
      'in-app': 0.85,
      email: 0.65,
      sms: 0.9,
      push: 0.75,
    };
  }

  async getHistoricalSuccessRate(notification) {
    return 0.75; // 75% success rate
  }

  async getBehaviorPatternAdjustment(notification) {
    return 1.0; // No adjustment
  }

  getTimeBasedAdjustment(notification) {
    return 1.0; // No adjustment
  }

  findOptimalHour(activityPattern) {
    return activityPattern.peakHours[0] || 10; // Default to 10 AM
  }

  calculateNextOptimalTime(hour, timezone) {
    const now = new Date();
    const optimal = new Date();
    optimal.setHours(hour, 0, 0, 0);

    // If optimal time has passed today, schedule for tomorrow
    if (optimal <= now) {
      optimal.setDate(optimal.getDate() + 1);
    }

    return optimal.getTime();
  }

  translateContent(content, language) {
    // Mock translation - integrate with real translation service
    return content;
  }

  makeFormal(content) {
    return content.replace(/Hi/g, 'Dear').replace(/!/g, '.');
  }

  makeCasual(content) {
    return content.replace(/Dear/g, 'Hi').replace(/\./g, '!');
  }

  // =============================================
  // PUBLIC API
  // =============================================

  // Method to mark notification as read/engaged
  markAsEngaged(notificationId, userId) {
    const history = this.notificationHistory.get(userId) || [];
    const notification = history.find((n) => n.id === notificationId);

    if (notification) {
      notification.engaged = true;
      this.trackNotificationMetrics('engaged', { id: notificationId });
    }
  }

  // Method to get user's notifications
  getUserNotifications(userId, limit = 50) {
    const notifications = JSON.parse(
      localStorage.getItem(`notifications_${userId}`) || '[]'
    );
    return notifications.slice(0, limit);
  }

  // Method to clear user's notifications
  clearUserNotifications(userId) {
    localStorage.removeItem(`notifications_${userId}`);
    this.triggerInAppUpdate(userId);
  }
}

// =============================================
// EXPORT SERVICE
// =============================================

const intelligentNotificationService = new IntelligentNotificationService();
export default intelligentNotificationService;
