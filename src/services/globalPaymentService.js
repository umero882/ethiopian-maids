/**
 * 💰 Global Payment Service
 * Multi-currency payment processing with AI-powered fraud detection and localization
 */

import userAnalytics from '@/utils/userAnalytics';
import productionMonitor from '@/utils/productionMonitoring';

class GlobalPaymentService {
  constructor() {
    this.supportedCurrencies = {
      USD: {
        name: 'US Dollar',
        symbol: '$',
        code: 'USD',
        decimals: 2,
        region: 'global',
      },
      SAR: {
        name: 'Saudi Riyal',
        symbol: 'ر.س',
        code: 'SAR',
        decimals: 2,
        region: 'gcc',
      },
      AED: {
        name: 'UAE Dirham',
        symbol: 'د.إ',
        code: 'AED',
        decimals: 2,
        region: 'gcc',
      },
      QAR: {
        name: 'Qatari Riyal',
        symbol: 'ر.ق',
        code: 'QAR',
        decimals: 2,
        region: 'gcc',
      },
      KWD: {
        name: 'Kuwaiti Dinar',
        symbol: 'د.ك',
        code: 'KWD',
        decimals: 3,
        region: 'gcc',
      },
      BHD: {
        name: 'Bahraini Dinar',
        symbol: 'د.ب',
        code: 'BHD',
        decimals: 3,
        region: 'gcc',
      },
      OMR: {
        name: 'Omani Rial',
        symbol: 'ر.ع.',
        code: 'OMR',
        decimals: 3,
        region: 'gcc',
      },
      SGD: {
        name: 'Singapore Dollar',
        symbol: 'S$',
        code: 'SGD',
        decimals: 2,
        region: 'sea',
      },
      MYR: {
        name: 'Malaysian Ringgit',
        symbol: 'RM',
        code: 'MYR',
        decimals: 2,
        region: 'sea',
      },
      THB: {
        name: 'Thai Baht',
        symbol: '฿',
        code: 'THB',
        decimals: 2,
        region: 'sea',
      },
      IDR: {
        name: 'Indonesian Rupiah',
        symbol: 'Rp',
        code: 'IDR',
        decimals: 0,
        region: 'sea',
      },
      PHP: {
        name: 'Philippine Peso',
        symbol: '₱',
        code: 'PHP',
        decimals: 2,
        region: 'sea',
      },
      VND: {
        name: 'Vietnamese Dong',
        symbol: '₫',
        code: 'VND',
        decimals: 0,
        region: 'sea',
      },
      ETB: {
        name: 'Ethiopian Birr',
        symbol: 'Br',
        code: 'ETB',
        decimals: 2,
        region: 'africa',
      },
      EUR: {
        name: 'Euro',
        symbol: '€',
        code: 'EUR',
        decimals: 2,
        region: 'europe',
      },
      GBP: {
        name: 'British Pound',
        symbol: '£',
        code: 'GBP',
        decimals: 2,
        region: 'europe',
      },
    };

    this.paymentMethods = {
      gcc: [
        'card',
        'apple_pay',
        'google_pay',
        'stc_pay',
        'mada',
        'bank_transfer',
      ],
      sea: [
        'card',
        'apple_pay',
        'google_pay',
        'grabpay',
        'dana',
        'ovo',
        'bank_transfer',
      ],
      global: ['card', 'apple_pay', 'google_pay', 'paypal', 'bank_transfer'],
    };

    this.exchangeRates = new Map();
    this.fraudDetectionAI = this.initializeFraudDetection();
    this.paymentCache = new Map();

    this.loadExchangeRates();
    this.startRateUpdater();
  }

  // =============================================
  // FRAUD DETECTION AI
  // =============================================

  initializeFraudDetection() {
    return {
      riskFactors: {
        velocityCheck: 0.3,
        geolocationRisk: 0.25,
        deviceFingerprint: 0.2,
        behaviorAnalysis: 0.15,
        amountAnalysis: 0.1,
      },
      learningData: this.loadFraudLearningData(),
      riskThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
      },
    };
  }

  loadFraudLearningData() {
    try {
      const data = localStorage.getItem('fraudDetection_learningData');
      return data
        ? JSON.parse(data)
        : {
            suspiciousPatterns: [],
            trustedUsers: new Set(),
            riskIndicators: {},
            geographicRisks: {},
          };
    } catch {
      return {
        suspiciousPatterns: [],
        trustedUsers: new Set(),
        riskIndicators: {},
        geographicRisks: {},
      };
    }
  }

  // =============================================
  // CORE PAYMENT PROCESSING
  // =============================================

  async processPayment(paymentData) {
    try {
      // Step 1: Validate payment data
      const validation = await this.validatePaymentData(paymentData);
      if (!validation.valid) {
        throw new Error(
          `Payment validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Step 2: Fraud detection
      const fraudCheck = await this.performFraudDetection(paymentData);
      if (fraudCheck.riskLevel === 'high') {
        throw new Error('Payment blocked due to high fraud risk');
      }

      // Step 3: Currency conversion if needed
      const processedAmount = await this.handleCurrencyConversion(paymentData);

      // Step 4: Process payment through appropriate gateway
      const paymentResult = await this.processWithGateway(
        paymentData,
        processedAmount
      );

      // Step 5: Record transaction
      const transaction = await this.recordTransaction(
        paymentData,
        paymentResult,
        fraudCheck
      );

      // Step 6: Update fraud learning data
      this.updateFraudLearningData(paymentData, paymentResult, fraudCheck);

      // Step 7: Track payment metrics
      this.trackPaymentMetrics(paymentData, paymentResult);

      return {
        success: true,
        transactionId: transaction.id,
        amount: processedAmount,
        currency: paymentData.currency,
        fraudRisk: fraudCheck.riskLevel,
        paymentMethod: paymentData.method,
        timestamp: Date.now(),
      };
    } catch (error) {
      productionMonitor.reportError('Payment Processing Error', {
        error: error.message,
        paymentData: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          method: paymentData.method,
          userId: paymentData.userId,
        },
      });

      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  async validatePaymentData(paymentData) {
    const errors = [];

    // Required fields
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Invalid amount');
    }

    if (
      !paymentData.currency ||
      !this.supportedCurrencies[paymentData.currency]
    ) {
      errors.push('Unsupported currency');
    }

    if (!paymentData.method) {
      errors.push('Payment method required');
    }

    if (!paymentData.userId) {
      errors.push('User ID required');
    }

    // Amount limits
    const limits = this.getPaymentLimits(paymentData.currency);
    if (paymentData.amount < limits.min || paymentData.amount > limits.max) {
      errors.push(
        `Amount must be between ${limits.min} and ${limits.max} ${paymentData.currency}`
      );
    }

    // Method availability
    const userRegion = await this.getUserRegion(paymentData.userId);
    const availableMethods =
      this.paymentMethods[userRegion] || this.paymentMethods.global;
    if (!availableMethods.includes(paymentData.method)) {
      errors.push('Payment method not available in your region');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async performFraudDetection(paymentData) {
    const riskFactors = {};

    // Velocity check - multiple payments in short time
    riskFactors.velocity = await this.checkPaymentVelocity(paymentData.userId);

    // Geolocation risk - unusual location
    riskFactors.geolocation = await this.checkGeolocationRisk(paymentData);

    // Device fingerprint - new or suspicious device
    riskFactors.device = await this.checkDeviceRisk(paymentData);

    // Behavior analysis - unusual payment patterns
    riskFactors.behavior = await this.analyzeBehaviorRisk(paymentData);

    // Amount analysis - unusually large amounts
    riskFactors.amount = this.analyzeAmountRisk(paymentData);

    // Calculate overall risk score
    const riskScore = Object.entries(riskFactors).reduce(
      (total, [factor, score]) => {
        return total + score * this.fraudDetectionAI.riskFactors[factor];
      },
      0
    );

    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= this.fraudDetectionAI.riskThresholds.high) {
      riskLevel = 'high';
    } else if (riskScore >= this.fraudDetectionAI.riskThresholds.medium) {
      riskLevel = 'medium';
    }

    return {
      riskScore,
      riskLevel,
      riskFactors,
      recommendations: this.generateRiskRecommendations(riskLevel, riskFactors),
    };
  }

  async handleCurrencyConversion(paymentData) {
    const { amount, currency, targetCurrency } = paymentData;

    // No conversion needed
    if (!targetCurrency || currency === targetCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        currency: currency,
        exchangeRate: 1,
        conversionFee: 0,
      };
    }

    // Get exchange rate
    const exchangeRate = await this.getExchangeRate(currency, targetCurrency);
    if (!exchangeRate) {
      throw new Error(
        `Exchange rate not available for ${currency} to ${targetCurrency}`
      );
    }

    // Calculate converted amount
    const convertedAmount = amount * exchangeRate.rate;
    const conversionFee = convertedAmount * 0.025; // 2.5% conversion fee

    return {
      originalAmount: amount,
      convertedAmount: convertedAmount + conversionFee,
      currency: targetCurrency,
      exchangeRate: exchangeRate.rate,
      conversionFee,
      timestamp: exchangeRate.timestamp,
    };
  }

  async processWithGateway(paymentData, processedAmount) {
    const gateway = this.selectPaymentGateway(paymentData);

    switch (gateway) {
      case 'stripe':
        return this.processWithStripe(paymentData, processedAmount);
      case 'paypal':
        return this.processWithPayPal(paymentData, processedAmount);
      case 'local_gateway':
        return this.processWithLocalGateway(paymentData, processedAmount);
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }

  // =============================================
  // EXCHANGE RATE MANAGEMENT
  // =============================================

  async loadExchangeRates() {
    try {
      // In production, fetch from reliable exchange rate API
      // For now, use mock rates
      const mockRates = {
        'USD-SAR': { rate: 3.75, timestamp: Date.now() },
        'USD-AED': { rate: 3.67, timestamp: Date.now() },
        'USD-QAR': { rate: 3.64, timestamp: Date.now() },
        'USD-KWD': { rate: 0.3, timestamp: Date.now() },
        'USD-BHD': { rate: 0.38, timestamp: Date.now() },
        'USD-OMR': { rate: 0.38, timestamp: Date.now() },
        'USD-SGD': { rate: 1.35, timestamp: Date.now() },
        'USD-MYR': { rate: 4.2, timestamp: Date.now() },
        'USD-ETB': { rate: 55.5, timestamp: Date.now() },
      };

      Object.entries(mockRates).forEach(([pair, data]) => {
        this.exchangeRates.set(pair, data);
        // Also set reverse rate
        const [from, to] = pair.split('-');
        this.exchangeRates.set(`${to}-${from}`, {
          rate: 1 / data.rate,
          timestamp: data.timestamp,
        });
      });
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  }

  async getExchangeRate(fromCurrency, toCurrency) {
    const pair = `${fromCurrency}-${toCurrency}`;
    const rate = this.exchangeRates.get(pair);

    if (!rate) {
      // Try to get rate via USD
      const fromUSD = this.exchangeRates.get(`USD-${fromCurrency}`);
      const toUSD = this.exchangeRates.get(`USD-${toCurrency}`);

      if (fromUSD && toUSD) {
        return {
          rate: toUSD.rate / fromUSD.rate,
          timestamp: Math.min(fromUSD.timestamp, toUSD.timestamp),
          indirect: true,
        };
      }
    }

    return rate;
  }

  startRateUpdater() {
    // Update exchange rates every 5 minutes
    setInterval(
      () => {
        this.loadExchangeRates();
      },
      5 * 60 * 1000
    );
  }

  // =============================================
  // PAYMENT GATEWAY INTEGRATIONS
  // =============================================

  async processWithStripe(paymentData, processedAmount) {
    // Stripe integration for global payments
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(processedAmount.convertedAmount * 100), // Stripe uses cents
      currency: processedAmount.currency.toLowerCase(),
      status: 'succeeded',
      payment_method: paymentData.method,
      created: Date.now(),
    };

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      gateway: 'stripe',
      gatewayTransactionId: paymentIntent.id,
      status: 'completed',
      amount: processedAmount.convertedAmount,
      currency: processedAmount.currency,
      fees: processedAmount.convertedAmount * 0.029 + 0.3, // Stripe fees
    };
  }

  async processWithPayPal(paymentData, processedAmount) {
    // PayPal integration
    const payment = {
      id: `PAY-${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      state: 'approved',
      amount: processedAmount.convertedAmount,
      currency: processedAmount.currency,
      created_time: new Date().toISOString(),
    };

    await new Promise((resolve) => setTimeout(resolve, 1200));

    return {
      gateway: 'paypal',
      gatewayTransactionId: payment.id,
      status: 'completed',
      amount: processedAmount.convertedAmount,
      currency: processedAmount.currency,
      fees: processedAmount.convertedAmount * 0.034 + 0.35, // PayPal fees
    };
  }

  async processWithLocalGateway(paymentData, processedAmount) {
    // Local payment gateway for regional methods
    const transaction = {
      id: `LOCAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'success',
      amount: processedAmount.convertedAmount,
      currency: processedAmount.currency,
      method: paymentData.method,
      timestamp: Date.now(),
    };

    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      gateway: 'local_gateway',
      gatewayTransactionId: transaction.id,
      status: 'completed',
      amount: processedAmount.convertedAmount,
      currency: processedAmount.currency,
      fees: processedAmount.convertedAmount * 0.025, // Local gateway fees
    };
  }

  // =============================================
  // RISK ANALYSIS METHODS
  // =============================================

  async checkPaymentVelocity(userId) {
    // Check recent payment frequency
    const recentPayments = await this.getRecentPayments(userId, 24); // Last 24 hours

    if (recentPayments.length > 10) return 1.0; // Very high risk
    if (recentPayments.length > 5) return 0.7; // High risk
    if (recentPayments.length > 2) return 0.4; // Medium risk
    return 0.1; // Low risk
  }

  async checkGeolocationRisk(paymentData) {
    // Check if payment location is unusual for user
    const userLocation = await this.getUserLocation(paymentData.userId);
    const paymentLocation = paymentData.location;

    if (!userLocation || !paymentLocation) return 0.3; // Unknown location

    const distance = this.calculateDistance(userLocation, paymentLocation);

    if (distance > 5000) return 0.9; // Very far from usual location
    if (distance > 1000) return 0.6; // Far from usual location
    if (distance > 100) return 0.3; // Somewhat far
    return 0.1; // Close to usual location
  }

  async checkDeviceRisk(paymentData) {
    // Check device fingerprint
    const deviceId = paymentData.deviceId;
    const knownDevices = await this.getUserDevices(paymentData.userId);

    if (!deviceId) return 0.5; // Unknown device
    if (knownDevices.includes(deviceId)) return 0.1; // Known device
    return 0.7; // New device
  }

  async analyzeBehaviorRisk(paymentData) {
    // Analyze payment behavior patterns
    const userPayments = await this.getUserPaymentHistory(paymentData.userId);

    if (userPayments.length === 0) return 0.6; // New user

    const avgAmount =
      userPayments.reduce((sum, p) => sum + p.amount, 0) / userPayments.length;
    const amountDeviation =
      Math.abs(paymentData.amount - avgAmount) / avgAmount;

    if (amountDeviation > 5) return 0.9; // Very unusual amount
    if (amountDeviation > 2) return 0.6; // Unusual amount
    if (amountDeviation > 1) return 0.3; // Somewhat unusual
    return 0.1; // Normal amount
  }

  analyzeAmountRisk(paymentData) {
    // Analyze amount-based risk
    const limits = this.getPaymentLimits(paymentData.currency);
    const ratio = paymentData.amount / limits.max;

    if (ratio > 0.8) return 0.8; // Very high amount
    if (ratio > 0.5) return 0.5; // High amount
    if (ratio > 0.2) return 0.2; // Medium amount
    return 0.1; // Low amount
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  selectPaymentGateway(paymentData) {
    const region = this.getUserRegionSync(paymentData.userId);
    const method = paymentData.method;

    // Regional gateway selection
    if (region === 'gcc' && ['mada', 'stc_pay'].includes(method)) {
      return 'local_gateway';
    }

    if (region === 'sea' && ['grabpay', 'dana', 'ovo'].includes(method)) {
      return 'local_gateway';
    }

    if (method === 'paypal') {
      return 'paypal';
    }

    return 'stripe'; // Default to Stripe
  }

  getPaymentLimits(currency) {
    const limits = {
      USD: { min: 1, max: 10000 },
      SAR: { min: 4, max: 37500 },
      AED: { min: 4, max: 36700 },
      QAR: { min: 4, max: 36400 },
      KWD: { min: 0.3, max: 3000 },
      SGD: { min: 1.5, max: 13500 },
      ETB: { min: 55, max: 555000 },
    };

    return limits[currency] || limits.USD;
  }

  formatCurrency(amount, currency) {
    const currencyInfo = this.supportedCurrencies[currency];
    if (!currencyInfo) return `${amount} ${currency}`;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals,
    }).format(amount);
  }

  generateRiskRecommendations(riskLevel, riskFactors) {
    const recommendations = [];

    if (riskLevel === 'high') {
      recommendations.push('Block payment and require manual review');
      recommendations.push('Request additional verification');
    } else if (riskLevel === 'medium') {
      recommendations.push('Require 3D Secure authentication');
      recommendations.push('Send notification to user');
    }

    if (riskFactors.velocity > 0.5) {
      recommendations.push('Implement payment velocity limits');
    }

    if (riskFactors.geolocation > 0.5) {
      recommendations.push('Verify user location');
    }

    return recommendations;
  }

  // Mock data methods (replace with real implementations)
  async getUserRegion(userId) {
    return 'gcc';
  }
  getUserRegionSync(userId) {
    return 'gcc';
  }
  async getRecentPayments(userId, hours) {
    return [];
  }
  async getUserLocation(userId) {
    return { lat: 24.7136, lng: 46.6753 };
  }
  async getUserDevices(userId) {
    return [];
  }
  async getUserPaymentHistory(userId) {
    return [];
  }

  calculateDistance(loc1, loc2) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async recordTransaction(paymentData, paymentResult, fraudCheck) {
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: paymentData.userId,
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      method: paymentData.method,
      gateway: paymentResult.gateway,
      gatewayTransactionId: paymentResult.gatewayTransactionId,
      status: paymentResult.status,
      fraudRisk: fraudCheck.riskLevel,
      fees: paymentResult.fees,
      timestamp: Date.now(),
    };

    // Store transaction (in production, save to database)
    const transactions = JSON.parse(
      localStorage.getItem('transactions') || '[]'
    );
    transactions.unshift(transaction);
    localStorage.setItem(
      'transactions',
      JSON.stringify(transactions.slice(0, 1000))
    );

    return transaction;
  }

  updateFraudLearningData(paymentData, paymentResult, fraudCheck) {
    // Update AI learning data based on payment outcome
    const learningData = this.fraudDetectionAI.learningData;

    if (
      paymentResult.status === 'completed' &&
      fraudCheck.riskLevel === 'low'
    ) {
      learningData.trustedUsers.add(paymentData.userId);
    }

    // Save updated learning data
    localStorage.setItem(
      'fraudDetection_learningData',
      JSON.stringify({
        ...learningData,
        trustedUsers: Array.from(learningData.trustedUsers),
      })
    );
  }

  trackPaymentMetrics(paymentData, paymentResult) {
    userAnalytics.trackConversion('payment_processed', {
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      method: paymentData.method,
      gateway: paymentResult.gateway,
      status: paymentResult.status,
      timestamp: Date.now(),
    });
  }

  // =============================================
  // PUBLIC API
  // =============================================

  getSupportedCurrencies() {
    return this.supportedCurrencies;
  }

  getPaymentMethods(region = 'global') {
    return this.paymentMethods[region] || this.paymentMethods.global;
  }

  async getExchangeRatePublic(from, to) {
    return this.getExchangeRate(from, to);
  }

  async convertCurrency(amount, from, to) {
    const rate = await this.getExchangeRate(from, to);
    if (!rate) return null;

    return {
      originalAmount: amount,
      convertedAmount: amount * rate.rate,
      exchangeRate: rate.rate,
      timestamp: rate.timestamp,
    };
  }
}

// =============================================
// EXPORT SERVICE
// =============================================

const globalPaymentService = new GlobalPaymentService();
export default globalPaymentService;
