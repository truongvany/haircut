<?php
/**
 * List all salon owners and their salons
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/config/env.php';

use App\Config\DB;

try {
    $pdo = DB::pdo();
    
    echo "=== Salon Owners ===\n\n";
    
    $st = $pdo->query('SELECT u.id, u.email, u.full_name, u.role_id, s.id as salon_id, s.name as salon_name 
                       FROM users u 
                       LEFT JOIN salons s ON u.id = s.owner_user_id 
                       WHERE u.role_id = 2 
                       ORDER BY u.id');
    
    while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
        $salonInfo = $r['salon_name'] ? "{$r['salon_name']} (ID: {$r['salon_id']})" : "No salon";
        echo "Email: {$r['email']}\n";
        echo "Name: {$r['full_name']}\n";
        echo "User ID: {$r['id']}\n";
        echo "Salon: {$salonInfo}\n";
        echo "---\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

