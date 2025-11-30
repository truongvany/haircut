import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useUser } from '../../hooks/useUser';
import '../../components/AdminDashboard.css';

interface Stats {
  totalSalons: number;
  activeSalons: number;
  totalCustomers: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này');
      setLoading(false);
      return;
    }

    loadStats();
  }, [user]);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/v1/admin/stats');
      setStats(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-unauthorized">
        <h2>Không có quyền truy cập</h2>
        <p>Bạn cần là admin để truy cập trang này</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Đang tải thống kê...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>⚠️ Lỗi</h2>
        <p>{error}</p>
        <button onClick={loadStats}>🔄 Thử lại</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        <div className="admin-header">
          <h1>Quản lý toàn bộ hệ thống HairCut</h1>
          <p>Xin chào, {user?.name || 'Admin'}! Đây là bảng điều khiển quản lý</p>
        </div>

        {/* Main Stats */}
        <div className="main-stats">
          <div className="stat-card main-stat">
            <div className="stat-bg salon-gradient" data-label="Salon Hoạt Động"></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.activeSalons || 0}</div>
              <div className="stat-comparison">Tổng: {stats?.totalSalons || 0}</div>
            </div>
          </div>
          <div className="stat-card main-stat">
            <div className="stat-bg customer-gradient" data-label="Khách Hàng"></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalCustomers || 0}</div>
              <div className="stat-comparison">Người dùng</div>
            </div>
          </div>
          <div className="stat-card main-stat">
            <div className="stat-bg booking-gradient" data-label="Đặt Lịch"></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalBookings || 0}</div>
              <div className="stat-comparison">Hoàn tất: {stats?.completedBookings || 0}</div>
            </div>
          </div>
          <div className="stat-card main-stat">
            <div className="stat-bg revenue-gradient" data-label="Doanh Thu"></div>
            <div className="stat-content">
              <div className="stat-value">
                {((stats?.totalRevenue || 0) / 1000000).toFixed(1)}M
              </div>
              <div className="stat-comparison">Tổng tiền</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-title">Quản Lý Nhanh</h2>
          <div className="actions-grid">
            <a href="/admin/salons" className="action-card salon-action">
              <div className="action-icon">🏢</div>
              <h3>Salon</h3>
              <p>Duyệt & quản lý salon</p>
              <span className="action-arrow">→</span>
            </a>
            <a href="/admin/bookings" className="action-card booking-action">
              <div className="action-icon">📅</div>
              <h3>Booking</h3>
              <p>Theo dõi đặt lịch</p>
              <span className="action-arrow">→</span>
            </a>
            <a href="/admin/payments" className="action-card payment-action">
              <div className="action-icon">💳</div>
              <h3>Thanh Toán</h3>
              <p>Quản lý thanh toán</p>
              <span className="action-arrow">→</span>
            </a>
            <a href="/admin/users" className="action-card user-action">
              <div className="action-icon">👥</div>
              <h3>Người Dùng</h3>
              <p>Quản lý tài khoản</p>
              <span className="action-arrow">→</span>
            </a>
            <a href="/admin/news" className="action-card news-action">
              <div className="action-icon">📰</div>
              <h3>Tin Tức</h3>
              <p>Tạo & quản lý tin tức</p>
              <span className="action-arrow">→</span>
            </a>
          </div>
        </div>

        {/* Info Box */}
        <div className="info-section">
          <div className="info-card">
            <h3>💡 Gợi Ý Nhanh</h3>
            <ul className="tips-list">
              <li>✓ Duyệt salon mới và kích hoạt hoạt động</li>
              <li>✓ Theo dõi tất cả booking & thanh toán</li>
              <li>✓ Quản lý người dùng & phân quyền</li>
              <li>✓ Xem báo cáo doanh thu chi tiết</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
