import api from './client';

export async function listReviews(salonId: number) {
  const { data } = await api.get(`/v1/salons/${salonId}/reviews`);
  // Expect { items: [...] }
  return data as { items: Array<any> };
}

export default { listReviews };

export async function postReview(bookingId: number, payload: { rating: number; comment?: string }) {
  const { data } = await api.post(`/v1/bookings/${bookingId}/reviews`, payload);
  return data as any;
}
