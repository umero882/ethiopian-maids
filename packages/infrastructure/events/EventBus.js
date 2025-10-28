/**
 * Event Bus
 *
 * Simple in-memory event bus for domain event publishing and handling.
 * Can be extended to use Redis, RabbitMQ, or other message brokers.
 */

export class EventBus {
  constructor() {
    this.handlers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Subscribe to an event type
   * @param {string} eventType - Event type to subscribe to
   * @param {Function} handler - Handler function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Publish an event
   * @param {Object} event - Event to publish
   * @param {string} event.type - Event type
   * @param {Object} event.payload - Event payload
   * @param {Date} [event.occurredAt] - When the event occurred
   * @param {string} [event.aggregateId] - ID of the aggregate that produced the event
   * @returns {Promise<void>}
   */
  async publish(event) {
    // Validate event
    if (!event || !event.type) {
      throw new Error('Event must have a type');
    }

    // Add metadata
    const enrichedEvent = {
      ...event,
      occurredAt: event.occurredAt || new Date(),
      publishedAt: new Date(),
    };

    // Add to history
    this._addToHistory(enrichedEvent);

    // Get handlers for this event type
    const handlers = this.handlers.get(event.type) || [];

    // Execute all handlers
    const promises = handlers.map(handler => {
      try {
        return Promise.resolve(handler(enrichedEvent));
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
        return Promise.reject(error);
      }
    });

    // Wait for all handlers to complete
    await Promise.allSettled(promises);
  }

  /**
   * Publish multiple events
   * @param {Array<Object>} events - Array of events
   * @returns {Promise<void>}
   */
  async publishBatch(events) {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Get all subscribers for an event type
   * @param {string} eventType - Event type
   * @returns {Array<Function>} Array of handler functions
   */
  getSubscribers(eventType) {
    return this.handlers.get(eventType) || [];
  }

  /**
   * Clear all subscribers for an event type
   * @param {string} eventType - Event type
   */
  clearSubscribers(eventType) {
    this.handlers.delete(eventType);
  }

  /**
   * Clear all subscribers
   */
  clearAllSubscribers() {
    this.handlers.clear();
  }

  /**
   * Get event history
   * @param {Object} options - Filter options
   * @param {string} [options.type] - Filter by event type
   * @param {string} [options.aggregateId] - Filter by aggregate ID
   * @param {Date} [options.since] - Filter events since date
   * @param {number} [options.limit] - Limit number of events
   * @returns {Array<Object>} Array of events
   */
  getHistory(options = {}) {
    let history = [...this.eventHistory];

    // Filter by type
    if (options.type) {
      history = history.filter(e => e.type === options.type);
    }

    // Filter by aggregate ID
    if (options.aggregateId) {
      history = history.filter(e => e.aggregateId === options.aggregateId);
    }

    // Filter by date
    if (options.since) {
      history = history.filter(e => e.occurredAt >= options.since);
    }

    // Apply limit
    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Add event to history
   * @private
   */
  _addToHistory(event) {
    this.eventHistory.unshift(event);

    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }
  }
}

// Singleton instance
let eventBusInstance = null;

/**
 * Get the EventBus singleton instance
 * @returns {EventBus} Event bus instance
 */
export function getEventBus() {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

/**
 * Reset the EventBus instance (useful for testing)
 */
export function resetEventBus() {
  if (eventBusInstance) {
    eventBusInstance.clearAllSubscribers();
    eventBusInstance.clearHistory();
  }
  eventBusInstance = null;
}

export default getEventBus;
