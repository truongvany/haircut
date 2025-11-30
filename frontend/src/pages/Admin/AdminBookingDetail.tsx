import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useUser } from '../../hooks/useUser';
import '../../components/AdminBookingDetail.css';

interface BookingDetail {
  id: number;
  customer_id: number;
  customer_name: string;
  salon_id: number;
  salon_name: string;
  stylist_id?: number;
  stylist_name?: string;
  booking_date: string;
  booking_time: string;
  total_minutes: number;
  subtotal_amt: number;
  discount_amt: number;
  total_amt: number;
  status: string;
  note?: string;
  created_at: string;
}

export default function AdminBookingDetail() {
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này');
      setLoading(false);
      return;
    }
    if (id) loadBooking(parseInt(id));
  }, [user, id]);

  async function loadBooking(bookingId: number) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/v1/admin/bookings/${bookingId}`);
      setBooking(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không thể tải chi tiết booking');
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: {[key: string]: {label: string; className: string}} = {
      'pending': { label: '⏳ Chờ xác nhận', className: 'pending' },
      'confirmed': { label: '✓ Đã xác nhận', className: 'confirmed' },
      'completed': { label: '✓ Hoàn tất', className: 'completed' },
      'cancelled': { label: '✕ Đã hủy', className: 'cancelled' },
      'no_show': { label: '❌ Không xuất hiện', className: 'no-show' }
    };
    
    const info = statusMap[status] || { label: status, className: 'default' };
    return <span className={`status-badge ${info.className}`}>{info.label}</span>;
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-unauthorized"><h2>Không có quyền truy cập</h2></div>;
  }

  if (loading) return <div className="admin-loading">⏳ Đang tải...</div>;

  if (error) return (
    <div className="admin-error">
      <h2>❌ Lỗi</h2>
      <p>{error}</p>
      <button onClick={() => navigate('/admin/bookings')} className="btn-back">← Quay lại</button>
    </div>
  );

  if (!booking) return (
    <div className="admin-error">
      <h2>❌ Không tìm thấy booking</h2>
      <button onClick={() => navigate('/admin/bookings')} className="btn-back">← Quay lại</button>
    </div>
  );

  return (
    <div className="admin-booking-detail">
      <button onClick={() => navigate('/admin/bookings')} className="btn-back">
        <span className="back-icon">←</span>
        <span className="back-text">Quay lại</span>
      </button>

      <div className="detail-header">
        <h1>📅 Chi Tiết Booking #{booking.id}</h1>
        <div className="status-container">{getStatusBadge(booking.status)}</div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h2>Thông Tin Khách Hàng</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Tên khách hàng</label>
              <p>{booking.customer_name}</p>
            </div>
            <div className="info-item">
              <label>ID khách hàng</label>
              <p>#{booking.customer_id}</p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Thông Tin Salon</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Tên salon</label>
              <p>{booking.salon_name}</p>
            </div>
            <div className="info-item">
              <label>ID salon</label>
              <p>#{booking.salon_id}</p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h2>Thông Tin Đặt Lịch</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Ngày đặt lịch</label>
              <p>{new Date(booking.booking_date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="info-item">
              <label>Giờ đặt lịch</label>
              <p>{booking.booking_time}</p>
            </div>
            <div className="info-item">
              <label>Thời lượng</label>
              <p>{booking.total_minutes} phút</p>
            </div>
            {booking.stylist_name && (
              <div className="info-item">
                <label>Stylist</label>
                <p>{booking.stylist_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h2>Thông Tin Thanh Toán</h2>
          <div className="payment-grid">
            <div className="payment-item">
              <label>Giá ban đầu</label>
              <p className="amount">{booking.subtotal_amt.toLocaleString()}đ</p>
            </div>
            <div className="payment-item">
              <label>Giảm giá</label>
              <p className="amount discount">{booking.discount_amt.toLocaleString()}đ</p>
            </div>
            <div className="payment-item highlight">
              <label>Tổng tiền</label>
              <p className="amount total">{booking.total_amt.toLocaleString()}đ</p>
            </div>
          </div>
        </div>

        {booking.note && (
          <div className="detail-section">
            <h2>Ghi Chú</h2>
            <p className="note-text">{booking.note}</p>
          </div>
        )}

        <div className="detail-section">
          <h2>Thông Tin Hệ Thống</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Ngày tạo</label>
              <p>{new Date(booking.created_at).toLocaleDateString('vi-VN')} {new Date(booking.created_at).toLocaleTimeString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
