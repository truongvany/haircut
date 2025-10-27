import { useEffect, useState } from "react";
import { getUser } from "../store/auth";
// Đảm bảo import đầy đủ các hàm API
import { listBookingsBySalonDate, confirmBooking, cancelBooking, markBookingCompleted, markBookingNoShow, getBookingDetails } from "../api/bookings";
import type { Booking } from "../api/bookings"; // Import Booking type
import { listStylists } from "../api/stylists";
import type { Stylist } from "../api/stylists";

// Helper function to format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function BookingsPage() {
  const user = getUser();
  const mySalonId = user?.role === "salon" ? user.id : 1; // Default to salon 1 for admin
  const [salonId, setSalonId] = useState<number>(mySalonId);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date())); // Default to today
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistFilter, setStylistFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<any | null>(null);
  const [detailServices, setDetailServices] = useState<Array<any>>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  async function loadBookings() {
    if (!salonId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listBookingsBySalonDate(salonId, selectedDate);
      // Sort bookings by time
      data.items.sort((a, b) => new Date(a.appointmentAt.replace(' ', 'T')).getTime() - new Date(b.appointmentAt.replace(' ', 'T')).getTime());
      setBookings(data.items);
    } catch (e: any) {
      console.error("Lỗi tải lịch hẹn:", e);
      setError(e?.response?.data?.error || "Không thể tải lịch hẹn");
      setBookings([]); // Clear bookings on error
    } finally {
      setLoading(false);
    }
  }

  // Load bookings when salonId or selectedDate changes
  useEffect(() => {
    loadBookings();
    // load stylists for current salon to allow filtering
    (async () => {
      try {
        const res = await listStylists(salonId, { limit: 200 });
        setStylists(res.items || []);
      } catch (err) {
        setStylists([]);
      }
    })();
  }, [salonId, selectedDate]);

  // Handler for confirming a booking
  const handleConfirm = async (bookingId: number) => {
    if (!confirm("Xác nhận lịch hẹn này?")) return;
    try {
      await confirmBooking(bookingId);
      loadBookings(); // Reload list after confirming
    } catch (e: any) {
      alert(e?.response?.data?.error || "Xác nhận thất bại");
    }
  };

  // Handler for canceling a booking
  const handleCancel = async (bookingId: number) => {
    if (!confirm("Hủy lịch hẹn này?")) return;
    try {
      await cancelBooking(bookingId);
      loadBookings(); // Reload list after canceling
    } catch (e: any) {
      alert(e?.response?.data?.error || "Hủy thất bại");
    }
  };

  // Handler for marking as completed
  const handleComplete = async (bookingId: number) => {
    if (!confirm("Đánh dấu lịch hẹn này là ĐÃ HOÀN THÀNH?")) return;
    try {
      await markBookingCompleted(bookingId);
      loadBookings(); // Reload list
    } catch (e: any) {
      alert(e?.response?.data?.error || "Đánh dấu hoàn thành thất bại");
    }
  };

  // Handler for marking as no-show
  const handleNoShow = async (bookingId: number) => {
    if (!confirm("Đánh dấu lịch hẹn này là KHÁCH KHÔNG ĐẾN?")) return;
    try {
      await markBookingNoShow(bookingId);
      loadBookings(); // Reload list
    } catch (e: any) {
      alert(e?.response?.data?.error || "Đánh dấu không đến thất bại");
    }
  };

  // View details for a booking
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


  // Format time for display (HH:MM)
  const formatTime = (dateTimeString: string) => {
    try {
      // Thay thế dấu cách bằng chữ 'T' để giống định dạng ISO 8601 hơn, giúp trình duyệt hiểu
      const dateObject = new Date(dateTimeString.replace(' ', 'T'));
      // Kiểm tra xem Date object có hợp lệ không
      if (isNaN(dateObject.getTime())) {
          return 'Invalid Date Str'; // Trả về lỗi nếu chuỗi không hợp lệ
      }
      return dateObject.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        console.error("Error formatting time:", e, "Input:", dateTimeString);
        return 'N/A'; // Trả về N/A nếu có lỗi khác
    }
  };

  return (
    <div>
      <h2>Booking Management</h2>

      {/* Salon Selector (for Admin) */}
      {user?.role === "admin" && (
        <div style={{ margin: "8px 0" }}>
          <label>Salon ID: </label>
          <input
            type="number"
            value={salonId}
            onChange={e => setSalonId(Number(e.target.value))}
            style={{ width: 120, marginRight: '1em' }}
          />
        </div>
      )}

      {/* Date Selector */}
      <div style={{ margin: "8px 0" }}>
        <label>Chọn ngày: </label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Loading/Error Message */}
      {loading && <p>Đang tải lịch hẹn...</p>}
      {error && <p style={{ color: 'crimson' }}>Lỗi: {error}</p>}

      {/* Bookings Table */}
      {/* Stylist filter */}
      <div style={{ margin: '8px 0' }}>
        <label>Filter by Stylist: </label>
        <select value={stylistFilter ?? ''} onChange={e => setStylistFilter(e.target.value ? Number(e.target.value) : null)}>
          <option value="">-- All --</option>
          {stylists.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
      </div>

      {!loading && !error && (
        <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", marginTop: '1em' }}>
          <table width="100%" cellPadding={8}>
            <thead style={{ background: "#fafafa" }}>
              <tr>
                <th align="left">Giờ hẹn</th>
                <th align="left">Khách (ID)</th>
                <th align="left">Stylist (ID)</th>
                <th align="right">Thời lượng (phút)</th>
                <th align="right">Tổng tiền</th>
                <th align="center">Trạng thái</th>
                <th align="center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={7} align="center">Không có lịch hẹn cho ngày này.</td></tr>
              ) : (
                bookings
                  .filter(b => (stylistFilter ? (b.stylistId === stylistFilter) : true))
                  .map(b => (
                  <tr key={b.id}>
                    <td>{formatTime(b.appointmentAt)}</td>
                    <td>{b.customerName ?? (b.customerId ?? '-')}</td>
                    <td>{b.stylistName ?? (b.stylistId ?? 'N/A')}</td>
                    {/* Thêm kiểm tra kiểu dữ liệu trước khi hiển thị */}
                    <td align="right">{typeof b.totalMinutes === 'number' ? b.totalMinutes : '-'}</td>
                    <td align="right">{typeof b.totalAmt === 'number' ? b.totalAmt.toLocaleString() : '-'}</td>
                    <td align="center">{b.status}</td>
                    {/* Cập nhật các nút hành động */}
                    <td align="center" style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      {/* Nút Xác nhận */}
                      {b.status === 'pending' && (
                        <button onClick={() => handleConfirm(b.id)} style={{fontSize: '0.8em', padding: '2px 6px', background: 'green', color: 'white'}}>X.Nhận</button>
                      )}
                      {/* Nút Hoàn thành */}
                      {b.status === 'confirmed' && (
                        <button onClick={() => handleComplete(b.id)} style={{fontSize: '0.8em', padding: '2px 6px', background: 'blue', color: 'white'}}>H.Thành</button>
                      )}
                       {/* Nút Không đến */}
                      {b.status === 'confirmed' && (
                        <button onClick={() => handleNoShow(b.id)} style={{fontSize: '0.8em', padding: '2px 6px', background: 'orange', color: 'black'}}>K.Đến</button>
                      )}
                      {/* Nút Hủy */}
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <button onClick={() => handleCancel(b.id)} style={{fontSize: '0.8em', padding: '2px 6px', background: '#555', color: 'white'}}>Hủy</button>
                      )}
                      {/* View details */}
                      <button onClick={() => handleView(b.id)} style={{fontSize: '0.8em', padding: '2px 6px'}}>Xem</button>
                      {/* Có thể thêm nút Xem chi tiết sau */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && detailBooking && (
        <div style={{ position: 'fixed', left:0, top:0, right:0, bottom:0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetailOpen(false)}>
          <div style={{ background: 'white', padding: 18, borderRadius: 6, minWidth: 420, maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
            <h3>Booking #{detailBooking.id} — {detailBooking.status}</h3>
            <p><strong>Salon:</strong> {detailBooking.salonName ?? detailBooking.salon_id}</p>
            <p><strong>Khách:</strong> {detailBooking.customerName ?? detailBooking.customer_id}</p>
            <p><strong>Stylist:</strong> {detailBooking.stylistName ?? detailBooking.stylist_id}</p>
            <p><strong>Thời gian:</strong> {formatTime(detailBooking.appointmentAt)} {detailBooking.appointmentAt?.substr(0,10)}</p>
            <h4>Dịch vụ</h4>
            {detailServices.length === 0 ? <p>Không có dịch vụ.</p> : (
              <table style={{width: '100%'}}>
                <thead><tr><th align="left">Dịch vụ</th><th>SL</th><th>Đơn giá</th><th>Thời lượng</th><th>Tổng</th></tr></thead>
                <tbody>
                  {detailServices.map((s:any) => (
                    <tr key={s.service_id}>
                      <td>{s.serviceName ?? s.service_id}</td>
                      <td align="center">{s.quantity}</td>
                      <td align="right">{Number(s.unit_price).toLocaleString()}đ</td>
                      <td align="right">{s.duration_min}p</td>
                      <td align="right">{(Number(s.unit_price) * Number(s.quantity)).toLocaleString()}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 12 }}>
              <div><strong>Tạm tính:</strong> {detailBooking.subtotalAmt?.toLocaleString() ?? '-' }đ</div>
              <div><strong>Giảm:</strong> {detailBooking.discountAmt?.toLocaleString() ?? '0'}đ</div>
              <div><strong>Tổng:</strong> {detailBooking.totalAmt?.toLocaleString() ?? '-'}đ</div>
            </div>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button onClick={() => setDetailOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}