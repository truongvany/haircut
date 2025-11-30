<?php
require_once __DIR__ . '/../app/config/db.php';

use App\Config\DB;

$pdo = DB::pdo();

// Create news table
$sql = "
CREATE TABLE IF NOT EXISTS news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  badge VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

$pdo->exec($sql);

// Check if there's any data
$st = $pdo->prepare("SELECT COUNT(*) as cnt FROM news");
$st->execute();
$result = $st->fetch(\PDO::FETCH_ASSOC);

if ($result['cnt'] == 0) {
  // Add sample news
  $insertSql = "INSERT INTO news (title, content, badge) VALUES 
  ('Khai trương chi nhánh mới tại Quận 3!', 'Chúng tôi vui mừng thông báo khai trương chi nhánh mới với nhiều ưu đãi hấp dẫn, giảm giá 30% cho 100 khách hàng đầu tiên...', '🔥 HOT'),
  ('Xu hướng tóc Thu-Đông 2025', 'Cập nhật những kiểu tóc và màu nhuộm hot nhất mùa này. Các tông màu nâu trà, khói xám đang quay trở lại mạnh mẽ...', '✨ NEW'),
  ('Chương trình khuyến mãi đặc biệt tháng 11', 'Giảm giá 20% cho tất cả các dịch vụ uốn/nhuộm khi đặt lịch trực tuyến qua website của chúng tôi...', '💰 SALE')";
  $pdo->exec($insertSql);
  echo "News table created with sample data!\n";
} else {
  echo "News table already exists with data!\n";
}
