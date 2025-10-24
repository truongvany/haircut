import api from "./client";

export type Service = {
  id: number;
  name: string;
  price: number;
  durationMin: number;
  description?: string;
  isActive: boolean;
  updatedAt?: string;
};

export async function listServices(
  salonId: number,
  params: { search?: string; page?: number; limit?: number } = {}
) {
  const { data } = await api.get(`/v1/salons/${salonId}/services`, { params });
  return data as { items: Service[]; total: number; page: number; limit: number };
}

export async function createService(salonId: number, payload: Partial<Service>) {
  const { data } = await api.post(`/v1/salons/${salonId}/services`, payload);
  return data as Service;
}

export async function updateService(salonId: number, id: number, payload: Partial<Service>) {
  const { data } = await api.put(`/v1/salons/${salonId}/services/${id}`, payload);
  return data as Service;
}

export async function deleteService(salonId: number, id: number) {
  const { data } = await api.delete(`/v1/salons/${salonId}/services/${id}`);
  return data as { ok: boolean };
}
