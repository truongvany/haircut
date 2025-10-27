import { useEffect, useState } from "react";
import type { Stylist, StylistFormValues } from "../api/stylists"; // Import types mới

export default function StylistForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<Stylist>; // Dùng Partial<Stylist> cho initial data
  submitting?: boolean;
  onSubmit: (v: StylistFormValues) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<StylistFormValues>({
    fullName: "",
    bio: "",
    specialties: [], // Mặc định là mảng rỗng
    active: true,
  });

  useEffect(() => {
    if (initial) {
      setV({
        fullName: initial.fullName || "",
        bio: initial.bio || "",
        // Chuyển đổi specialties từ chuỗi JSON (nếu backend trả về JSON) hoặc giữ nguyên nếu là mảng
        specialties: Array.isArray(initial.specialties) ? initial.specialties : [],
        active: Boolean(initial.active ?? true),
      });
    }
  }, [initial]);

  // Đơn giản hóa validation, chỉ cần tên
  const invalid = !v.fullName.trim() || v.fullName.length > 120 || (v.bio || "").length > 500;

  // Xử lý specialties: dùng input text đơn giản, ngăn cách bởi dấu phẩy
  const handleSpecialtiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const specialtiesArray = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setV({ ...v, specialties: specialtiesArray });
  };

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Tên Stylist *
          <input value={v.fullName} onChange={e => setV({ ...v, fullName: e.target.value })} />
        </label>
        <label>
          Tiểu sử (Bio)
          <textarea value={v.bio || ''} onChange={e => setV({ ...v, bio: e.target.value })} />
        </label>
        <label>
          Chuyên môn (ngăn cách bởi dấu phẩy, vd: nam, uốn, nhuộm)
          <input
            value={(v.specialties || []).join(', ')} // Hiển thị mảng thành chuỗi
            onChange={handleSpecialtiesChange} // Xử lý khi input thay đổi
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={v.active}
            onChange={e => setV({ ...v, active: e.target.checked })}
          />
          Đang hoạt động
        </label>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={() => onSubmit(v)} disabled={invalid || submitting}>
          {submitting ? "Đang lưu..." : "Lưu"}
        </button>
        <button onClick={onCancel} type="button">Hủy</button>
      </div>
    </div>
  );
}