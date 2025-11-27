<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/config/env.php';

use App\Config\DB;

$pdo = DB::pdo();

// Check current ENUM values for payments.method
$st = $pdo->query("SHOW COLUMNS FROM payments WHERE Field = 'method'");
$row = $st->fetch(PDO::FETCH_ASSOC);

echo "Current ENUM values for payments.method:\n";
echo $row['Type'] . "\n\n";

// Check if bank_transfer is in the ENUM
if (strpos($row['Type'], 'bank_transfer') !== false) {
    echo "✓ 'bank_transfer' is already in the ENUM\n";
} else {
    echo "✗ 'bank_transfer' is NOT in the ENUM\n";
    echo "\nTo fix this, run the following SQL:\n";
    echo "ALTER TABLE payments MODIFY method ENUM('cash','bank_transfer','vn_pay','momo') NOT NULL;\n";
}

