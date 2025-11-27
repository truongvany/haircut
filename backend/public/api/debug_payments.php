<?php
// This file helps debug what's being returned to frontend
// Visit: http://localhost/haircut/backend/public/api/v1/payments

require_once __DIR__ . '/../../app/config/db.php';
require_once __DIR__ . '/../../app/core/Auth.php';

use App\Config\DB;
use App\Core\Auth;

// Check Auth
$me = Auth::user();
echo "<!-- DEBUG: User: " . json_encode($me) . " -->\n";

if (!$me || !isset($me['uid'])) {
  http_response_code(401);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'Unauthorized']);
  exit(1);
}

header('Content-Type: application/json');
$pdo = DB::pdo();

$query = "
  SELECT p.id, p.booking_id, p.method, p.status, p.amount, p.created_at, p.updated_at,
         b.customer_id, s.name as salon_name
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  JOIN salons s ON b.salon_id = s.id
  WHERE b.customer_id = ?
  ORDER BY p.created_at DESC
  LIMIT 100
";

$st = $pdo->prepare($query);
$st->execute([(int)$me['uid']]);
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

echo json_encode(['items' => $items, 'debug' => 'API response with salon_name'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
