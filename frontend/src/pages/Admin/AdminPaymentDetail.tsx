import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useUser } from '../../hooks/useUser';
import '../../components/AdminPaymentDetail.css';

interface PaymentDetail {
  id: number;
  booking_id: number;
  customer_id: number;
  customer_name: string;
  salon_id: number;
  salon_name: string;
  method: string;
  status: string;
  amount: number;
  created_at: string;
  booking_date?: string;
  booking_time?: string;
}

export default function AdminPaymentDetail() {
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này');
      setLoading(false);
      return;
    }
    if (id) loadPayment(parseInt(id));
  }, [user, id]);

  async function loadPayment(paymentId: number) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/v1/admin/payments/${paymentId}`);
      setPayment(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không thể tải chi tiết thanh toán');
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: {[key: string]: {label: string; className: string}} = {
      'paid': { label: '✓ Đã thanh toán', className: 'paid' },
      'init': { label: '⏳ Chờ thanh toán', className: 'init' },
      'failed': { label: '✕ Thất bại', className: 'failed' },
    };
    
    const info = statusMap[status] || { label: status, className: 'default' };
    return <span className={`status-badge ${info.className}`}>{info.label}</span>;
  };

  const getMethodBadge = (method: string) => {
    const methodMap: {[key: string]: {label: string; icon: string}} = {
      'cash': { label: 'Tiền mặt', icon: '💵' },
      'bank_transfer': { label: 'Chuyển khoản', icon: '🏦' },
    };
    
    const info = methodMap[method] || { label: method, icon: '💳' };
    return <span>{info.icon} {info.label}</span>;
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-unauthorized"><h2>Không có quyền truy cập</h2></div>;
  }

  if (loading) return <div className="admin-loading">⏳ Đang tải...</div>;

  if (error) return (
    <div className="admin-error">
      <h2>❌ Lỗi</h2>
      <p>{error}</p>
      <button onClick={() => navigate('/admin/payments')} className="btn-back">
        <span className="back-icon">←</span>
        <span className="back-text">Quay lại</span>
      </button>
    </div>
  );

  if (!payment) return (
    <div className="admin-error">
      <h2>❌ Không tìm thấy thanh toán</h2>
      <button onClick={() => navigate('/admin/payments')} className="btn-back">
        <span className="back-icon">←</span>
        <span className="back-text">Quay lại</span>
      </button>
    </div>
  );

  return (
    <div className="admin-payment-detail">
      <button onClick={() => navigate('/admin/payments')} className="btn-back">
        <span className="back-icon">←</span>
        <span className="back-text">Quay lại</span>
      </button>

      <div className="detail-header">
        <h1>💳 Chi Tiết Thanh Toán #{payment.id}</h1>
        <div className="status-container">{getStatusBadge(payment.status)}</div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h2>Thông Tin Thanh Toán</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Mã thanh toán</label>
              <p>#Pay{payment.id}</p>
            </div>
            <div className="info-item">
              <label>Phương thức</label>
              <p>{getMethodBadge(payment.method)}</p>
            </div>
            <div className="info-item">
              <label>Số tiền</label>
              <p className="amount">{payment.amount.toLocaleString()}đ</p>
            </div>
            <div className="info-item">
              <label>Trạng thái</label>
              <p>{getStatusBadge(payment.status)}</p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Thông Tin Khách Hàng</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Tên khách hàng</label>
              <p>{payment.customer_name}</p>
            </div>
            <div className="info-item">
              <label>ID khách hàng</label>
              <p>#{payment.customer_id}</p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Thông Tin Salon</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Tên salon</label>
              <p>{payment.salon_name}</p>
            </div>
            <div className="info-item">
              <label>ID salon</label>
              <p>#{payment.salon_id}</p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Thông Tin Booking</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Mã booking</label>
              <p>#{payment.booking_id}</p>
            </div>
            {payment.booking_date && (
              <div className="info-item">
                <label>Ngày booking</label>
                <p>{new Date(payment.booking_date).toLocaleDateString('vi-VN')}</p>
              </div>
            )}
            {payment.booking_time && (
              <div className="info-item">
                <label>Giờ booking</label>
                <p>{payment.booking_time}</p>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h2>Thông Tin Hệ Thống</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Ngày thanh toán</label>
              <p>{new Date(payment.created_at).toLocaleDateString('vi-VN')} {new Date(payment.created_at).toLocaleTimeString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
