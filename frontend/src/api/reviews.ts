import api from './client';

export async function listReviews(salonId: number) {
  const { data } = await api.get(`/v1/salons/${salonId}/reviews`);
  return data as { items: Array<any> };
}

export async function checkReview(bookingId: number) {
  const { data } = await api.get(`/v1/bookings/${bookingId}/review-check`);
  return data as { has_review: boolean; review?: any };
}

export async function postReview(bookingId: number, payload: { rating: number; comment?: string }) {
  const { data } = await api.post(`/v1/bookings/${bookingId}/reviews`, payload);
  return data as any;
}

export default { listReviews, checkReview, postReview };
