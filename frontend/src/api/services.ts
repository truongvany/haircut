import api from "./client";

export type Service = {
  id: number;
  name: string;
  price: number;
  durationMin: number;
  category: string;
  description?: string;
  isActive: boolean;
  updatedAt?: string;
};

export async function listServices(
  salonId: number,
  params: { search?: string; page?: number; limit?: number } = {}
) {
  const { data } = await api.get(`/v1/salons/${salonId}/services`, { params });
  // Backend returns snake_case fields (duration_min, base_price, active).
  // Map them to the frontend-friendly shape expected by Service type.
  const items = (data.items || []).map((it: any) => ({
    id: Number(it.id),
    name: it.name,
    price: Number(it.base_price ?? it.price ?? 0),
    durationMin: Number(it.duration_min ?? it.durationMin ?? 0),
    description: it.description ?? it.desc ?? "",
  // Support various backend shapes: active, is_active, or camelCase isActive
  isActive: Boolean(it.active ?? it.is_active ?? it.isActive ?? false),
    updatedAt: it.updated_at ?? it.updatedAt ?? null,
  }));

  return {
    items: items as Service[],
    total: Number(data.total ?? 0),
    page: Number(data.page ?? 1),
    limit: Number(data.limit ?? 10),
  };
}

export async function createService(salonId: number, payload: Partial<Service>) {
  // Map frontend payload to backend expected snake_case fields
  const body: any = {
    name: payload.name,
    category: (payload as any).category ?? 'khác',
    duration_min: payload.durationMin ?? (payload as any).duration_min ?? 0,
    base_price: payload.price ?? (payload as any).base_price ?? 0,
  };

  const { data } = await api.post(`/v1/salons/${salonId}/services`, body);
  return data as Service;
}

export async function updateService(salonId: number, id: number, payload: Partial<Service>) {
  const body: any = {};
  if (payload.name !== undefined) body.name = payload.name;
  if ((payload as any).category !== undefined) body.category = (payload as any).category;
  if (payload.durationMin !== undefined) body.duration_min = payload.durationMin;
  if (payload.price !== undefined) body.base_price = payload.price;

  const { data } = await api.put(`/v1/salons/${salonId}/services/${id}`, body);
  return data as Service;
}

export async function deleteService(salonId: number, id: number) {
  const { data } = await api.delete(`/v1/salons/${salonId}/services/${id}`);
  return data as { ok: boolean };
}
