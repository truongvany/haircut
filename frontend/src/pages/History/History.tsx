import { useEffect, useState } from 'react';
import { listMyBookings, cancelBooking } from '../../api/bookings';
import type { Booking } from '../../api/bookings';
import ReviewForm from './ReviewForm';
import '../../components/History.css';

const parseDateTime = (dateTimeString: string): Date => {
  if (!dateTimeString) return new Date();
  
  // Replace space with T for ISO format
  const isoString = dateTimeString.includes('T') 
    ? dateTimeString 
    : dateTimeString.replace(' ', 'T');
  
  return new Date(isoString);
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
    console.error("Error formatting datetime:", e);
    return 'N/A';
  }
};

const getStatusText = (status: string): string => {
  const statusTextMap: Record<string, string> = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'no_show': 'Không đến'
  };
  return statusTextMap[status] || status;
};

export default function BookingHistoryPage(){
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewsMap, setReviewsMap] = useState<Record<number, any>>({});

  async function checkReviewsStatus() {
    try {
      const { checkReview } = await import('../../api/reviews');
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const reviews: Record<number, any> = {};

      for (const booking of completedBookings) {
        const result = await checkReview(booking.id);
        if (result.has_review) {
          reviews[booking.id] = result.review;
        }
      }

      setReviewsMap(reviews);
    } catch (err) {
      console.error('Error checking reviews:', err);
    }
  }

  async function load(){
    setLoading(true);
    setError(null);
    try{
      console.log('🔍 Calling listMyBookings...');
      const res = await listMyBookings();
      console.log('✅ Raw response:', res);
      
      if (!res.items || res.items.length === 0) {
        console.warn('⚠️ No bookings found');
        setBookings([]);
      } else {
        // Sort by appointment time
        const sorted = res.items.sort((a,b)=> {
          const dateA = parseDateTime(a.appointmentAt);
          const dateB = parseDateTime(b.appointmentAt);
          return dateA.getTime() - dateB.getTime();
        });
        console.log('✅ Sorted bookings:', sorted);
        setBookings(sorted);
      }
    }catch(e:any){
      console.error('❌ Error:', e);
      setError(e?.response?.data?.error || 'Không thể tải lịch sử');
      setBookings([]);
    }finally{ 
      setLoading(false); 
    }
  }

  useEffect(()=>{ load(); checkReviewsStatus(); }, []);

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
  const submitReview = async (booking: Booking, ratingValue: number, commentText: string) => {
    if (!confirm('Gửi đánh giá cho lịch này?')) return;
    try {
      const { postReview, checkReview } = await import('../../api/reviews');
      await postReview(booking.id, { rating: ratingValue, comment: commentText });
      alert('Cảm ơn đánh giá của bạn');
      
      // Update the reviewsMap with the new review
      const result = await checkReview(booking.id);
      if (result.has_review) {
        setReviewsMap(prev => ({
          ...prev,
          [booking.id]: result.review
        }));
      }
      
      setReviewingId(null);
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
                  <div className="booking-salon-name">{b.salonName || 'Salon'}</div>
                  <div className="booking-details">
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Stylist:</span>
                      <span className="booking-detail-value">{b.stylistName || 'Bất kỳ ai'}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Thời gian:</span>
                      <span className="booking-detail-value">{formatDateTime(b.appointmentAt)}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Thời lượng:</span>
                      <span className="booking-detail-value">{b.totalMinutes} phút</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Tổng tiền:</span>
                      <span className="booking-detail-value">{b.totalAmt?.toLocaleString()}đ</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Trạng thái:</span>
                      <span className={`booking-status ${b.status}`}>{getStatusText(b.status)}</span>
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
                    {b.salonName || 'Salon'}
                    <span className={`booking-status ${b.status}`}>{getStatusText(b.status)}</span>
                  </div>
                  <div className="booking-details">
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Stylist:</span>
                      <span className="booking-detail-value">{b.stylistName || 'Bất kỳ ai'}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span className="booking-detail-label">Thời gian:</span>
                      <span className="booking-detail-value">{formatDateTime(b.appointmentAt)}</span>
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
                {b.status === 'completed' && (
                  <>
                    {reviewsMap[b.id] ? (
                      <div className="booking-reviewed-badge">
                        <div className="review-badge-header">
                          <span className="review-checkmark">✓</span>
                          <span className="review-status-text">Đã đánh giá</span>
                        </div>
                        <div className="review-badge-content">
                          <div className="review-rating">
                            {'⭐'.repeat(reviewsMap[b.id].rating)}
                            <span className="rating-number">({reviewsMap[b.id].rating}/5)</span>
                          </div>
                          {reviewsMap[b.id].comment && (
                            <p className="review-badge-comment">{reviewsMap[b.id].comment}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="booking-actions">
                          <button className="btn-review" onClick={()=> setReviewingId(reviewingId===b.id? null : b.id)}>
                            ⭐ Đánh giá
                          </button>
                        </div>
                        {reviewingId === b.id && (
                          <ReviewForm
                            onSubmit={async (rating, comment) => {
                              await submitReview(b, rating, comment);
                            }}
                            onCancel={() => setReviewingId(null)}
                          />
                        )}
                      </>
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