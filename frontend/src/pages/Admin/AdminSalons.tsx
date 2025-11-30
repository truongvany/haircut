import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useUser } from '../../hooks/useUser';
import '../../components/AdminSalons.css';

interface Salon {
  id: number;
  name: string;
  address_text: string;
  owner_user_id: number;
  status: 'draft' | 'published' | 'suspended';
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export default function AdminSalons() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'suspended'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này');
      setLoading(false);
      return;
    }
    loadSalons();
  }, [user]);

  async function loadSalons() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/v1/admin/salons');
      setSalons(data.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không thể tải danh sách salon');
    } finally {
      setLoading(false);
    }
  }

  async function updateSalonStatus(salonId: number, newStatus: string) {
    try {
      await api.put(`/v1/admin/salons/${salonId}`, { status: newStatus });
      alert('Cập nhật trạng thái thành công!');
      loadSalons();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Cập nhật thất bại');
    }
  }

  const filteredSalons = salons.filter(s => {
    const statusMatch = filterStatus === 'all' || s.status === filterStatus;
    const searchMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.address_text.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="status-badge published">✓ Đang hoạt động</span>;
      case 'draft':
        return <span className="status-badge draft">⏳ Chờ duyệt</span>;
      case 'suspended':
        return <span className="status-badge inactive">✕ Tạm khóa</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-unauthorized"><h2>Không có quyền truy cập</h2></div>;
  }

  if (loading) return <div className="admin-loading">⏳ Đang tải...</div>;

  return (
    <div className="admin-salons">
      <button onClick={() => navigate('/admin')} className="btn-back">
        <span className="back-icon">←</span>
        <span className="back-text">back</span>
      </button>

      <div className="admin-header">
        <h1>🏢 Quản Lý Salon</h1>
        <p>Duyệt, kích hoạt và quản lý các salon trên hệ thống</p>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm salon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="status-filters">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Tất cả ({salons.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'published' ? 'active' : ''}`}
            onClick={() => setFilterStatus('published')}
          >
            Hoạt động ({salons.filter(s => s.status === 'published').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'draft' ? 'active' : ''}`}
            onClick={() => setFilterStatus('draft')}
          >
            Chờ duyệt ({salons.filter(s => s.status === 'draft').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'suspended' ? 'active' : ''}`}
            onClick={() => setFilterStatus('suspended')}
          >
            Tạm khóa ({salons.filter(s => s.status === 'suspended').length})
          </button>
        </div>
      </div>

      {/* Salon List */}
      {filteredSalons.length === 0 ? (
        <div className="empty-state">
          <p>Không tìm thấy salon nào</p>
        </div>
      ) : (
        <div className="salons-table">
          <table>
            <thead>
              <tr>
                <th>Tên Salon</th>
                <th>Địa chỉ</th>
                <th>Đánh giá</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalons.map(salon => (
                <tr key={salon.id}>
                  <td className="salon-name">
                    <strong>{salon.name}</strong>
                  </td>
                  <td>{salon.address_text}</td>
                  <td>
                    <span className="rating">
                      ⭐ {salon.rating_avg} ({salon.rating_count})
                    </span>
                  </td>
                  <td>{getStatusBadge(salon.status)}</td>
                  <td>{new Date(salon.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="actions">
                    {salon.status === 'draft' && (
                      <button
                        className="btn-approve"
                        onClick={() => updateSalonStatus(salon.id, 'published')}
                      >
                        ✓ Duyệt
                      </button>
                    )}
                    {salon.status === 'published' && (
                      <button
                        className="btn-deactivate"
                        onClick={() => updateSalonStatus(salon.id, 'suspended')}
                      >
                        ✕ Khóa
                      </button>
                    )}
                    {salon.status === 'suspended' && (
                      <button
                        className="btn-activate"
                        onClick={() => updateSalonStatus(salon.id, 'published')}
                      >
                        ↺ Mở khóa
                      </button>
                    )}
                    <a href={`/salons/${salon.id}`} className="btn-view">
                      👁 Xem
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
