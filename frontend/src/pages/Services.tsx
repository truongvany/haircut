import { useEffect, useMemo, useState } from "react";
import { createService, deleteService, listServices, updateService } from "../api/services";
import type { Service } from "../api/services";
import { getUser } from "../store/auth";
import ServiceForm from "../components/ServiceForm";
import type { ServiceFormValues } from "../components/ServiceForm";

export default function ServicesPage() {
  const user = getUser();
  const mySalonId = user?.role === "salon" ? user.id : 1; // admin có thể đổi, tạm mặc định 1
  const [salonId, setSalonId] = useState<number>(mySalonId);    
  const [items, setItems] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  async function load() {
    setLoading(true);
    try {
      const data = await listServices(salonId, { page, limit, search });
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      console.error("Lỗi tải dịch vụ:", e);
      // Báo lỗi cho người dùng
      alert(e?.response?.data?.error || "Không thể tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [salonId, page, limit, search]);

  async function onCreate(v: ServiceFormValues) {
    setSubmitting(true);
    try {
      await createService(salonId, v);
      setCreating(false);
      await load();
      alert("Tạo dịch vụ thành công");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Tạo thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpdate(v: ServiceFormValues) {
    if (!editing) return;
    setSubmitting(true);
    try {
      await updateService(salonId, editing.id, v);
      setEditing(null);
      await load();
      alert("Cập nhật thành công");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(s: Service) {
    if (!confirm(`Xóa dịch vụ "${s.name}"?`)) return;
    try {
      await deleteService(salonId, s.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Không thể xóa");
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Service Management</h2>
        <div>
          <button className="btn" onClick={() => setCreating(true)}>Tạo mới</button>
        </div>
      </div>

      {user?.role === "admin" && (
        <div className="form-row" style={{ margin: '12px 0' }}>
          <label className="small">Salon ID:</label>
          <input type="number" value={salonId} onChange={e => setSalonId(Number(e.target.value))} style={{ width: 120 }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="Tìm theo tên..." value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} style={{ minWidth: 260 }} />
        <span className="muted small">{total} dịch vụ</span>
      </div>

      {creating && (
        <div style={{ marginBottom: 12 }} className="card">
          <ServiceForm submitting={submitting} onSubmit={onCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {editing && (
        <div style={{ marginBottom: 12 }} className="card">
          <ServiceForm
            submitting={submitting}
            initial={editing}
            onSubmit={onUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="card">
        <table width="100%" cellPadding={8}>
          <thead>
            <tr>
              <th align="left">Tên</th>
              <th align="right">Giá</th>
              <th align="right">Phút</th>
              <th align="center">Hiển thị</th>
              <th align="left">Cập nhật</th>
              <th align="center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6}>Chưa có dịch vụ</td></tr>
            ) : (
              items.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="service-name">{s.name}</div>
                      <div className="service-meta small muted">{s.category || ''}</div>
                    </div>
                  </td>
                  <td align="right">{s.price.toLocaleString()}</td>
                  <td align="right">{s.durationMin}</td>
                  <td align="center"><span className={s.isActive ? 'badge' : 'badge danger'}>{s.isActive ? 'Hiện' : 'Ẩn'}</span></td>
                  <td>{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ''}</td>
                  <td align="center">
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button className="btn small" onClick={() => setEditing(s)}>Sửa</button>
                      <button className="btn small ghost" onClick={() => onDelete(s)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
        <button className="btn small" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
        <span className="small">Trang {page}/{pages}</span>
        <button className="btn small" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Sau</button>
      </div>
    </div>
  );
}
