<?php
/**
 * Reset password for a user
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/config/env.php';

use App\Config\DB;

$email = $argv[1] ?? 'salon1@gmail.com';
$newPassword = $argv[2] ?? '123456';

try {
    $pdo = DB::pdo();
    
    echo "=== Resetting Password ===\n";
    echo "Email: {$email}\n";
    echo "New Password: {$newPassword}\n\n";
    
    // Check if user exists
    $st = $pdo->prepare('SELECT id, full_name FROM users WHERE email = ?');
    $st->execute([$email]);
    $user = $st->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "ERROR: User not found\n";
        exit(1);
    }
    
    echo "User found: {$user['full_name']} (ID: {$user['id']})\n";
    
    // Hash new password
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    
    // Update password
    $update = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $update->execute([$hash, $user['id']]);
    
    echo "✓ Password updated successfully!\n";
    echo "\nYou can now login with:\n";
    echo "  Email: {$email}\n";
    echo "  Password: {$newPassword}\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

