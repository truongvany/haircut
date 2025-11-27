<?php
require __DIR__ . '/../app/config/db.php';

use App\Config\DB;

$pdo = DB::pdo();

// Check bookings with salon_id
echo "=== BOOKINGS WITH SALON DATA ===\n";
$result = $pdo->query("
  SELECT b.id, b.customer_id, b.salon_id, s.name as salon_name,
         b.appointment_at, b.status
  FROM bookings b
  LEFT JOIN salons s ON b.salon_id = s.id
  LIMIT 10
")->fetchAll(\PDO::FETCH_ASSOC);

if ($result) {
  echo "Found " . count($result) . " bookings:\n";
  foreach ($result as $row) {
    echo "  ID: {$row['id']}, Salon ID: {$row['salon_id']}, Salon Name: {$row['salon_name']}, Status: {$row['status']}\n";
  }
} else {
  echo "No bookings found\n";
}

// Check salons
echo "\n=== SALONS ===\n";
$salons = $pdo->query("SELECT id, name FROM salons LIMIT 10")->fetchAll(\PDO::FETCH_ASSOC);
echo "Found " . count($salons) . " salons\n";
foreach ($salons as $s) {
  echo "  ID: {$s['id']}, Name: {$s['name']}\n";
}
?>
