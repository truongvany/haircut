import api from './client';

export type PaymentMethod = 'cash' | 'bank_transfer';

export interface Payment {
  payment_id: number;
  booking_id: number;
  method: PaymentMethod;
  status: 'init' | 'paid' | 'failed' | 'refunded';
  amount: number;
  created_at: string;
  updated_at: string;
  salon_name: string;
  customer_name?: string;
}

export interface PaymentResponse {
  payment_id: number;
  booking_id: number;
  method: PaymentMethod;
  amount: number;
  status: string;
  message?: string;
}

/**
 * Create a new payment for a booking
 * @param bookingId - The booking ID
 * @param method - Payment method: 'cash' or 'bank_transfer'
 */
export async function createPayment(bookingId: number, method: PaymentMethod): Promise<PaymentResponse> {
  const { data } = await api.post('/v1/payments', {
    booking_id: bookingId,
    method
  });
  return data;
}

/**
 * Get payment details by payment ID
 */
export async function getPayment(paymentId: number): Promise<Payment> {
  const { data } = await api.get(`/v1/payments/${paymentId}`);
  return data;
}

/**
 * Get payment for a booking
 */
export async function getPaymentByBookingId(bookingId: number): Promise<Payment | null> {
  try {
    const { data } = await api.get(`/v1/bookings/${bookingId}/payment`);
    if (data.has_payment) {
      return data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Confirm payment as paid (for cash and bank transfer)
 * This marks the payment as paid when customer confirms they've paid
 */
export async function confirmPayment(paymentId: number): Promise<{ message: string; payment_id: number; status: string }> {
  const { data } = await api.post(`/v1/payments/${paymentId}/confirm`);
  return data;
}

/**
 * List all payments for the current user
 * @param bookingId - Optional: filter by booking ID
 */
export async function listPayments(bookingId?: number): Promise<{ items: Payment[] }> {
  const params = new URLSearchParams();
  if (bookingId) {
    params.append('booking_id', bookingId.toString());
  }
  const { data } = await api.get(`/v1/payments?${params.toString()}`);
  return data;
}
