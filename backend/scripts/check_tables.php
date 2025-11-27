<?php
require __DIR__ . '/../app/config/db.php';

use App\Config\DB;

$pdo = DB::pdo();

echo "=== Users Table Structure ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM users')->fetchAll(\PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo $c['Field'] . ' (' . $c['Type'] . ') Key: ' . ($c['Key'] ?: 'NONE') . "\n";
}

echo "\n=== Salons Table Structure ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM salons')->fetchAll(\PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo $c['Field'] . ' (' . $c['Type'] . ') Key: ' . ($c['Key'] ?: 'NONE') . "\n";
}

echo "\n=== Try creating conversations table without FK ===\n";
$sql = "CREATE TABLE IF NOT EXISTS conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    salon_id INT NOT NULL,
    subject VARCHAR(255),
    status ENUM('active', 'closed', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL
)";

try {
    $pdo->exec($sql);
    echo "✓ Conversations table created\n";
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
?>
