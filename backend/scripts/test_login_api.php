<?php
/**
 * Test login API to verify salonId is returned
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/config/env.php';

use App\Config\DB;

// Simulate login request
$email = 'salon1@gmail.com'; // salon1 user
$password = '123456'; // Adjust if different

echo "=== Testing Login API ===\n";
echo "Email: {$email}\n\n";

try {
    $pdo = DB::pdo();
    
    // Get user
    $st = $pdo->prepare('SELECT id, role_id, full_name, email, password_hash FROM users WHERE email=?');
    $st->execute([$email]);
    $u = $st->fetch();
    
    if (!$u) {
        echo "ERROR: User not found\n";
        exit(1);
    }
    
    if (!password_verify($password, $u['password_hash'])) {
        echo "ERROR: Invalid password\n";
        exit(1);
    }
    
    echo "✓ User found: {$u['full_name']} (ID: {$u['id']})\n";
    
    $role = ((int)$u['role_id'] === 1)
        ? 'admin'
        : (((int)$u['role_id'] === 2) ? 'salon' : 'customer');
    
    echo "✓ Role: {$role}\n\n";
    
    // Get salon if role is salon
    $salonId = null;
    if ($role === 'salon') {
        $stSalon = $pdo->prepare('SELECT id, name FROM salons WHERE owner_user_id = ? LIMIT 1');
        $stSalon->execute([(int)$u['id']]);
        $salon = $stSalon->fetch();
        if ($salon) {
            $salonId = (int)$salon['id'];
            echo "✓ Salon found: {$salon['name']} (ID: {$salonId})\n";
        } else {
            echo "⚠ No salon found for this user\n";
        }
    }
    
    // Build user data
    $userData = [
        'id'    => (int)$u['id'],
        'name'  => $u['full_name'],
        'role'  => $role,
        'email' => $u['email'],
    ];
    
    if ($salonId !== null) {
        $userData['salonId'] = $salonId;
    }
    
    echo "\n=== API Response (user object) ===\n";
    echo json_encode($userData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

