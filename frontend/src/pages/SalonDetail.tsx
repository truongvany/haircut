import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { listServices } from '../api/services';
import { listStylists } from '../api/stylists';
import { listReviews } from '../api/reviews';

export default function SalonDetailPage() {
  const { id } = useParams();
  const salonId = Number(id || 0);
  const [salon, setSalon] = useState<any | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [stylists, setStylists] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!salonId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [salRes, svcRes, styRes, revRes] = await Promise.all([
          api.get(`/v1/salons/${salonId}`),
          listServices(salonId, { limit: 200 }),
          listStylists(salonId, { limit: 200 }),
          listReviews(salonId)
        ]);
        if (!mounted) return;
        setSalon(salRes.data?.salon ?? null);
        setServices(svcRes.items || []);
        setStylists(styRes.items || []);
        setReviews(revRes.items || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Không thể tải dữ liệu salon');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [salonId]);

  if (!salonId) return <div>Salon ID không hợp lệ</div>;
  if (loading) return <div>Đang tải thông tin salon...</div>;
  if (error) return <div style={{ color: 'crimson' }}>{error}</div>;
  if (!salon) return <div>Không tìm thấy salon</div>;

  return (
    <div style={{ maxWidth: 900, margin: 'auto' }}>
      <h2>{salon.name}</h2>
      {salon.cover_image && <img src={salon.cover_image} alt={salon.name} style={{ maxWidth: '100%', borderRadius: 8 }} />}
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ flex: 2 }}>
          <p><strong>Địa chỉ:</strong> {salon.address_text ?? salon.address}</p>
          <p><strong>Mô tả:</strong></p>
          <div style={{ whiteSpace: 'pre-wrap' }}>{salon.description ?? salon.bio ?? 'Không có mô tả'}</div>

          <h3 style={{ marginTop: 18 }}>Dịch vụ</h3>
          {services.length === 0 ? <p>Không có dịch vụ.</p> : (
            <ul>
              {services.map(s => (
                <li key={s.id}>{s.name} — {s.durationMin ?? s.duration_min} phút — {Number(s.price ?? s.base_price).toLocaleString()}đ</li>
              ))}
            </ul>
          )}

          <h3>Đội ngũ Stylist</h3>
          {stylists.length === 0 ? <p>Chưa có stylist.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
              {stylists.map(st => (
                <div key={st.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontWeight: '600' }}>{st.fullName}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{st.bio ?? ''}</div>
                  <div style={{ marginTop: 6 }}><small>Rating: {st.ratingAvg ?? 0} ({st.ratingCount ?? 0})</small></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: 12 }}>
          <h3>Đánh giá</h3>
          {reviews.length === 0 ? <p>Chưa có đánh giá.</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ border: '1px solid #f0f0f0', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontWeight: 600 }}>{r.customerName ?? `Khách #${r.customer_id}`}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{new Date(r.created_at).toLocaleString()}</div>
                  <div style={{ marginTop: 6 }}>Rating: {r.rating} / 5</div>
                  <div style={{ marginTop: 6 }}>{r.comment}</div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
