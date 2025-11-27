<?php
// Test the payment list endpoint
header('Content-Type: application/json');

require __DIR__ . '/../app/config/db.php';
require __DIR__ . '/../app/core/Auth.php';

use App\Config\DB;
use App\Core\Auth;

// Simulate user 2 authentication
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . json_encode(['uid' => 2, 'role' => 'customer']);

// Mock Auth::user() by directly checking
$me = ['uid' => 2, 'role' => 'customer'];

if (!$me || !isset($me['uid'])) {
  echo json_encode(['error' => 'Unauthorized']);
  exit(1);
}

$pdo = DB::pdo();
$bookingId = isset($_GET['booking_id']) ? (int)$_GET['booking_id'] : null;

$query = "
  SELECT p.id, p.booking_id, p.method, p.status, p.amount, p.created_at, p.updated_at,
         b.customer_id, s.name as salon_name
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  JOIN salons s ON b.salon_id = s.id
  WHERE b.customer_id = ?
";
$params = [(int)$me['uid']];

if ($bookingId) {
  $query .= " AND p.booking_id = ?";
  $params[] = $bookingId;
}

$query .= " ORDER BY p.created_at DESC LIMIT 100";

$st = $pdo->prepare($query);
$st->execute($params);
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

echo json_encode(['items' => $items], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
