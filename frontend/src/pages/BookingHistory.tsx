import { useEffect, useState } from 'react';
import { listMyBookings, cancelBooking } from '../api/bookings';
import type { Booking } from '../api/bookings';

export default function BookingHistoryPage(){
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(){
    setLoading(true);
    setError(null);
    try{
      const res = await listMyBookings();
      setBookings(res.items.sort((a,b)=> new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime()));
    }catch(e:any){
      setError(e?.response?.data?.error || 'Không thể tải lịch sử');
      setBookings([]);
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show');
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

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
      // lazy-load API to avoid circular imports
      const { postReview } = await import('../api/reviews');
      await postReview(booking.id, { rating, comment });
      alert('Cảm ơn đánh giá của bạn');
      setReviewingId(null); setRating(5); setComment('');
      await load();
    } catch (e:any) {
      alert(e?.response?.data?.error || 'Không thể gửi đánh giá');
    }
  };

  return (
    <div>
      <h2>Lịch sử đặt lịch của tôi</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{color:'crimson'}}>{error}</p>}

      <section>
        <h3>Upcoming (Sắp tới)</h3>
        {upcoming.length === 0 ? <p>Không có lịch hẹn sắp tới.</p> : (
          <ul>
            {upcoming.map(b=> (
              <li key={b.id} style={{marginBottom:12}}>
                <strong>{b.salonName ?? 'Salon'}</strong> — {b.stylistName ?? 'Bất kỳ ai'} — {new Date(b.appointmentAt).toLocaleString()} — {b.totalMinutes} phút — {b.totalAmt?.toLocaleString()}đ
                {' '}
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <button onClick={()=>onCancel(b)} style={{marginLeft:12}}>Hủy</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{marginTop:24}}>
        <h3>Past (Đã qua)</h3>
        {past.length === 0 ? <p>Chưa có lịch đã qua.</p> : (
          <ul>
            {past.map(b=> (
              <li key={b.id} style={{marginBottom:8}}>
                <strong>{b.salonName ?? 'Salon'}</strong> — {b.stylistName ?? 'Bất kỳ ai'} — {new Date(b.appointmentAt).toLocaleString()} — {b.status}
                {b.status === 'completed' && (
                  <>
                    {' '}
                    <button onClick={()=> setReviewingId(reviewingId===b.id? null : b.id)} style={{marginLeft:12}}>Đánh giá</button>
                    {reviewingId === b.id && (
                      <div style={{ marginTop:8, border:'1px solid #eee', padding:8, borderRadius:6 }}>
                        <div>
                          <label>Rating: </label>
                          <select value={rating} onChange={e=>setRating(Number(e.target.value))}>
                            <option value={5}>5</option>
                            <option value={4}>4</option>
                            <option value={3}>3</option>
                            <option value={2}>2</option>
                            <option value={1}>1</option>
                          </select>
                        </div>
                        <div style={{ marginTop:6 }}>
                          <textarea placeholder="Ghi nhận của bạn" value={comment} onChange={e=>setComment(e.target.value)} rows={3} style={{width:'100%'}} />
                        </div>
                        <div style={{ marginTop:6 }}>
                          <button onClick={()=> submitReview(b)}>Gửi</button>
                          <button onClick={()=> setReviewingId(null)} style={{ marginLeft:8 }}>Hủy</button>
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
