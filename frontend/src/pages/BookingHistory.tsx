import { useEffect, useState } from 'react';
import { listMyBookings, cancelBooking } from '../api/bookings';
import type { Booking } from '../api/bookings';
import '../components/History.css';

export default function BookingHistoryPage(){
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  async function load(){
    setLoading(true);
    setError(null);
    try{
      const res = await listMyBookings();
      setBookings(res.items.sort((a,b)=> new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime()));
    }catch(e:any){
      setError(e?.response?.data?.error || 'Không thể tải lịch sử');
      setBookings([]);
    }finally{ 
      setLoading(false); 
    }
  }

  useEffect(()=>{ load(); }, []);

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show');

  async function onCancel(b: Booking){
    if (!confirm('Bạn có chắc muốn hủy lịch này?')) return;
    try{
      await cancelBooking(b.id);
      await load();
      alert('Đã hủy lịch');
    }catch(e:any){
      alert(e?.response?.data?.error || 'Không thể hủy');
    }
  }

  const submitReview = async (booking: Booking) => {
    if (!confirm('Gửi đánh giá cho lịch này?')) return;
    try {
      const { postReview } = await import('../api/reviews');
      await postReview(booking.id, { rating, comment });
      alert('Cảm ơn đánh giá của bạn');
      setReviewingId(null); 
      setRating(5); 
      setComment('');
      await load();
    } catch (e:any) {
      alert(e?.response?.data?.error || 'Không thể gửi đánh giá');
    }
  };

  return (
    <div className="booking-history-page">
      <h2>Lịch sử đặt lịch của tôi</h2>
      {loading && <p className="booking-loading">Đang tải...</p>}
      {error && <p className="booking-error">{error}</p>}

      <section className="booking-section">
        <h3>Upcoming (Sắp tới)</h3>
        {upcoming.length === 0 ? (
          <p className="booking-empty">Không có lịch hẹn sắp tới.</p>
        ) : (
          <ul className="booking-list">
            {upcoming.map(b=> (
              <li key={b.id} className="booking-item">
                <div className="booking-info">
                  <div className="booking-salon-name">{b.salonName ?? 'Salon'}</div>
                  <div className="booking-details">
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Stylist:</span>
                      <span className="booking-detail-value">{b.stylistName ?? 'Bất kỳ ai'}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Thời gian:</span>
                      <span className="booking-detail-value">{new Date(b.appointmentAt).toLocaleString()}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Thời lượng:</span>
                      <span className="booking-detail-value">{b.totalMinutes} phút</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Tổng tiền:</span>
                      <span className="booking-detail-value">{b.totalAmt?.toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <div className="booking-actions">
                    <button className="btn-cancel" onClick={()=>onCancel(b)}>Hủy lịch</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="booking-section">
        <h3>Past (Đã qua)</h3>
        {past.length === 0 ? (
          <p className="booking-empty">Chưa có lịch đã qua.</p>
        ) : (
          <ul className="booking-list">
            {past.map(b=> (
              <li key={b.id} className="booking-item">
                <div className="booking-info">
                  <div className="booking-salon-name">
                    {b.salonName ?? 'Salon'}
                    <span className={`booking-status ${b.status}`}>{b.status}</span>
                  </div>
                  <div className="booking-details">
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Stylist:</span>
                      <span className="booking-detail-value">{b.stylistName ?? 'Bất kỳ ai'}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Thời gian:</span>
                      <span className="booking-detail-value">{new Date(b.appointmentAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {b.status === 'completed' && (
                  <>
                    <div className="booking-actions">
                      <button className="btn-review" onClick={()=> setReviewingId(reviewingId===b.id? null : b.id)}>
                        Đánh giá
                      </button>
                    </div>
                    {reviewingId === b.id && (
                      <div className="review-form">
                        <div className="review-form-group">
                          <label>Rating:</label>
                          <select value={rating} onChange={e=>setRating(Number(e.target.value))}>
                            <option value={5}>⭐⭐⭐⭐⭐ (5 sao)</option>
                            <option value={4}>⭐⭐⭐⭐ (4 sao)</option>
                            <option value={3}>⭐⭐⭐ (3 sao)</option>
                            <option value={2}>⭐⭐ (2 sao)</option>
                            <option value={1}>⭐ (1 sao)</option>
                          </select>
                        </div>
                        <div className="review-form-group">
                          <label>Nhận xét của bạn:</label>
                          <textarea 
                            placeholder="Chia sẻ trải nghiệm của bạn..." 
                            value={comment} 
                            onChange={e=>setComment(e.target.value)} 
                            rows={3}
                          />
                        </div>
                        <div className="review-form-actions">
                          <button className="btn-submit" onClick={()=> submitReview(b)}>Gửi đánh giá</button>
                          <button className="btn-cancel-review" onClick={()=> setReviewingId(null)}>Hủy</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}