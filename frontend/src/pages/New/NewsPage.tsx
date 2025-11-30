import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listNews } from '../../api/news';
import '../../components/NewsPage.css';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  badge?: string;
  created_at: string;
}

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNewsData();
  }, []);

  async function loadNewsData() {
    try {
      const response = await listNews();
      const items = response?.items || response || [];
      setNewsItems(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setNewsItems([]);
    } finally {
      setLoading(false);
    }
  }

  function openModal(news: NewsItem) {
    setSelectedNews(news);
    document.body.style.overflow = 'hidden'; // Prevent scroll when modal open
  }

  function closeModal() {
    setSelectedNews(null);
    document.body.style.overflow = 'auto'; // Restore scroll
  }

  return (
    <div className="news-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-welcome">Welcome to</span>
              <span className="hero-brand">HairCut</span>
            </h1>
            <p className="hero-subtitle">
              Trải nghiệm dịch vụ cắt tóc chuyên nghiệp tại các salon hàng đầu
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate('/Newbooking')}
              >
                <span>📅</span> Đặt Lịch Ngay
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/salons')}
              >
                <span>🏢</span> Xem Salon
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">✂️</div>
            <div className="floating-card card-2">💇</div>
            <div className="floating-card card-3">💅</div>
            <div className="floating-card card-4">💆</div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">11+</div>
            <div className="stat-label">Salon Hàng Đầu</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Stylist Chuyên Nghiệp</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Khách Hàng Hài Lòng</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">4.8★</div>
            <div className="stat-label">Đánh Giá Trung Bình</div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="news-section">
        <div className="news-section-header">
          <h2>📰 Tin Tức & Khuyến Mãi</h2>
          <p>Cập nhật những xu hướng mới nhất và ưu đãi đặc biệt</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải tin tức...</p>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Hiện chưa có tin tức nào. Vui lòng quay lại sau!</p>
          </div>
        ) : (
          <>
            {/* Featured News */}
            {newsItems.length > 0 && (
              <div className="featured-news">
                <article 
                  className="featured-card"
                  onClick={() => openModal(newsItems[0])}
                  style={{ cursor: 'pointer' }}
                >
                  {newsItems[0].badge && (
                    <span className={`badge badge-${newsItems[0].badge}`}>
                      {newsItems[0].badge}
                    </span>
                  )}
                  <h3 className="featured-title">{newsItems[0].title}</h3>
                  <p className="featured-date">
                    {new Date(newsItems[0].created_at).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="featured-content">{newsItems[0].content}</p>
                  <div className="featured-overlay"></div>
                </article>
              </div>
            )}

            {/* News Grid */}
            <div className="news-list">
              {newsItems.slice(1).map((item, idx) => (
                <article key={item.id} className="news-item" style={{ '--index': idx } as React.CSSProperties}>
                  {item.badge && (
                    <span className={`news-badge badge-${item.badge}`}>{item.badge}</span>
                  )}
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-meta">
                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="news-content">{item.content}</p>
                  <div className="news-footer">
                    <span 
                      className="read-more"
                      onClick={() => openModal(item)}
                    >
                      Đọc thêm →
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* News Modal */}
      {selectedNews && (
        <div className="news-modal-overlay" onClick={closeModal}>
          <div className="news-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <span>✕</span>
            </button>
            
            <div className="modal-header">
              {selectedNews.badge && (
                <span className={`news-badge badge-${selectedNews.badge}`}>
                  {selectedNews.badge}
                </span>
              )}
              <h2 className="modal-title">{selectedNews.title}</h2>
              <p className="modal-date">
                📅 {new Date(selectedNews.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>

            <div className="modal-body">
              <p className="modal-content">{selectedNews.content}</p>
              
              {/* You can add more detailed content here if available */}
              <div className="modal-extra-info">
                <h3>📌 Thông tin chi tiết</h3>
                <p>
                  Đây là nội dung chi tiết của bài viết. Bạn có thể mở rộng phần này 
                  để hiển thị thêm thông tin về tin tức, hình ảnh, hoặc các chi tiết khác.
                </p>
                <p>
                  Hãy liên hệ với chúng tôi qua hotline hoặc đặt lịch trực tiếp 
                  trên website để được tư vấn và hỗ trợ tốt nhất!
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-action" onClick={() => navigate('/bookings')}>
                📅 Đặt Lịch Ngay
              </button>
              <button className="btn-modal-secondary" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2>🌟 Tại Sao Chọn HairCut?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Đặt Lịch Dễ Dàng</h3>
              <p>Chọn salon, dịch vụ, stylist yêu thích chỉ trong vài click. Lịch trực tuyến 24/7</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Thanh Toán An Toàn</h3>
              <p>Hỗ trợ nhiều phương thức: tiền mặt, chuyển khoản. Giao dịch bảo mật 100%</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Chat Hỗ Trợ 24/7</h3>
              <p>Liên hệ trực tiếp với salon và team hỗ trợ. Trả lời nhanh chóng mọi thắc mắc</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Đánh Giá Uy Tín</h3>
              <p>Xem đánh giá thực từ khách hàng. Chọn stylist dựa trên kinh nghiệm</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎁</div>
              <h3>Ưu Đãi Đặc Biệt</h3>
              <p>Nhận khuyến mãi, điểm thưởng, và ưu đãi độc quyền cho thành viên</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Salon Hàng Đầu</h3>
              <p>Kết nối với các salon chuyên nghiệp, được kiểm duyệt và tin cậy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <h2>💭 Khách Hàng Nói Gì Về Chúng Tôi</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">👩</div>
                <div className="testimonial-info">
                  <h4>Nguyễn Thùy Linh</h4>
                  <div className="stars">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="testimonial-text">
                "Ứng dụng rất tiện lợi! Tôi có thể đặt lịch ngay trên điện thoại mà không cần gọi điện. Cắt tóc đẹp lắm!"
              </p>
              <p className="testimonial-date">2 tuần trước</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">👨</div>
                <div className="testimonial-info">
                  <h4>Trần Minh Quân</h4>
                  <div className="stars">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="testimonial-text">
                "Chat với salon rất hữu ích. Mình có thể hỏi về kiểu tóc trước khi đến. Team rất thân thiện!"
              </p>
              <p className="testimonial-date">1 tuần trước</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">👩</div>
                <div className="testimonial-info">
                  <h4>Phạm Hương Giang</h4>
                  <div className="stars">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="testimonial-text">
                "Giá cả hợp lý, dịch vụ chất lượng. Tôi đã ghé 5 lần và luôn hài lòng. Sẽ tiếp tục sử dụng!"
              </p>
              <p className="testimonial-date">3 ngày trước</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <div className="newsletter-content">
            <h2>📧 Nhận Ưu Đãi & Tin Tức Mới Nhất</h2>
            <p>Đăng ký nhận bản tin để cập nhật những ưu đãi độc quyền, mẹo chăm sóc tóc, và sự kiện đặc biệt</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Nhập email của bạn..." 
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-button">
                Đăng Ký
              </button>
            </form>
            <p className="newsletter-info">
              ✓ Chúng tôi sẽ không bao giờ chia sẻ email của bạn
            </p>
          </div>
          <div className="newsletter-visual">
            <div className="newsletter-icon">💌</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Sẵn sàng tìm kiếm phong cách của bạn?</h2>
          <p>Đặt lịch ngay hôm nay và nhận được ưu đãi đặc biệt cho khách hàng mới</p>
          <button 
            className="cta-button"
            onClick={() => navigate('/bookings')}
          >
            Bắt Đầu Ngay →
          </button>
        </div>
      </section>
    </div>
  );
}