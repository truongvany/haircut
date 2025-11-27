import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';
import '../../components/SalonDetail.css';

interface Salon {
  id: number;
  name: string;
  address_text: string;
  phone: string;
  email: string;
  description: string;
  open_time: string;
  close_time: string;
  rating_avg: string | number;
  rating_count: string | number;
}

interface Service {
  id: number;
  name: string;
  durationMin: number;
  price: number;
  active: number;
}

interface Stylist {
  id: number;
  fullName: string;
  bio: string;
  ratingAvg: string | number;
  ratingCount: string | number;
  active: number;
}

interface Review {
  id: number;
  customerName: string;
  stylistName: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function SalonDetailPage() {
  const { id } = useParams();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/v1/salons/${id}`);
        if (!mounted) return;
        setSalon(data.salon);
        setServices(data.services || []);
        setStylists(data.stylists || []);
        setReviews(data.reviews || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Không thể tải thông tin salon');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  if (loading) {
    return (
      <div className="salon-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin salon...</p>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="salon-detail-error">
        <div className="error-icon">⚠️</div>
        <p>{error || 'Không tìm thấy salon'}</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatTime = (time: string) => {
    return time ? time.substring(0, 5) : '';
  };

  const toNumber = (val: string | number | undefined | null): number => {
    if (typeof val === 'number') return val;
    const num = parseFloat(String(val || '0'));
    return isNaN(num) ? 0 : num;
  };

  const salonRating = toNumber(salon.rating_avg);
  const salonRatingCount = toNumber(salon.rating_count);

  return (
    <div className="salon-detail-page">
      {/* Header Section */}
      <div className="salon-header">
        <div className="salon-header-content">
          <div className="salon-icon">✂️</div>
          <div className="salon-title-section">
            <h1 className="salon-title">{salon.name}</h1>
            <div className="salon-rating">
              <span className="stars">{'⭐'.repeat(Math.round(salonRating))}</span>
              <span className="rating-text">{salonRating.toFixed(1)} ({salonRatingCount} đánh giá)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="salon-detail-container">
        {/* Main Info Section */}
        <div className="salon-main-grid">
          <div className="salon-info-card">
            <h2 className="section-title">Thông tin</h2>
            
            <div className="info-item">
              <span className="info-icon">📍</span>
              <div>
                <strong>Địa chỉ:</strong>
                <p>{salon.address_text}</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">📞</span>
              <div>
                <strong>Điện thoại:</strong>
                <p>{salon.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">✉️</span>
              <div>
                <strong>Email:</strong>
                <p>{salon.email || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">🕐</span>
              <div>
                <strong>Giờ mở cửa:</strong>
                <p>{formatTime(salon.open_time)} - {formatTime(salon.close_time)}</p>
              </div>
            </div>

            {salon.description && (
              <div className="info-item">
                <span className="info-icon">📝</span>
                <div>
                  <strong>Mô tả:</strong>
                  <p>{salon.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Services Section */}
          <div className="services-card">
            <h2 className="section-title">Dịch vụ</h2>
            {services.length === 0 ? (
              <p className="empty-message">Chưa có dịch vụ nào.</p>
            ) : (
              <div className="services-list">
                {services.map(service => (
                  <div key={service.id} className="service-item">
                    <div className="service-info">
                      <h3 className="service-name">{service.name}</h3>
                      <p className="service-duration">⏱️ {service.durationMin} phút</p>
                    </div>
                    <div className="service-price">{formatPrice(service.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stylists Section */}
        <div className="stylists-section">
          <h2 className="section-title">Đội ngũ Stylist</h2>
          {stylists.length === 0 ? (
            <p className="empty-message">Chưa có stylist nào.</p>
          ) : (
            <div className="stylists-grid">
              {stylists.map(stylist => {
                const stylistRating = toNumber(stylist.ratingAvg);
                const stylistRatingCount = toNumber(stylist.ratingCount);
                return (
                  <div key={stylist.id} className="stylist-card">
                    <div className="stylist-avatar">👤</div>
                    <h3 className="stylist-name">{stylist.fullName}</h3>
                    {stylist.bio && <p className="stylist-bio">{stylist.bio}</p>}
                    <div className="stylist-rating">
                      <span className="stars">{'⭐'.repeat(Math.round(stylistRating))}</span>
                      <span className="rating-text">{stylistRating.toFixed(1)} ({stylistRatingCount})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2 className="section-title">⭐ Đánh giá từ khách hàng</h2>
            <span className="reviews-count">{reviews.length} đánh giá</span>
          </div>
          {reviews.length === 0 ? (
            <p className="empty-message">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review, index) => (
                <div key={review.id} className="review-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="review-header">
                    <div className="review-user">
                      <div className="user-avatar">👤</div>
                      <div className="user-info">
                        <strong className="user-name">{review.customerName || 'Khách ẩn danh'}</strong>
                        {review.stylistName && (
                          <p className="stylist-served">👨‍💼 {review.stylistName}</p>
                        )}
                        <p className="review-date">
                          📅 {new Date(review.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="review-rating-display">
                      <div className="stars-big">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={star <= (review.rating || 0) ? 'star active' : 'star'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="rating-number">{review.rating}/5</span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="review-comment">💬 {review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}