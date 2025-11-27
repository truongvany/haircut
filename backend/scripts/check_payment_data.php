<?php
require __DIR__ . '/../app/config/db.php';

$pdo = \App\Config\DB::pdo();

// Check bookings structure
echo "=== BOOKINGS COLUMNS ===\n";
$result = $pdo->query('DESCRIBE bookings')->fetchAll(\PDO::FETCH_ASSOC);
foreach($result as $col) {
  echo $col['Field'] . "\n";
}

// Check a sample payment with salon join
echo "\n=== SAMPLE PAYMENT DATA ===\n";
$result = $pdo->query("
  SELECT p.id, p.booking_id, p.method, p.status, p.amount,
         b.customer_id, b.salon_id,
         s.id as salon_id, s.name as salon_name
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  LEFT JOIN salons s ON b.salon_id = s.id
  LIMIT 1
")->fetchAll(\PDO::FETCH_ASSOC);

if ($result) {
  echo "Found " . count($result) . " records\n";
  echo json_encode($result[0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} else {
  echo "No payments found\n";
}
?>
