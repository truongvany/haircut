import api from "./client";

// Định nghĩa kiểu dữ liệu cho Stylist (khớp với DB + camelCase)
export type Stylist = {
  id: number;
  salonId: number; // Thêm salonId để biết stylist thuộc salon nào
  userId?: number | null; // Có thể null
  fullName: string;
  bio?: string | null;
  specialties?: string[] | null; // Mảng các chuỗi, ví dụ: ["nam", "uốn"]
  ratingAvg: number;
  ratingCount: number;
  active: boolean; // Dùng boolean thay vì 0/1
  createdAt?: string; // Thêm các trường thời gian nếu cần
  updatedAt?: string;
};

// Kiểu dữ liệu cho form (bỏ qua các trường tự động như id, rating)
export type StylistFormValues = {
  fullName: string;
  bio?: string;
  specialties?: string[]; // Frontend sẽ xử lý mảng này
  active: boolean;
};

// Hàm lấy danh sách stylist theo salon (có phân trang, tìm kiếm)
export async function listStylists(
  salonId: number,
  params: { search?: string; page?: number; limit?: number } = {}
) {
  const { data } = await api.get(`/v1/salons/${salonId}/stylists`, { params });
  // Giả định backend trả về cấu trúc tương tự listServices
  return data as { items: Stylist[]; total: number; page: number; limit: number };
}

// Hàm tạo stylist mới
export async function createStylist(salonId: number, payload: StylistFormValues) {
  const { data } = await api.post(`/v1/salons/${salonId}/stylists`, payload);
  return data as Stylist; // Giả định backend trả về stylist vừa tạo
}

// Hàm cập nhật stylist
export async function updateStylist(salonId: number, id: number, payload: StylistFormValues) {
  const { data } = await api.put(`/v1/salons/${salonId}/stylists/${id}`, payload);
  return data as Stylist; // Giả định backend trả về stylist đã cập nhật
}

// Hàm xóa stylist
export async function deleteStylist(salonId: number, id: number) {
  const { data } = await api.delete(`/v1/salons/${salonId}/stylists/${id}`);
  return data as { ok: boolean }; // Giả định backend trả về { ok: true }
}