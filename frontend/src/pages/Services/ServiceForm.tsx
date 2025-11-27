import { useEffect, useState } from "react";
import type { Service } from "../../api/services";

export type ServiceFormValues = {
  name: string;
  price: number;
  durationMin: number;
  category: string;
  description?: string;
  isActive: boolean;
};

export default function ServiceForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<Service>;
  submitting?: boolean;
  onSubmit: (v: ServiceFormValues) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<ServiceFormValues>({
    name: "",
    price: 0,
    durationMin: 30,
    category: "khác",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (initial) {
      setV({
        name: initial.name || "",
        price: Number(initial.price || 0),
        durationMin: Number(initial.durationMin || 30),
        category: initial.category || "khác",
        description: initial.description || "",
        isActive: Boolean(initial.isActive ?? true),
      });
    }
  }, [initial]);

  const invalid =
  !v.name.trim() || !v.category.trim() || v.price <= 0 || v.durationMin <= 0 || v.name.length > 120 || (v.description || "").length > 500;

  return (
    <div className="card">
      <div style={{ display: 'grid', gap: 8 }}>
        <label>
          Tên dịch vụ
          <input value={v.name} onChange={e => setV({ ...v, name: e.target.value })} />
        </label>
        <label>
        Danh mục
        <select value={v.category} onChange={e => setV({ ...v, category: e.target.value })}>
         <option value="khác">Khác</option>
         <option value="cat">Cắt</option>
        <option value="goi">Gội</option>
        <option value="uốn">Uốn</option>
         <option value="nhuộm">Nhuộm</option>
         <option value="duỗi">Duỗi</option>
         <option value="tạo kiểu">Tạo kiểu</option>
        </select>
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1 }}>
            Giá
            <input type="number" value={v.price} onChange={e => setV({ ...v, price: Number(e.target.value) })} />
          </label>
          <label style={{ width: 160 }}>
            Thời lượng (phút)
            <input
              type="number"
              value={v.durationMin}
              onChange={e => setV({ ...v, durationMin: Number(e.target.value) })}
            />
          </label>
        </div>
        <label>
          Mô tả
          <textarea value={v.description} onChange={e => setV({ ...v, description: e.target.value })} />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={v.isActive}
            onChange={e => setV({ ...v, isActive: e.target.checked })}
          />
          Hiển thị
        </label>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="btn" onClick={() => onSubmit(v)} disabled={invalid || submitting}>
          {submitting ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button className="btn secondary" onClick={onCancel} type="button">Hủy</button>
      </div>
    </div>
  );
}
