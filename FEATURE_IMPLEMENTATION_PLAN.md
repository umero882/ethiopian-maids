# 🚀 Feature Implementation Plan

**Date**: 2025-10-11
**Current Status**: 92% Complete
**Target**: 98% Complete (Production Ready)

---

## 📊 Current Implementation Status

### ✅ What's Already Built:

1. **Booking System** - 70% Complete
   - ✅ Bookings page with tabs (all, pending, accepted, rejected, cancelled)
   - ✅ Booking card display with status indicators
   - ✅ View profile and message buttons
   - ✅ Contact info for accepted bookings
   - ⚠️ **Missing**: Create booking flow, payment integration

2. **Chat System** - 60% Complete
   - ✅ Chat UI with conversation list
   - ✅ Message display and input
   - ✅ Mock data working perfectly
   - ✅ User role indicators
   - ⚠️ **Missing**: Real-time messaging, database integration

3. **Payment System** - 15% Complete
   - ✅ Payment settings page exists
   - ✅ Payment service files created
   - ✅ Idempotency service for reliability
   - ⚠️ **Missing**: Stripe integration, booking payments, subscriptions

---

## 🎯 Implementation Priority

### **Phase 1: Complete Booking System** (Highest Priority)
**Why First**: Core feature, needed for MVP, users expect this

**Tasks**:
1. Create booking request flow from maid profile
2. Add booking creation service methods
3. Implement booking notifications
4. Add booking payment amount field
5. Test complete booking lifecycle

**Time Estimate**: 4-6 hours
**Impact**: HIGH - Core business functionality

---

### **Phase 2: Real-Time Chat** (High Priority)
**Why Second**: Communication is essential, UI already built

**Tasks**:
1. Integrate ChatContext with Supabase real-time
2. Replace mock data with database queries
3. Implement message sending/receiving
4. Add message notifications
5. Test across user types (sponsor/maid/agency)

**Time Estimate**: 6-8 hours
**Impact**: HIGH - User engagement

---

### **Phase 3: Payment Integration** (Medium-High Priority)
**Why Third**: Monetization, but booking can work without immediate payment

**Tasks**:
1. Set up Stripe API keys
2. Implement booking payment flow
3. Add subscription payment handling
4. Create payment confirmation pages
5. Test payment success/failure scenarios

**Time Estimate**: 8-10 hours
**Impact**: MEDIUM-HIGH - Business revenue

---

## 📋 Detailed Implementation Tasks

---

## 🎫 PHASE 1: Complete Booking System

### **Task 1.1: Create Booking Request from Maid Profile**

**File to Create**: `src/components/maids/BookingRequestDialog.jsx`

**Features**:
- Dialog/Modal that opens from maid profile "Book Now" button
- Form fields:
  - Start date (date picker)
  - End date (date picker)
  - Message to maid (textarea)
  - Special requirements (textarea)
  - Confirm amount (display only, from booking_requests.amount)
- Submit button with loading state
- Error handling and validation

**Integration Points**:
- Trigger from: `MaidDetailPage` or `MaidCard`
- Service method: `sponsorService.createBookingRequest()`
- Success: Show toast, navigate to bookings page

**Code Structure**:
```javascript
// BookingRequestDialog.jsx
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const BookingRequestDialog = ({ open, onClose, maid }) => {
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate dates
    // Call sponsorService.createBookingRequest()
    // Handle success/error
    // Navigate to bookings page
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Form content */}
    </Dialog>
  );
};
```

---

### **Task 1.2: Add Booking Service Methods**

**File to Modify**: `src/services/sponsorService.js`

**New Methods**:

```javascript
// Create a new booking request
async createBookingRequest(bookingData) {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .insert([{
        sponsor_id: bookingData.sponsor_id,
        maid_id: bookingData.maid_id,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        message: bookingData.message,
        special_requirements: bookingData.special_requirements,
        amount: bookingData.amount, // From migration 041
        currency: bookingData.currency || 'USD',
        payment_status: 'pending',
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { data: null, error };
  }
}

// Get single booking details
async getBookingDetails(bookingId) {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        maid:profiles!maid_id(id, name, avatar_url, email, phone, country)
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return { data: null, error };
  }
}

// Cancel a booking
async cancelBooking(bookingId, reason) {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .update({
        status: 'cancelled',
        rejection_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return { data: null, error };
  }
}
```

---

### **Task 1.3: Add Booking Notifications**

**File to Create**: `src/services/notificationService.js`

**Features**:
- Send notification when booking created
- Send notification when booking accepted/rejected
- Mark notifications as read
- Get unread count

**Code**:
```javascript
import { supabase } from '@/lib/databaseClient';

export const notificationService = {
  // Create notification
  async create(notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    return { data, error };
  },

  // Get user notifications
  async getByUser(userId, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await supabase;
    return { data, error };
  },

  // Mark as read
  async markAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();

    return { data, error };
  },

  // Create booking notification
  async notifyBookingCreated(booking) {
    return await this.create({
      user_id: booking.maid_id,
      type: 'booking',
      title: 'New Booking Request',
      message: `You have a new booking request from ${booking.sponsor_name}`,
      link: `/dashboard/maid/bookings`,
      related_id: booking.id,
      related_type: 'booking',
      priority: 'high',
    });
  },
};
```

---

### **Task 1.4: Update Maid Profile Page**

**File to Modify**: `src/pages/MaidDetailPage.jsx` (or similar)

**Changes**:
1. Add "Book Now" button
2. Import and use `BookingRequestDialog`
3. Pass maid data to dialog
4. Handle dialog open/close state

**Code Addition**:
```javascript
import { useState } from 'react';
import BookingRequestDialog from '@/components/maids/BookingRequestDialog';

// Inside component:
const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

// In JSX:
<Button
  size="lg"
  className="bg-purple-600 hover:bg-purple-700"
  onClick={() => setBookingDialogOpen(true)}
>
  <Calendar className="h-4 w-4 mr-2" />
  Book Now
</Button>

<BookingRequestDialog
  open={bookingDialogOpen}
  onClose={() => setBookingDialogOpen(false)}
  maid={maidData}
/>
```

---

## 💬 PHASE 2: Real-Time Chat

### **Task 2.1: Integrate ChatContext with Supabase**

**File to Modify**: `src/contexts/ChatContext.jsx`

**Changes**:
1. Replace mock conversations with database queries
2. Set up Supabase real-time subscriptions
3. Handle message send/receive
4. Update conversation list on new messages

**Key Methods**:
```javascript
// Fetch conversations
async function loadConversations() {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      receiver_id,
      content,
      read,
      created_at,
      sender:profiles!sender_id(name, avatar_url),
      receiver:profiles!receiver_id(name, avatar_url)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // Group by conversation partner
  // Return unique conversations
}

// Send message
async function sendMessage(receiverId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      sender_id: user.id,
      receiver_id: receiverId,
      content: content,
      read: false,
    }])
    .select()
    .single();

  return { data, error };
}

// Real-time subscription
useEffect(() => {
  const subscription = supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${user.id}`,
    }, (payload) => {
      // Add new message to state
      // Update conversation list
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [user]);
```

---

### **Task 2.2: Update Chat Page**

**File to Modify**: `src/pages/Chat.jsx`

**Changes**:
1. Remove mock data generators
2. Use ChatContext methods
3. Connect to real message sending
4. Handle real-time updates

---

## 💳 PHASE 3: Payment Integration

### **Task 3.1: Set Up Stripe**

**Files to Create/Modify**:
1. `.env` - Add Stripe keys
2. `src/config/stripe.js` - Stripe configuration
3. `src/services/stripeService.js` - Stripe API wrapper

**Environment Variables**:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_SECRET_KEY=sk_test_...
```

**Stripe Service**:
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
  // Create payment intent for booking
  async createBookingPayment(bookingId, amount, currency = 'USD') {
    // Call your backend API to create payment intent
    // Return client secret
  },

  // Confirm payment
  async confirmPayment(clientSecret, paymentMethod) {
    const stripe = await stripePromise;
    return await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod,
    });
  },
};
```

---

### **Task 3.2: Create Payment Flow**

**Files to Create**:
1. `src/components/payments/BookingPaymentDialog.jsx`
2. `src/components/payments/StripeCardElement.jsx`
3. `src/pages/PaymentConfirmation.jsx`

**Flow**:
1. User creates booking → Booking status: pending, payment_status: pending
2. System shows payment dialog
3. User enters card info
4. Payment processed via Stripe
5. Update booking payment_status to 'paid'
6. Send confirmation email
7. Show success page

---

## 🧪 Testing Checklist

### Booking System Tests:
- [ ] Create booking from maid profile
- [ ] View booking in bookings page
- [ ] Filter bookings by status
- [ ] Cancel booking
- [ ] Contact info shown for accepted bookings
- [ ] Notifications sent correctly

### Chat System Tests:
- [ ] View conversation list
- [ ] Select conversation and see messages
- [ ] Send message (appears in real-time)
- [ ] Receive message (appears in real-time)
- [ ] Unread count updates
- [ ] Search conversations

### Payment System Tests:
- [ ] Create booking with payment
- [ ] Enter card details (use test card: 4242 4242 4242 4242)
- [ ] Payment succeeds
- [ ] Booking payment_status updates
- [ ] Confirmation shown
- [ ] Payment fails gracefully
- [ ] Test refund flow

---

## 📈 Success Metrics

### After Phase 1 (Booking):
- ✅ Users can create bookings
- ✅ Bookings appear in dashboard
- ✅ Notifications work
- **Progress**: 94% Complete

### After Phase 2 (Chat):
- ✅ Real-time messaging works
- ✅ Conversation history persists
- ✅ All user types can chat
- **Progress**: 96% Complete

### After Phase 3 (Payment):
- ✅ Payments processed successfully
- ✅ Revenue tracking works
- ✅ Refunds handled
- **Progress**: 98% Complete (MVP Ready!)

---

## 🚀 Quick Start

### To Implement Booking System First:

1. Create `BookingRequestDialog.jsx`
2. Add methods to `sponsorService.js`
3. Update maid profile page
4. Test booking creation
5. Verify in bookings page

**Time**: 4-6 hours
**Files to Create**: 2
**Files to Modify**: 3

---

## 💡 Notes

- All database tables exist (booking_requests has payment columns from migration 041)
- Chat UI is fully built, just needs backend connection
- Payment service files exist, need Stripe integration
- Focus on one phase at a time for best results

---

**Which phase would you like to start with?**
1. **Booking System** (Recommended - highest business value)
2. **Chat System** (Good second choice - UI ready)
3. **Payment System** (Requires Stripe account setup)

Let me know and I'll implement it! 🎯
