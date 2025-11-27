<?php
// Direct test of the mine() method logic
require __DIR__ . '/../app/config/db.php';

use App\Config\DB;

// Manually test with user ID 2
$customerId = 2;
$pdo = DB::pdo();

echo "=== DIRECT DATABASE QUERY TEST ===\n";
$sql = "SELECT
            b.id,
            b.salon_id,
            s.name AS salon_name,
            b.customer_id,
            u.full_name AS customer_name,
            b.stylist_id,
            st.full_name AS stylist_name,
            b.appointment_at,
            b.total_minutes,
            b.status,
            b.total_amt
    FROM bookings b
    LEFT JOIN users u ON b.customer_id = u.id
    LEFT JOIN stylists st ON b.stylist_id = st.id
    LEFT JOIN salons s ON b.salon_id = s.id
    WHERE b.customer_id = ?
    ORDER BY b.appointment_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute([$customerId]);
$items = $stmt->fetchAll(\PDO::FETCH_ASSOC);

echo "Raw DB results:\n";
echo json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

// Now apply the mapping from BookingController
$items = array_map(function($it){
  return [
    'id' => (int)$it['id'],
    'salonId' => (int)$it['salon_id'],
    'salonName' => $it['salon_name'] ?? 'Salon',
    'customerId' => (int)$it['customer_id'],
    'customerName' => $it['customer_name'] ?? 'Khách',
    'stylistId' => $it['stylist_id'] ? (int)$it['stylist_id'] : null,
    'stylistName' => $it['stylist_name'] ?? null,
    'appointmentAt' => $it['appointment_at'] ?? '',
    'totalMinutes' => (int)($it['total_minutes'] ?? 0),
    'status' => $it['status'] ?? 'pending',
    'totalAmt' => (int)($it['total_amt'] ?? 0)
  ];
}, $items);

echo "Mapped results (what API should return):\n";
echo json_encode(['items' => $items], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
?>
