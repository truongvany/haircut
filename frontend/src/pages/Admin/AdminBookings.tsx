import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useUser } from '../../hooks/useUser';
import '../../components/AdminBookings.css';

interface Booking {
  id: number;
  customer_id: number;
  customer_name: string;
  salon_id: number;
  salon_name: string;
  booking_date: string;
  booking_time: string;
  total_amt: number;
  status: string;
  created_at: string;
}

export default function AdminBookings() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này');
      setLoading(false);
      return;
    }
    loadBookings();
  }, [user]);

  async function loadBookings() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/v1/admin/bookings');
      setBookings(data.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không thể tải danh sách booking');
    } finally {
      setLoading(false);
    }
  }

  const filteredBookings = bookings.filter(b => {
    const statusMatch = filterStatus === 'all' || b.status === filterStatus;
    const searchMatch = b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.salon_name.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="status-badge confirmed">✓ Đã xác nhận</span>;
      case 'pending':
        return <span className="status-badge pending">⏳ Chờ xác nhận</span>;
      case 'completed':
        return <span className="status-badge completed">✓ Hoàn tất</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">✕ Đã hủy</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-unauthorized"><h2>Không có quyền truy cập</h2></div>;
  }

  if (loading) return <div className="admin-loading">⏳ Đang tải...</div>;

  return (
    <div className="admin-bookings">
      <button onClick={() => navigate('/admin')} className="btn-back">
        <span className="back-icon">←</span>
        <span className="back-text">back</span>
      </button>

      <div className="admin-header">
        <h1>📅 Quản Lý Booking</h1>
        <p>Theo dõi và quản lý toàn bộ đặt lịch trên hệ thống</p>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm booking..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="status-filters">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Tất cả ({bookings.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Chờ xác nhận ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('confirmed')}
          >
            Đã xác nhận ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Hoàn tất ({bookings.filter(b => b.status === 'completed').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('cancelled')}
          >
            Hủy ({bookings.filter(b => b.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>Không tìm thấy booking nào</p>
        </div>
      ) : (
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Mã Booking</th>
                <th>Customer</th>
                <th>Salon</th>
                <th>Ngày/Giờ</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td className="booking-id">
                    <strong>#{booking.id}</strong>
                  </td>
                  <td>{booking.customer_name}</td>
                  <td>{booking.salon_name}</td>
                  <td>
                    {new Date(booking.booking_date).toLocaleDateString('vi-VN')} @ {booking.booking_time}
                  </td>
                  <td className="price">
                    <strong>{booking.total_amt.toLocaleString()}đ</strong>
                  </td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>{new Date(booking.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="actions">
                    <a href={`/bookings/${booking.id}`} className="btn-view">
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
