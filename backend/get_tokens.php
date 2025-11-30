<?php
require 'app/config/env.php';
require 'vendor/autoload.php';

use App\Config\DB;
use Firebase\JWT\JWT;

// Get admin user
$pdo = DB::pdo();
$st = $pdo->prepare('SELECT u.id, u.email, u.role_id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email=?');
$st->execute(['admin@haircut.test']);
$user = $st->fetch();

if ($user) {
    // Create JWT token
    $payload = [
        'uid' => (int)$user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'name' => $user['email'],
        'avatar' => null
    ];
    
    $key = $_ENV['APP_KEY'] ?? 'secret';
    $token = JWT::encode($payload, $key, 'HS256');
    
    echo "ADMIN TOKEN: " . $token . PHP_EOL;
    
    // Also get a customer for comparison
    $st2 = $pdo->prepare('SELECT u.id, u.email, u.role_id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name=?');
    $st2->execute(['customer']);
    $customer = $st2->fetch();
    
    if ($customer) {
        $payload2 = [
            'uid' => (int)$customer['id'],
            'email' => $customer['email'],
            'role' => $customer['role'],
            'name' => $customer['email'],
            'avatar' => null
        ];
        $token2 = JWT::encode($payload2, $key, 'HS256');
        echo "CUSTOMER TOKEN: " . $token2 . PHP_EOL;
    }
}
