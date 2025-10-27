import { useEffect, useMemo, useState } from "react";
import { getUser } from "../store/auth";
import { listStylists, createStylist, updateStylist, deleteStylist } from "../api/stylists"; // Import API stylists
import type { Stylist, StylistFormValues } from "../api/stylists"; // Import types stylists
import StylistForm from "../components/StylistForm"; // Import Form stylists

export default function StylistsPage() {
  const user = getUser();
  // Lấy salonId tương tự ServicesPage
  const mySalonId = user?.role === "salon" ? user.id : 1;
  const [salonId, setSalonId] = useState<number>(mySalonId);

  const [items, setItems] = useState<Stylist[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<Stylist | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  async function load() {
    setLoading(true);
    setCreating(false); // Đảm bảo form tạo ẩn đi khi tải lại
    setEditing(null);   // Đảm bảo form sửa ẩn đi khi tải lại
    try {
      const data = await listStylists(salonId, { page, limit, search }); // Gọi API listStylists
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      console.error("Lỗi tải stylists:", e);
      alert(e?.response?.data?.error || "Không thể tải danh sách stylist");
    } finally {
      setLoading(false);
    }
  }

  // Load dữ liệu khi salonId, page, limit, search thay đổi
  useEffect(() => {
    load();
  }, [salonId, page, limit, search]);

  async function onCreate(v: StylistFormValues) {
    setSubmitting(true);
    try {
      await createStylist(salonId, v); // Gọi API createStylist
      setCreating(false);
      await load(); // Tải lại danh sách
      alert("Tạo stylist thành công");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Tạo thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpdate(v: StylistFormValues) {
    if (!editing) return;
    setSubmitting(true);
    try {
      await updateStylist(salonId, editing.id, v); // Gọi API updateStylist
      setEditing(null);
      await load(); // Tải lại danh sách
      alert("Cập nhật thành công");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(s: Stylist) {
    if (!confirm(`Xóa stylist "${s.fullName}"?`)) return;
    try {
      await deleteStylist(salonId, s.id); // Gọi API deleteStylist
      await load(); // Tải lại danh sách
    } catch (e: any) {
      alert(e?.response?.data?.error || "Không thể xóa");
    }
  }

  return (
    <div>
      <h2>Stylist Management</h2>

      {/* Selector chọn Salon ID cho admin */}
      {user?.role === "admin" && (
        <div style={{ margin: "8px 0" }}>
          <label>Salon ID: </label>
          <input
            type="number"
            value={salonId}
            onChange={e => { setPage(1); setSalonId(Number(e.target.value)); }} // Reset page khi đổi salon
            style={{ width: 120 }}
          />
        </div>
      )}

      {/* Thanh tìm kiếm và nút tạo mới */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Tìm theo tên..."
          value={search}
          onChange={e => {
            setPage(1); // Reset page khi tìm kiếm
            setSearch(e.target.value);
          }}
          style={{ minWidth: 260 }}
        />
        <button onClick={() => { setCreating(true); setEditing(null); }}>Tạo mới</button> {/* Đảm bảo chỉ 1 form hiện */}
      </div>

      {/* Form tạo mới */}
      {creating && (
        <div style={{ marginBottom: 12 }}>
          <StylistForm submitting={submitting} onSubmit={onCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {/* Form sửa */}
      {editing && (
        <div style={{ marginBottom: 12 }}>
          <StylistForm
            submitting={submitting}
            initial={editing}
            onSubmit={onUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Bảng danh sách */}
      <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
        <table width="100%" cellPadding={8}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th align="left">Tên Stylist</th>
              <th align="left">Chuyên môn</th>
              <th align="center">Hoạt động</th>
              <th align="left">Cập nhật</th>
              <th align="center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5}>Chưa có stylist</td></tr>
            ) : (
              items.map(s => (
                <tr key={s.id}>
                  <td>{s.fullName}</td>
                  <td>{(s.specialties || []).join(', ')}</td> {/* Hiển thị specialties */}
                  <td align="center">{s.active ? "✓" : "✗"}</td>
                  <td>{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}</td>
                  <td align="center" style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <button onClick={() => { setEditing(s); setCreating(false); }}>Sửa</button> {/* Đảm bảo chỉ 1 form hiện */}
                    <button onClick={() => onDelete(s)}>Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
        <span>Trang {page}/{pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Sau</button>
      </div>
    </div>
  );
}