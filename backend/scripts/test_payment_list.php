<?php
// Test script to verify payment list endpoint
require __DIR__ . '/../app/config/db.php';

use App\Config\DB;

$pdo = DB::pdo();

// Get user 2's payments (the one with test data)
$userId = 2;

$query = "
  SELECT p.id, p.booking_id, p.method, p.status, p.amount, p.created_at, p.updated_at,
         b.customer_id, s.name as salon_name
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  JOIN salons s ON b.salon_id = s.id
  WHERE b.customer_id = ?
  ORDER BY p.created_at DESC LIMIT 100
";

$st = $pdo->prepare($query);
$st->execute([$userId]);
$payments = $st->fetchAll(\PDO::FETCH_ASSOC);

$items = array_map(function($p) {
  return [
    'payment_id' => (int)$p['id'],
    'booking_id' => (int)$p['booking_id'],
    'method' => $p['method'],
    'status' => $p['status'],
    'amount' => (int)$p['amount'],
    'salon_name' => $p['salon_name'],
    'created_at' => $p['created_at'],
    'updated_at' => $p['updated_at']
  ];
}, $payments);

echo json_encode(['items' => $items, 'count' => count($items)], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "\n";
?>
