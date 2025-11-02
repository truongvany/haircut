import { useEffect, useMemo, useState } from "react";
import { getUser } from "../store/auth";
import { listStylists, createStylist, updateStylist, deleteStylist } from "../api/stylists";
import type { Stylist, StylistFormValues } from "../api/stylists";
import StylistForm from "../components/StylistForm";
import styles from "../components/Stylists.module.css";

export default function StylistsPage() {
  const user = getUser();
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
    setCreating(false);
    setEditing(null);
    try {
      const data = await listStylists(salonId, { page, limit, search });
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      console.error("Lỗi tải stylists:", e);
      alert(e?.response?.data?.error || "Không thể tải danh sách stylist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [salonId, page, limit, search]);

  async function onCreate(v: StylistFormValues) {
    setSubmitting(true);
    try {
      await createStylist(salonId, v);
      setCreating(false);
      await load();
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
      await updateStylist(salonId, editing.id, v);
      setEditing(null);
      await load();
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
      await deleteStylist(salonId, s.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Không thể xóa");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Stylist Management</h2>
          <button className={styles.createBtn} onClick={() => { setCreating(true); setEditing(null); }}>
            ✨ Tạo stylist mới
          </button>
        </div>

        {/* Selector chọn Salon ID cho admin */}
        {user?.role === "admin" && (
          <div className={styles.salonIdRow}>
            <label>Salon ID:</label>
            <input
              type="number"
              value={salonId}
              onChange={e => { setPage(1); setSalonId(Number(e.target.value)); }}
            />
          </div>
        )}

        {/* Thanh tìm kiếm */}
        <div className={styles.searchArea}>
          <input
            className={styles.searchInput}
            placeholder="🔍 Tìm theo tên..."
            value={search}
            onChange={e => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        {/* Form tạo mới */}
        {creating && (
          <div className={styles.formCard}>
            <StylistForm submitting={submitting} onSubmit={onCreate} onCancel={() => setCreating(false)} />
          </div>
        )}

        {/* Form sửa */}
        {editing && (
          <div className={styles.formCard}>
            <StylistForm
              submitting={submitting}
              initial={editing}
              onSubmit={onUpdate}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        {/* Bảng danh sách */}
        <div style={{ border: "1px solid rgba(97, 218, 251, 0.2)", borderRadius: 12, overflow: "hidden" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Tên Stylist</th>
                <th style={{ width: '30%' }}>Chuyên môn</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Hoạt động</th>
                <th style={{ width: '15%' }}>Cập nhật</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className={styles.loading}>Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className={styles.empty}>Chưa có stylist</td></tr>
              ) : (
                items.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className={styles.stylistName}>{s.fullName}</div>
                      {s.bio && (
                        <div className={styles.stylistBio}>{s.bio}</div>
                      )}
                    </td>
                    <td>
                      {(s.specialties && s.specialties.length > 0) ? (
                        <div className={styles.specialties}>
                          {s.specialties.map((spec, idx) => (
                            <span key={idx} className={styles.specialtyTag}>{spec}</span>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.emptyText}>Chưa có</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`${styles.badge} ${s.active ? styles.badgeSuccess : styles.badgeDanger}`}>
                        {s.active ? '✓ Hiển thị' : '✕ Ẩn'}
                      </span>
                    </td>
                    <td>
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : "-"}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={`${styles.btn} ${styles.btnEdit}`}
                          onClick={() => { setEditing(s); setCreating(false); }}
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          className={`${styles.btn} ${styles.btnDelete}`}
                          onClick={() => onDelete(s)}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className={styles.pagination}>
          <button 
            className={styles.paginationBtn}
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Trước
          </button>
          <span className={styles.pageInfo}>Trang {page}/{pages}</span>
          <button 
            className={styles.paginationBtn}
            disabled={page >= pages} 
            onClick={() => setPage(p => Math.min(pages, p + 1))}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}