import { useState, useEffect } from 'react';
import type { Payment } from '../../api/payments';
import { listPayments } from '../../api/payments';
import { useUser } from '../../hooks/useUser';
import '../../components/PaymentHistory.css';

export default function PaymentPage() {
  const { user } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'init' | 'paid' | 'failed'>('all');

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const { items } = await listPayments();
        setPayments(items);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Không thể tải danh sách thanh toán');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const filteredPayments = filterStatus === 'all' 
    ? payments 
    : payments.filter(p => p.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="status-badge paid">✓ Đã thanh toán</span>;
      case 'init':
        return <span className="status-badge init">⏱ Chờ thanh toán</span>;
      case 'failed':
        return <span className="status-badge failed">✕ Thất bại</span>;
      case 'refunded':
        return <span className="status-badge refunded">↩ Hoàn tiền</span>;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="payment-page">
      <div className="payment-page-header">
        <h2> Lịch Sử Thanh Toán</h2>
        <p>Theo dõi các giao dịch thanh toán của bạn</p>
      </div>

      {loading && <div className="loading-message">⏳ Đang tải...</div>}
      {error && <div className="error-message">⚠️ {error}</div>}

      {!loading && !error && (
        <>
          {/* Filter Buttons */}
          <div className="payment-filters">
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
              Chờ thanh toán ({payments.filter(p => p.status === 'init').length})
            </button>
            <button
              className={`filter-btn ${filterStatus === 'failed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('failed')}
            >
              Thất bại ({payments.filter(p => p.status === 'failed').length})
            </button>
          </div>

          {/* Payments List */}
          {filteredPayments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <p>Không có thanh toán nào</p>
            </div>
          ) : (
            <div className="payments-grid">
              {filteredPayments.map(payment => (
                <div key={payment.payment_id} className="payment-card">
                  <div className="payment-card-header">
                    <div className="payment-card-title">
                      <span className="salon-name">
                        {user?.role === 'salon' ? payment.customer_name : payment.salon_name} 
                        {user?.role === 'salon' ? ` (${payment.salon_name})` : ''}
                      </span>
                      <span className="payment-id">#Pay{payment.payment_id}</span>
                    </div>
                    <div className="payment-card-status">
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>

                  <div className="payment-card-content">
                    <div className="payment-detail">
                      <span className="detail-label">Mã Lịch:</span>
                      <span className="detail-value">#{payment.booking_id}</span>
                    </div>
                    <div className="payment-detail">
                      <span className="detail-label">Phương Thức:</span>
                      {getMethodBadge(payment.method)}
                    </div>
                    <div className="payment-detail">
                      <span className="detail-label">Số Tiền:</span>
                      <span className="detail-value amount">{payment.amount.toLocaleString()}đ</span>
                    </div>
                    <div className="payment-detail">
                      <span className="detail-label">Ngày:</span>
                      <span className="detail-value">{formatDate(payment.created_at)}</span>
                    </div>
                  </div>

                  <div className="payment-card-footer">
                    {payment.status === 'init' && (
                      <button className="btn-action btn-pending">⏱ Chờ xác nhận</button>
                    )}
                    {payment.status === 'paid' && (
                      <button className="btn-action btn-success">✓ Hoàn tất</button>
                    )}
                    {payment.status === 'failed' && (
                      <button className="btn-action btn-retry">🔄 Thử lại</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
