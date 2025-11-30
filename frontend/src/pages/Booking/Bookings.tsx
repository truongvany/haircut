import { useEffect, useState } from "react";
// removed unused Link import
import { getUser } from "../../store/auth";
import { listBookingsBySalonDate, confirmBooking, cancelBooking, markBookingCompleted, markBookingNoShow, getBookingDetails } from "../../api/bookings";
import type { Booking } from "../../api/bookings";
import { listStylists } from "../../api/stylists";
import type { Stylist } from "../../api/stylists";
import "../../components/Bookings.css";

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const parseDateTime = (dateTimeString: string): Date => {
  if (!dateTimeString) return new Date();
  const isoString = dateTimeString.includes('T') 
    ? dateTimeString 
    : dateTimeString.replace(' ', 'T');
  return new Date(isoString);
};

const formatTime = (dateTimeString: string): string => {
  if (!dateTimeString) return 'N/A';
  try {
    const date = parseDateTime(dateTimeString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'N/A';
  }
};

const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return 'N/A';
  try {
    const date = parseDateTime(dateTimeString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'N/A';
  }
};

export default function BookingsPage() {
  const user = getUser();
  // Lấy salonId trực tiếp từ user object
  const mySalonId = user?.role === "salon" ? (user.salonId || null) : null;
  const [salonId, setSalonId] = useState<number | null>(mySalonId);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistFilter, setStylistFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<any | null>(null);
  const [detailServices, setDetailServices] = useState<Array<any>>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  // Kiểm tra nếu salon owner chưa có salon
  useEffect(() => {
    if (user?.role === "salon" && !mySalonId) {
      setError('Không tìm thấy thông tin salon. Vui lòng liên hệ admin.');
    }
  }, [user, mySalonId]);

  const loadBookings = async () => {
    if (!salonId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await listBookingsBySalonDate(salonId, selectedDate);
      if (data?.items) {
        const sorted = [...data.items].sort((a, b) => {
          const dateA = new Date(a.appointmentAt).getTime();
          const dateB = new Date(b.appointmentAt).getTime();
          return dateA - dateB;
        });
        setBookings(sorted);
      } else {
        setBookings([]);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Không thể tải lịch hẹn");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!salonId) return;
    loadBookings();
    (async () => {
      try {
        const res = await listStylists(salonId, { limit: 200 });
        setStylists(res.items || []);
      } catch (err) {
        setStylists([]);
      }
    })();
  }, [salonId, selectedDate]);

  const handleConfirm = async (bookingId: number) => {
    if (!confirm("Xác nhận lịch hẹn này?")) return;
    try {
      await confirmBooking(bookingId);
      loadBookings();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Xác nhận thất bại");
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm("Hủy lịch hẹn này?")) return;
    try {
      await cancelBooking(bookingId);
      loadBookings();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Hủy thất bại");
    }
  };

  const handleComplete = async (bookingId: number) => {
    if (!confirm("Đánh dấu lịch hẹn này là ĐÃ HOÀN THÀNH?")) return;
    try {
      await markBookingCompleted(bookingId);
      loadBookings();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Đánh dấu hoàn thành thất bại");
    }
  };

  const handleNoShow = async (bookingId: number) => {
    if (!confirm("Đánh dấu lịch hẹn này là KHÁCH KHÔNG ĐẾN?")) return;
    try {
      await markBookingNoShow(bookingId);
      loadBookings();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Đánh dấu không đến thất bại");
    }
  };

  const handleView = async (bookingId: number) => {
    try {
      const data = await getBookingDetails(bookingId);
      setDetailBooking(data.booking);
      setDetailServices(data.services || []);
      setDetailOpen(true);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Không thể tải chi tiết');
    }
  };

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'no_show': 'status-no-show'
    };
    return `status-badge ${statusMap[status] || ''}`;
  };

  const getStatusText = (status: string) => {
    const statusTextMap: Record<string, string> = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'no_show': 'Không đến'
    };
    return statusTextMap[status] || status;
  };

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h2>Quản Lý Lịch Hẹn</h2>
      </div>

      {error && !salonId && (
        <div className="error-message">{error}</div>
      )}

      {(salonId || user?.role === "admin") && (
        <>
          <div className="bookings-controls">
            {user?.role === "admin" && (
              <div className="control-group">
                <label>Salon ID</label>
                <input
                  type="number"
                  value={salonId || ''}
                  onChange={e => setSalonId(Number(e.target.value))}
                />
              </div>
            )}
            
            {user?.role === "salon" && salonId && (
              <div className="control-group">
                <label>Salon của bạn</label>
                <input type="text" value={`Salon ID: ${salonId}`} disabled style={{background: '#f0f0f0'}} />
              </div>
            )}

            <div className="control-group">
              <label>Chọn ngày</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Lọc theo Stylist</label>
              <select value={stylistFilter ?? ''} onChange={e => setStylistFilter(e.target.value ? Number(e.target.value) : null)}>
                <option value="">-- Tất cả --</option>
                {stylists.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </select>
            </div>
          </div>

          {loading && <div className="loading-message">Đang tải lịch hẹn...</div>}
          {error && <div className="error-message">Lỗi: {error}</div>}

          {!loading && !error && (
            <div className="bookings-table-container">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th align="left">Giờ hẹn</th>
                    <th align="left">Khách hàng</th>
                    <th align="left">Stylist</th>
                    <th align="right">Thời lượng</th>
                    <th align="right">Tổng tiền</th>
                    <th align="center">Trạng thái</th>
                    <th align="center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={7} className="empty-state">Không có lịch hẹn cho ngày này</td></tr>
                  ) : (
                    bookings
                      .filter(b => (stylistFilter ? (b.stylistId === stylistFilter) : true))
                      .map(b => (
                      <tr key={b.id}>
                        <td className="booking-time">{formatTime(b.appointmentAt)}</td>
                        <td className="booking-customer">{b.customerName || 'Khách'}</td>
                        <td className="booking-stylist">{b.stylistName || 'Bất kỳ ai'}</td>
                        <td align="right">{typeof b.totalMinutes === 'number' ? `${b.totalMinutes}p` : '-'}</td>
                        <td align="right">{typeof b.totalAmt === 'number' ? `${b.totalAmt.toLocaleString()}đ` : '-'}</td>
                        <td align="center">
                          <span className={getStatusClass(b.status)}>{getStatusText(b.status)}</span>
                        </td>
                        <td align="center">
                          <div className="action-buttons">
                            {b.status === 'pending' && (
                              <button className="btn btn-confirm" onClick={() => handleConfirm(b.id)}>Xác nhận</button>
                            )}
                            {b.status === 'confirmed' && (
                              <>
                                <button className="btn btn-complete" onClick={() => handleComplete(b.id)}>Hoàn thành</button>
                                <button className="btn btn-no-show" onClick={() => handleNoShow(b.id)}>Không đến</button>
                              </>
                            )}
                            {(b.status === 'pending' || b.status === 'confirmed') && (
                              <button className="btn btn-cancel" onClick={() => handleCancel(b.id)}>Hủy</button>
                            )}
                            <button className="btn btn-view" onClick={() => handleView(b.id)}>Xem</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {detailOpen && detailBooking && (
        <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Booking #{detailBooking.id} — {getStatusText(detailBooking.status)}</h3>
            <div className="modal-info">
              <p><strong>Salon:</strong> {detailBooking.salonName || `ID: ${detailBooking.salon_id}`}</p>
              <p><strong>Khách hàng:</strong> {detailBooking.customerName || `ID: ${detailBooking.customer_id}`}</p>
              <p><strong>Stylist:</strong> {detailBooking.stylistName || 'Bất kỳ ai'}</p>
              <p><strong>Thời gian:</strong> {formatDateTime(detailBooking.appointmentAt)}</p>
            </div>
            
            <h4>Dịch vụ</h4>
            {detailServices.length === 0 ? <p>Không có dịch vụ.</p> : (
              <table className="services-table">
                <thead>
                  <tr>
                    <th align="left">Dịch vụ</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Thời lượng</th>
                    <th>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {detailServices.map((s:any) => (
                    <tr key={s.service_id}>
                      <td>{s.serviceName || `Service ${s.service_id}`}</td>
                      <td align="center">{s.quantity}</td>
                      <td align="right">{Number(s.unit_price).toLocaleString()}đ</td>
                      <td align="right">{s.duration_min}p</td>
                      <td align="right">{(Number(s.unit_price) * Number(s.quantity)).toLocaleString()}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            <div className="modal-summary">
              <div><strong>Tạm tính:</strong> <span>{detailBooking.subtotalAmt?.toLocaleString() || '0'}đ</span></div>
              <div><strong>Giảm giá:</strong> <span>{detailBooking.discountAmt?.toLocaleString() || '0'}đ</span></div>
              <div><strong>Tổng cộng:</strong> <span>{detailBooking.totalAmt?.toLocaleString() || '0'}đ</span></div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-close" onClick={() => setDetailOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}