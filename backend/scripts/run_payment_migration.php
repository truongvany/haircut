<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/config/env.php';

use App\Config\DB;

$pdo = DB::pdo();

echo "Running migration: Add bank_transfer to payments.method ENUM\n";
echo "=============================================================\n\n";

try {
    // Run the migration
    $sql = "ALTER TABLE payments MODIFY method ENUM('cash','bank_transfer','vn_pay','momo') NOT NULL";
    $pdo->exec($sql);
    
    echo "✓ Migration completed successfully!\n\n";
    
    // Verify the change
    $st = $pdo->query("SHOW COLUMNS FROM payments WHERE Field = 'method'");
    $row = $st->fetch(PDO::FETCH_ASSOC);
    
    echo "New ENUM values: " . $row['Type'] . "\n";
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

