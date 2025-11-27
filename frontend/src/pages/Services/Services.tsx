// frontend/src/pages/Services.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createService, deleteService, listServices, updateService } from "../../api/services";
import type { Service } from "../../api/services";
import { getUser } from "../../store/auth";
import ServiceForm from "./ServiceForm";
import type { ServiceFormValues } from "./ServiceForm";
import styles from "../../components/Services.module.css";
import api from "../../api/client";

export default function ServicesPage() {
  const navigate = useNavigate();
  const user = getUser();
  const mySalonId = user?.role === "salon" ? (user.salonId || 0) : 0;
  const [salonId, setSalonId] = useState<number>(mySalonId);
  const [salons, setSalons] = useState<any[]>([]);
  const [items, setItems] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  // Chặn salon owner chưa có salon
  useEffect(() => {
    if (user?.role === "salon" && mySalonId === 0) {
      setBlocked(true);
    }
  }, [user, mySalonId]);

  // Load danh sách salons
  useEffect(() => {
    (async () => {
      try {
        // Nếu là salon owner, tự động dùng salon của mình, KHÔNG load danh sách
        if (user?.role === "salon" && mySalonId > 0) {
          setSalonId(mySalonId);
          return; // Không cần load danh sách salons
        }

        // Admin và customer: load danh sách tất cả salons
        const { data } = await api.get('/v1/salons');
        setSalons(data.items || []);

        // Tự động chọn salon đầu tiên nếu chưa chọn
        if (data.items && data.items.length > 0 && salonId === 0) {
          setSalonId(data.items[0].id);
        }
      } catch (e) {
        console.error("Không thể tải danh sách salon:", e);
      }
    })();
  }, [user]);

  async function load() {
    if (!salonId || salonId === 0) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setCreating(false);
    setEditing(null);
    try {
      const data = await listServices(salonId, { page, limit, search });
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      console.error("Lỗi tải dịch vụ:", e);
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

  // Nếu salon owner chưa có salon, chặn truy cập
  if (blocked) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ marginBottom: '1rem', color: '#ff6b6b' }}>⚠️ Chưa thể truy cập</h2>
          <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
            Bạn cần tạo salon trước khi quản lý dịch vụ.
          </p>
          <button
            onClick={() => navigate('/salons')}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🏪 Đi tới trang Salons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Service Management</h2>
          <button
            className={styles.createBtn}
            onClick={() => { setCreating(true); setEditing(null); }}
          >
            ✨ Tạo dịch vụ mới
          </button>
        </div>

        {/* Dropdown chọn salon CHỈ cho admin và customer */}
        {user?.role !== "salon" && (
          <div className={styles.salonIdRow}>
            <label>🏪 Chọn Salon:</label>
            <select
              value={salonId}
              onChange={e => { setPage(1); setSalonId(Number(e.target.value)); }}
              className={styles.salonSelect}
            >
              <option value={0}>-- Chọn salon để xem dịch vụ --</option>
              {salons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.searchArea}>
          <input 
            className={styles.searchInput}
            placeholder="🔍 Tìm kiếm dịch vụ..." 
            value={search} 
            onChange={e => { setPage(1); setSearch(e.target.value); }} 
          />
          <span className={styles.totalCount}>📊 {total} dịch vụ</span>
        </div>

        {creating && (
          <div className={styles.formCard}>
            <ServiceForm 
              submitting={submitting} 
              onSubmit={onCreate} 
              onCancel={() => setCreating(false)} 
            />
          </div>
        )}

        {editing && (
          <div className={styles.formCard}>
            <ServiceForm
              submitting={submitting}
              initial={editing}
              onSubmit={onUpdate}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên dịch vụ</th>
              <th>Giá tiền</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.loading}>
                  ⏳ Đang tải dữ liệu...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  🔭 Chưa có dịch vụ nào
                </td>
              </tr>
            ) : (
              items.map(s => (
                <tr key={s.id}>
                  <td>
                    <div>
                      <div className={styles.serviceName}>{s.name}</div>
                      <div className={styles.serviceMeta}>{s.category || 'Chưa phân loại'}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.priceCell}>{s.price.toLocaleString()} đ</div>
                  </td>
                  <td>
                    <div className={styles.durationCell}>{s.durationMin} phút</div>
                  </td>
                  <td>
                    <div className={styles.statusCell}>
                      <span className={`${styles.badge} ${s.isActive ? styles.badgeSuccess : styles.badgeDanger}`}>
                        {s.isActive ? '✓ Hiển thị' : '✕ Ẩn'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.dateCell}>
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('vi-VN') : '-'}
                    </div>
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

        <div className={styles.pagination}>
          <button 
            className={styles.paginationBtn}
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ← Trang trước
          </button>
          <span className={styles.pageInfo}>Trang {page} / {pages}</span>
          <button 
            className={styles.paginationBtn}
            disabled={page >= pages} 
            onClick={() => setPage(p => Math.min(pages, p + 1))}
          >
            Trang sau →
          </button>
        </div>
      </div>
    </div>
  );
}