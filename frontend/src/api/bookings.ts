import api from "./client";

// Define the structure of a Booking object (matching backend response)
export type Booking = {
  id: number;
  salonId?: number;
  salonName?: string | null;
  customerId: number; // Assuming backend returns customer_id as customerId
  stylistId?: number | null; // Assuming backend returns stylist_id as stylistId
  appointmentAt: string; // Keep as string (e.g., "2025-10-25 10:00:00")
  totalMinutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  totalAmt: number;
  // Optional readable names returned by backend JOINs
  customerName?: string | null;
  stylistName?: string | null;
};

// Function to get bookings for a specific salon and date
export async function listBookingsBySalonDate(salonId: number, date: string) {
  // 'date' should be in 'YYYY-MM-DD' format
  const { data } = await api.get(`/v1/bookings`, {
    params: { salon_id: salonId, date: date } // Use snake_case for query params as defined in backend
  });
  // Backend returns items with snake_case keys (customer_id, stylist_id, appointment_at, total_minutes, total_amt)
  // Map them to the frontend Booking shape (camelCase)
  const items = (data.items || []).map((r: any) => ({
    id: Number(r.id),
    customerId: r.customer_id !== undefined ? Number(r.customer_id) : undefined,
    stylistId: r.stylist_id !== undefined && r.stylist_id !== null ? Number(r.stylist_id) : undefined,
    appointmentAt: r.appointment_at ?? '',
    totalMinutes: r.total_minutes !== undefined ? Number(r.total_minutes) : undefined,
    status: r.status,
    totalAmt: r.total_amt !== undefined ? Number(r.total_amt) : undefined,
    customerName: r.customer_name ?? null,
    stylistName: r.stylist_name ?? null,
  } as Booking));
  return { items } as { items: Booking[] };
}

// List bookings for current authenticated user
export async function listMyBookings() {
  const { data } = await api.get('/v1/bookings/mine');
  const items = (data.items || []).map((r: any) => ({
    id: Number(r.id),
    salonId: r.salonId !== undefined ? Number(r.salonId) : undefined,
    
    customerId: r.customerId !== undefined ? Number(r.customerId) : undefined,
    stylistId: r.stylistId !== undefined && r.stylistId !== null ? Number(r.stylistId) : undefined,
    appointmentAt: r.appointmentAt ?? '',
    totalMinutes: r.totalMinutes !== undefined ? Number(r.totalMinutes) : undefined,
    status: r.status,
    totalAmt: r.totalAmt !== undefined ? Number(r.totalAmt) : undefined,
  customerName: r.customerName ?? null,
  stylistName: r.stylistName ?? null,
  } as Booking));
  return { items } as { items: Booking[] };
}

// Function to confirm a booking
export async function confirmBooking(bookingId: number) {
  const { data } = await api.put(`/v1/bookings/${bookingId}/confirm`);
  // Assuming backend returns { updated: number }
  return data as { updated: number };
}

// Function to cancel a booking
export async function cancelBooking(bookingId: number) {
  const { data } = await api.put(`/v1/bookings/${bookingId}/cancel`);
  // Assuming backend returns { updated: number }
  return data as { updated: number };
}
export async function markBookingCompleted(bookingId: number) {
  // Chúng ta sẽ dùng phương thức PUT, bạn có thể đổi thành POST nếu muốn
  const { data } = await api.put(`/v1/bookings/${bookingId}/complete`);
  // Giả định backend trả về { updated: number }
  return data as { updated: number };
}

// Function to mark a booking as no-show
export async function markBookingNoShow(bookingId: number) {
  const { data } = await api.put(`/v1/bookings/${bookingId}/no-show`);
  // Giả định backend trả về { updated: number }
  return data as { updated: number };
}
// Type for the data sent TO the backend when creating a booking 
export type CreateBookingPayload = {
  salonId: number;
  stylistId?: number | null;
  appointmentAt: string; // Format: "YYYY-MM-DD HH:MM:SS"
  items: { service_id: number; qty: number }[]; // Use snake_case as backend expects
  note?: string;
};

// Function to create a new booking
export async function createBooking(payload: CreateBookingPayload) {
  // Map frontend camelCase keys to backend snake_case keys if necessary in payload.items
  const backendPayload = {
    ...payload,
    salon_id: payload.salonId, // Add snake_case key
    stylist_id: payload.stylistId, // Add snake_case key
    items: payload.items.map(item => ({
        service_id: item.service_id, // Ensure snake_case
        qty: item.qty
    }))
  };
  // Remove camelCase keys if they might conflict (optional, but safer)
  // delete backendPayload.salonId;
  // delete backendPayload.stylistId;

  const { data } = await api.post(`/v1/bookings`, backendPayload);
  // Assuming backend returns { message, booking_id, total_minutes, total_amt } on success
  return data as { message: string; booking_id: number; total_minutes: number; total_amt: number };
}
// Get booking details including booked services
export async function getBookingDetails(bookingId: number) {
  const { data } = await api.get(`/v1/bookings/${bookingId}`);
  // Expect { booking: {...}, services: [...] }
  return data as { booking: any; services: Array<any> };
}
// NOTE: We'll add createBooking later when building the booking form.