/**
 * EventBus - In-memory event bus with outbox pattern support
 *
 * Publishes domain events to subscribers and persists to outbox for reliability.
 */

export class EventBus {
  constructor(supabaseClient = null) {
    this.supabase = supabaseClient;
    this.subscribers = new Map();
  }

  /**
   * Subscribe to event type
   */
  on(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push(handler);
  }

  /**
   * Unsubscribe from event type
   */
  off(eventType, handler) {
    if (!this.subscribers.has(eventType)) return;

    const handlers = this.subscribers.get(eventType);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Publish event to subscribers and outbox
   */
  async publish(event) {
    const { type, payload, metadata = {} } = event;

    // 1. Persist to outbox table (for reliability)
    if (this.supabase) {
      await this._saveToOutbox(event);
    }

    // 2. Notify in-memory subscribers
    const handlers = this.subscribers.get(type) || [];

    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Event handler failed for ${type}:`, error);
        // Log but don't throw - one handler failure shouldn't break others
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Save event to outbox table for guaranteed delivery
   */
  async _saveToOutbox(event) {
    try {
      const { error } = await this.supabase
        .from('event_outbox')
        .insert({
          event_type: event.type,
          payload: event.payload,
          metadata: event.metadata || {},
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to save event to outbox:', error);
      }
    } catch (error) {
      console.error('Failed to save event to outbox:', error);
    }
  }

  /**
   * Process outbox events (called by worker)
   */
  async processOutbox() {
    if (!this.supabase) {
      throw new Error('Supabase client required for outbox processing');
    }

    // Get pending events
    const { data: events, error } = await this.supabase
      .from('event_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Failed to fetch outbox events:', error);
      return;
    }

    // Process each event
    for (const eventRecord of events || []) {
      try {
        const event = {
          type: eventRecord.event_type,
          payload: eventRecord.payload,
          metadata: eventRecord.metadata,
        };

        // Publish to subscribers
        await this.publish(event);

        // Mark as processed
        await this.supabase
          .from('event_outbox')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', eventRecord.id);

      } catch (error) {
        console.error(`Failed to process outbox event ${eventRecord.id}:`, error);

        // Mark as failed
        await this.supabase
          .from('event_outbox')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', eventRecord.id);
      }
    }
  }
}

/**
 * Create event outbox table (run once)
 */
export const createEventOutboxTable = `
CREATE TABLE IF NOT EXISTS event_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_outbox_status ON event_outbox(status);
CREATE INDEX IF NOT EXISTS idx_event_outbox_created_at ON event_outbox(created_at);
`;
