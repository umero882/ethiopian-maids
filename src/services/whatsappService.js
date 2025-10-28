/**
 * WhatsApp Service
 * Handles WhatsApp message and booking operations
 * Follows Ethiopian Maids service pattern
 */

import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('WhatsAppService');

/**
 * Fetch WhatsApp messages with pagination and filtering
 * @param {Object} options - Query options
 * @param {string} options.phoneNumber - Filter by phone number
 * @param {number} options.limit - Number of messages to fetch
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.sender - Filter by sender (user/assistant)
 * @returns {Promise<Object>} Messages data with pagination info
 */
export const fetchMessages = async ({
  phoneNumber = null,
  limit = 50,
  offset = 0,
  sender = null,
} = {}) => {
  try {
    let query = supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .order('received_at', { ascending: false });

    if (phoneNumber) {
      query = query.eq('phone_number', phoneNumber);
    }

    if (sender) {
      query = query.eq('sender', sender);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      log.error('Error fetching messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return {
      messages: data || [],
      total: count || 0,
      limit,
      offset,
    };
  } catch (error) {
    log.error('fetchMessages error:', error);
    throw error;
  }
};

/**
 * Fetch conversation history for a specific phone number
 * @param {string} phoneNumber - Phone number to fetch conversation for
 * @param {number} limit - Maximum number of messages
 * @returns {Promise<Array>} Array of messages
 */
export const fetchConversation = async (phoneNumber, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('received_at', { ascending: true })
      .limit(limit);

    if (error) {
      log.error('Error fetching conversation:', error);
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    log.error('fetchConversation error:', error);
    throw error;
  }
};

/**
 * Get unique phone numbers (contacts)
 * @param {number} limit - Maximum number of contacts
 * @returns {Promise<Array>} Array of phone numbers with metadata
 */
export const fetchContacts = async (limit = 100) => {
  try {
    // Get distinct phone numbers with latest message
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('phone_number, message_content, received_at, sender')
      .order('received_at', { ascending: false });

    if (error) {
      log.error('Error fetching contacts:', error);
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    // Group by phone number and get latest message for each
    const contactMap = new Map();

    data?.forEach(msg => {
      if (!contactMap.has(msg.phone_number)) {
        contactMap.set(msg.phone_number, {
          phone_number: msg.phone_number,
          last_message: msg.message_content,
          last_message_at: msg.received_at,
          last_sender: msg.sender,
        });
      }
    });

    return Array.from(contactMap.values()).slice(0, limit);
  } catch (error) {
    log.error('fetchContacts error:', error);
    throw error;
  }
};

/**
 * Fetch bookings with filtering
 * @param {Object} options - Query options
 * @param {string} options.phoneNumber - Filter by phone number
 * @param {string} options.status - Filter by status
 * @param {string} options.bookingType - Filter by booking type
 * @param {Date} options.startDate - Filter by start date
 * @param {Date} options.endDate - Filter by end date
 * @param {number} options.limit - Number of bookings to fetch
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Object>} Bookings data with pagination info
 */
export const fetchBookings = async ({
  phoneNumber = null,
  status = null,
  bookingType = null,
  startDate = null,
  endDate = null,
  limit = 50,
  offset = 0,
} = {}) => {
  try {
    let query = supabase
      .from('maid_bookings')
      .select('*, maid_profiles(id, full_name, age)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (phoneNumber) {
      query = query.eq('phone_number', phoneNumber);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (bookingType) {
      query = query.eq('booking_type', bookingType);
    }

    if (startDate) {
      query = query.gte('booking_date', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('booking_date', endDate.toISOString());
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      log.error('Error fetching bookings:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    return {
      bookings: data || [],
      total: count || 0,
      limit,
      offset,
    };
  } catch (error) {
    log.error('fetchBookings error:', error);
    throw error;
  }
};

/**
 * Get booking statistics
 * @returns {Promise<Object>} Booking statistics
 */
export const getBookingStats = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_booking_stats');

    if (error) {
      log.error('Error fetching booking stats:', error);
      throw new Error(`Failed to fetch booking stats: ${error.message}`);
    }

    return data || {
      total_bookings: 0,
      pending_bookings: 0,
      confirmed_bookings: 0,
      cancelled_bookings: 0,
      completed_bookings: 0,
    };
  } catch (error) {
    log.error('getBookingStats error:', error);
    // Return default stats on error
    return {
      total_bookings: 0,
      pending_bookings: 0,
      confirmed_bookings: 0,
      cancelled_bookings: 0,
      completed_bookings: 0,
    };
  }
};

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Updated booking
 */
export const updateBookingStatus = async (bookingId, status, notes = null) => {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('maid_bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select('*, maid_profiles(id, full_name)')
      .single();

    if (error) {
      log.error('Error updating booking status:', error);
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    log.info(`Booking ${bookingId} status updated to ${status}`);
    return data;
  } catch (error) {
    log.error('updateBookingStatus error:', error);
    throw error;
  }
};

/**
 * Update booking with any fields
 * @param {string} bookingId - Booking ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated booking
 */
export const updateBooking = async (bookingId, updates) => {
  try {
    const { data, error } = await supabase
      .from('maid_bookings')
      .update(updates)
      .eq('id', bookingId)
      .select('*, maid_profiles(id, full_name)')
      .single();

    if (error) {
      log.error('Error updating booking:', error);
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    log.info(`Booking ${bookingId} updated`);
    return { data, error: null };
  } catch (error) {
    log.error('updateBooking error:', error);
    return { data: null, error };
  }
};

/**
 * Delete booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Result
 */
export const deleteBooking = async (bookingId) => {
  try {
    const { error } = await supabase
      .from('maid_bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      log.error('Error deleting booking:', error);
      throw new Error(`Failed to delete booking: ${error.message}`);
    }

    log.info(`Booking ${bookingId} deleted`);
    return { error: null };
  } catch (error) {
    log.error('deleteBooking error:', error);
    return { error };
  }
};

/**
 * Fetch platform settings
 * @returns {Promise<Object>} Platform settings
 */
export const getPlatformSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .single();

    if (error) {
      log.error('Error fetching platform settings:', error);
      throw new Error(`Failed to fetch platform settings: ${error.message}`);
    }

    return data || {};
  } catch (error) {
    log.error('getPlatformSettings error:', error);
    throw error;
  }
};

/**
 * Update platform settings
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
export const updatePlatformSettings = async (settings) => {
  try {
    const { data: existingSettings } = await supabase
      .from('platform_settings')
      .select('id')
      .single();

    if (!existingSettings) {
      throw new Error('Platform settings not found');
    }

    const { data, error } = await supabase
      .from('platform_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSettings.id)
      .select()
      .single();

    if (error) {
      log.error('Error updating platform settings:', error);
      throw new Error(`Failed to update platform settings: ${error.message}`);
    }

    log.info('Platform settings updated successfully');
    return data;
  } catch (error) {
    log.error('updatePlatformSettings error:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time message updates
 * @param {Function} callback - Callback function for new messages
 * @returns {Object} Subscription object
 */
export const subscribeToMessages = (callback) => {
  try {
    const subscription = supabase
      .channel('whatsapp_messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        (payload) => {
          log.info('New message received:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  } catch (error) {
    log.error('subscribeToMessages error:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time booking updates
 * @param {Function} callback - Callback function for booking changes
 * @returns {Object} Subscription object
 */
export const subscribeToBookings = (callback) => {
  try {
    const subscription = supabase
      .channel('maid_bookings_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maid_bookings',
        },
        (payload) => {
          log.info('Booking updated:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  } catch (error) {
    log.error('subscribeToBookings error:', error);
    throw error;
  }
};

/**
 * Unsubscribe from real-time channel
 * @param {Object} subscription - Subscription to unsubscribe
 */
export const unsubscribe = async (subscription) => {
  try {
    if (subscription) {
      await supabase.removeChannel(subscription);
      log.info('Unsubscribed from channel');
    }
  } catch (error) {
    log.error('unsubscribe error:', error);
  }
};

/**
 * Search messages by content
 * @param {string} searchTerm - Search term
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Matching messages
 */
export const searchMessages = async (searchTerm, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .ilike('message_content', `%${searchTerm}%`)
      .order('received_at', { ascending: false })
      .limit(limit);

    if (error) {
      log.error('Error searching messages:', error);
      throw new Error(`Failed to search messages: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    log.error('searchMessages error:', error);
    throw error;
  }
};

/**
 * Export bookings to CSV format
 * @param {Object} filters - Filter options (same as fetchBookings)
 * @returns {Promise<string>} CSV string
 */
export const exportBookingsToCSV = async (filters = {}) => {
  try {
    const { bookings } = await fetchBookings({ ...filters, limit: 1000 });

    const headers = [
      'ID',
      'Phone Number',
      'Sponsor Name',
      'Maid Name',
      'Booking Type',
      'Booking Date',
      'Status',
      'Notes',
      'Created At',
    ];

    const rows = bookings.map(booking => [
      booking.id,
      booking.phone_number,
      booking.sponsor_name || 'N/A',
      booking.maid_name || booking.maid_profiles?.full_name || 'N/A',
      booking.booking_type,
      booking.booking_date || 'Not scheduled',
      booking.status,
      booking.notes || '',
      booking.created_at,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  } catch (error) {
    log.error('exportBookingsToCSV error:', error);
    throw error;
  }
};

export default {
  fetchMessages,
  fetchConversation,
  fetchContacts,
  fetchBookings,
  getBookingStats,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getPlatformSettings,
  updatePlatformSettings,
  subscribeToMessages,
  subscribeToBookings,
  unsubscribe,
  searchMessages,
  exportBookingsToCSV,
};
