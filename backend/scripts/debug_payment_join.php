<?php
require __DIR__ . '/../app/config/db.php';

use App\Config\DB;

$pdo = DB::pdo();

// Check structure of tables
echo "=== BOOKINGS TABLE ===\n";
$columns = $pdo->query('DESCRIBE bookings')->fetchAll(\PDO::FETCH_ASSOC);
echo "Columns: " . implode(', ', array_column($columns, 'Field')) . "\n\n";

echo "=== SALONS TABLE ===\n";
$columns = $pdo->query('DESCRIBE salons')->fetchAll(\PDO::FETCH_ASSOC);
echo "Columns: " . implode(', ', array_column($columns, 'Field')) . "\n\n";

echo "=== PAYMENTS TABLE ===\n";
$columns = $pdo->query('DESCRIBE payments')->fetchAll(\PDO::FETCH_ASSOC);
echo "Columns: " . implode(', ', array_column($columns, 'Field')) . "\n\n";

// Check if the join query works
echo "=== TEST JOIN QUERY ===\n";
$query = "
  SELECT p.id, p.booking_id, p.method, p.status, p.amount, p.created_at, p.updated_at,
         b.customer_id, b.salon_id, s.name as salon_name
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  JOIN salons s ON b.salon_id = s.id
  LIMIT 5
";

try {
  $result = $pdo->query($query)->fetchAll(\PDO::FETCH_ASSOC);
  echo "Query succeeded. Found " . count($result) . " records\n";
  if ($result) {
    echo json_encode($result[0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
  }
} catch (\Exception $e) {
  echo "Query failed: " . $e->getMessage() . "\n";
}
?>
