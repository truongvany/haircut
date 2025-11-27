<?php
/**
 * Script tạo tài khoản Admin
 * Chạy: php backend/create_admin.php
 */

require_once __DIR__ . '/app/config/DB.php';

use App\Config\DB;

// Thông tin admin mới
$email = 'AtomicY@haircut.test';
$password = 'admin123';  // Mật khẩu mặc định, nên đổi sau khi đăng nhập
$fullName = 'Trương Văn Ý';
$phone = '0889948002';

// Hash mật khẩu
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

try {
    $pdo = DB::pdo();
    
    // Kiểm tra xem admin đã tồn tại chưa
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute([$email]);
    
    if ($check->fetch()) {
        echo "❌ Email '$email' đã tồn tại!\n";
        echo "Bạn có muốn reset mật khẩu không? (y/n): ";
        $answer = trim(fgets(STDIN));
        
        if (strtolower($answer) === 'y') {
            $update = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
            $update->execute([$passwordHash, $email]);
            echo "✅ Đã reset mật khẩu cho '$email'\n";
            echo "📧 Email: $email\n";
            echo "🔑 Password: $password\n";
        } else {
            echo "Hủy bỏ.\n";
        }
        exit;
    }
    
    // Tạo admin mới
    $sql = "INSERT INTO users (role_id, full_name, email, phone, password_hash, created_at) 
            VALUES (1, ?, ?, ?, ?, NOW())";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$fullName, $email, $phone, $passwordHash]);
    
    echo "✅ Tạo tài khoản Admin thành công!\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "📧 Email: $email\n";
    echo "🔑 Password: $password\n";
    echo "👤 Tên: $fullName\n";
    echo "📱 Phone: $phone\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "⚠️  Hãy đổi mật khẩu sau khi đăng nhập!\n";
    
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}

