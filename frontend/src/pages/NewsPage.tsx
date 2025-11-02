// frontend/src/pages/NewsPage.tsx
import '../components/NewsPage.css'; // **Sử dụng đường dẫn CSS của bạn**

export default function NewsPage() {
  // **Thêm tin tức cho đủ 6 mục**
  const newsItems = [
    { 
      id: 1, 
      title: 'Khai trương chi nhánh mới tại Quận 3!', 
      date: '2025-10-28', 
      content: 'Chúng tôi vui mừng thông báo khai trương chi nhánh mới với nhiều ưu đãi hấp dẫn, giảm giá 30% cho 100 khách hàng đầu tiên...',
      badge: '🔥 HOT' // Badge của bạn
    },
    { 
      id: 2, 
      title: 'Xu hướng tóc Thu-Đông 2025', 
      date: '2025-10-25', 
      content: 'Cập nhật những kiểu tóc và màu nhuộm hot nhất mùa này. Các tông màu nâu trà, khói xám đang quay trở lại mạnh mẽ...',
      badge: '✨ NEW' // Badge của bạn
    },
    { 
      id: 3, 
      title: 'Chương trình khuyến mãi đặc biệt tháng 11', 
      date: '2025-10-20', 
      content: 'Giảm giá 20% cho tất cả các dịch vụ uốn/nhuộm khi đặt lịch trực tuyến qua website của chúng tôi...',
      badge: '💰 SALE' // Badge của bạn
    },
    // **Tin tức mới**
    { 
      id: 4, 
      title: 'Xu hướng "Glass Hair" trở lại', 
      date: '2025-10-18', 
      content: 'Kiểu tóc bóng mượt như gương đang được các ngôi sao lăng xê. Tìm hiểu cách chăm sóc để có mái tóc glass hair...',
      badge: 'Xu Hướng'
    },
    { 
      id: 5, 
      title: 'Khuyến mãi Chào Đông - Giảm 15%', 
      date: '2025-10-15', 
      content: 'Mùa đông đến rồi, hãy làm mới mái tóc của bạn với ưu đãi 15% cho dịch vụ phục hồi tóc chuyên sâu.',
      badge: '💰 SALE'
    },
    { 
      id: 6, 
      title: 'Haircut tuyển dụng 5 Stylist tài năng', 
      date: '2025-10-12', 
      content: 'Gia nhập đội ngũ của chúng tôi. Chúng tôi đang tìm kiếm 5 thợ tóc tay nghề cao, đam mê và sáng tạo. Nộp CV ngay!',
      badge: 'Tuyển Dụng'
    },
  ];

  return (
    // **Bỏ thẻ <div className="card"> bên ngoài**
    <div>
      {/* **Bọc tiêu đề trong một thẻ card riêng** */}
        <div className="card" style={{ marginBottom: '24px', textAlign: 'center' }}>
  <h2 style={{
    fontSize: '35px',
    fontWeight: '700',
    color: '#4b5563',
    textShadow: '0 0 10px #00e5ff, 0 0 20px #00e5ff, 0 0 40px #00e5ff',
    letterSpacing: '2px',
    textTransform: 'uppercase'
  }}>
    Wellcome To Haircut
  </h2>
</div>


      {newsItems.length === 0 ? (
        <div className="card"> {/* Nếu không có tin, hiển thị trong card */}
          <p>Hiện chưa có tin tức nào.</p>
        </div>
      ) : (
        // **Danh sách tin tức sẽ nằm trên nền xám của body**
        <div className="news-list">
          {newsItems.map(item => (
            <article key={item.id} className="news-item">
              
              {/* **Sử dụng item.badge của bạn với class .news-badge từ CSS** */}
              {item.badge && (
                <span className="news-badge">{item.badge}</span>
              )}
              
              <h3 className="news-title">{item.title}</h3>
              <p className="news-meta">
                Ngày đăng: {new Date(item.date).toLocaleDateString('vi-VN')}
              </p>
              <p className="news-content">{item.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}