-- =============================================
-- ADD AMOUNT COLUMN TO BOOKING_REQUESTS
-- Stores the payment amount for bookings
-- =============================================

-- Add amount column if it doesn't exist
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS amount numeric(10,2) DEFAULT 0.00;

-- Add currency column for amount
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'USD';

-- Add payment status column
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS payment_status varchar(20) DEFAULT 'pending'
CONSTRAINT booking_payment_status_check CHECK (
  payment_status IN ('pending', 'paid', 'refunded', 'failed', 'cancelled')
);

-- Add payment method column
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS payment_method varchar(50);

-- Add payment date column
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS payment_date timestamptz;

-- Add payment reference/transaction ID
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS payment_reference varchar(255);

-- Create index on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_booking_requests_payment_status
ON public.booking_requests USING btree (payment_status);

-- Add comment
COMMENT ON COLUMN public.booking_requests.amount IS 'Payment amount for the booking';
COMMENT ON COLUMN public.booking_requests.currency IS 'Currency code (ISO 4217)';
COMMENT ON COLUMN public.booking_requests.payment_status IS 'Current payment status';
COMMENT ON COLUMN public.booking_requests.payment_reference IS 'Payment gateway transaction reference';

SELECT 'Booking payment columns added successfully' as status;
