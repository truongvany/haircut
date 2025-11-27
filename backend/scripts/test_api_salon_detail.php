<?php
/**
 * Test API endpoint /api/v1/salons/{id}
 * Simulates what the frontend receives
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/config/env.php';

use App\Config\DB;

$salonId = $argv[1] ?? 23;

try {
    $pdo = DB::pdo();
    
    echo "=== Testing API: GET /api/v1/salons/{$salonId} ===\n\n";
    
    // Fetch salon info (same as SalonController::show)
    $st = $pdo->prepare("SELECT * FROM salons WHERE id=?");
    $st->execute([$salonId]);
    $s = $st->fetch(PDO::FETCH_ASSOC);
    
    if (!$s) {
        echo "ERROR: Salon not found with ID: {$salonId}\n";
        exit(1);
    }
    
    echo "SALON DATA:\n";
    echo json_encode($s, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    
    // Fetch services (same query as SalonController::show line 33)
    $svc = $pdo->prepare('SELECT id, name, duration_min AS durationMin, base_price AS price, active FROM services WHERE salon_id = ? AND active = 1 ORDER BY name');
    $svc->execute([$salonId]);
    $services = $svc->fetchAll(PDO::FETCH_ASSOC);
    
    echo "SERVICES DATA (active = 1 only):\n";
    echo json_encode($services, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    
    // Fetch stylists (same query as SalonController::show line 38)
    $sty = $pdo->prepare('SELECT id, full_name AS fullName, bio, rating_avg AS ratingAvg, rating_count AS ratingCount, active FROM stylists WHERE salon_id = ? AND active = 1 ORDER BY full_name');
    $sty->execute([$salonId]);
    $stylists = $sty->fetchAll(PDO::FETCH_ASSOC);
    
    echo "STYLISTS DATA (active = 1 only):\n";
    echo json_encode($stylists, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    
    // Fetch reviews
    $revSql = "SELECT r.id, r.booking_id, r.salon_id, r.stylist_id, r.customer_id, r.rating, r.comment, r.created_at, u.full_name AS customerName, st.full_name AS stylistName
               FROM reviews r
               LEFT JOIN users u ON r.customer_id = u.id
               LEFT JOIN stylists st ON r.stylist_id = st.id
               WHERE r.salon_id = ? AND r.visible = 1
               ORDER BY r.created_at DESC
               LIMIT 50";
    $rev = $pdo->prepare($revSql);
    $rev->execute([$salonId]);
    $reviews = $rev->fetchAll(PDO::FETCH_ASSOC);
    
    foreach($reviews as &$rr) {
        $rr['rating'] = isset($rr['rating']) ? (int)$rr['rating'] : 0;
    }
    
    echo "REVIEWS DATA:\n";
    echo json_encode($reviews, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
    
    // Full API response
    $apiResponse = [
        'salon' => $s,
        'services' => $services,
        'stylists' => $stylists,
        'reviews' => $reviews
    ];
    
    echo "=== FULL API RESPONSE ===\n";
    echo json_encode($apiResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

