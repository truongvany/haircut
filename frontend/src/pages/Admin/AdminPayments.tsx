import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useUser } from '../../hooks/useUser';
import '../../components/AdminPayments.css';

interface Payment {
  id: number;
  booking_id: number;
  customer_name: string;
  salon_name: string;
  method: string;
  status: string;
  amount: number;
  created_at: string;
}

export default function AdminPayments() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'init' | 'paid' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này');
      setLoading(false);
      return;
    }
    loadPayments();
  }, [user]);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/v1/admin/payments');
      setPayments(data.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không thể tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
  }

  const filteredPayments = payments.filter(p => {
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    const searchMatch = p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.salon_name.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const totalRevenue = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="status-badge paid">✓ Đã thanh toán</span>;
      case 'init':
        return <span className="status-badge init">⏳ Chờ thanh toán</span>;
      case 'failed':
        return <span className="status-badge failed">✕ Thất bại</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <span className="method-badge cash">💵 Tiền mặt</span>;
      case 'bank_transfer':
        return <span className="method-badge bank">🏦 Chuyển khoản</span>;
      default:
        return <span className="method-badge">{method}</span>;
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-unauthorized"><h2>Không có quyền truy cập</h2></div>;
  }

  if (loading) return <div className="admin-loading">⏳ Đang tải...</div>;

  return (
    <div className="admin-payments">
      <button onClick={() => navigate('/admin')} className="btn-back">
        <span className="back-icon">←</span>
        <span className="back-text">back</span>
      </button>

      <div className="admin-header">
        <h1>💳 Quản Lý Thanh Toán</h1>
        <p>Theo dõi tất cả giao dịch và doanh thu trên hệ thống</p>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Tổng Doanh Thu</h3>
          <div className="amount">{totalRevenue.toLocaleString()}đ</div>
        </div>
        <div className="summary-card">
          <h3>Tổng Thanh Toán</h3>
          <div className="amount">{payments.length}</div>
        </div>
        <div className="summary-card">
          <h3>Đã Thanh Toán</h3>
          <div className="amount">{payments.filter(p => p.status === 'paid').length}</div>
        </div>
        <div className="summary-card">
          <h3>Chờ Xác Nhận</h3>
          <div className="amount">{payments.filter(p => p.status === 'init').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm thanh toán..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="status-filters">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Tất cả ({payments.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'paid' ? 'active' : ''}`}
            onClick={() => setFilterStatus('paid')}
          >
            Đã thanh toán ({payments.filter(p => p.status === 'paid').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'init' ? 'active' : ''}`}
            onClick={() => setFilterStatus('init')}
          >
            Chờ xác nhận ({payments.filter(p => p.status === 'init').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'failed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('failed')}
          >
            Thất bại ({payments.filter(p => p.status === 'failed').length})
          </button>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="empty-state">
          <p>Không tìm thấy thanh toán nào</p>
        </div>
      ) : (
        <div className="payments-table">
          <table>
            <thead>
              <tr>
                <th>Mã Thanh Toán</th>
                <th>Customer</th>
                <th>Salon</th>
                <th>Phương Thức</th>
                <th>Số Tiền</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(payment => (
                <tr key={payment.id}>
                  <td className="payment-id">
                    <strong>#Pay{payment.id}</strong>
                  </td>
                  <td>{payment.customer_name}</td>
                  <td>{payment.salon_name}</td>
                  <td>{getMethodBadge(payment.method)}</td>
                  <td className="amount">
                    <strong>{payment.amount.toLocaleString()}đ</strong>
                  </td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>{new Date(payment.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="actions">
                    <a href={`/admin/payments/${payment.id}`} className="btn-view">
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
