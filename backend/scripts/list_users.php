<?php
require_once 'vendor/autoload.php';
require_once 'app/config/env.php';
require_once 'app/config/db.php';

use App\Config\DB;

$pdo = DB::pdo();
$stmt = $pdo->query('SELECT u.id, u.email, u.role_id, r.name FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.id');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "ID | Email | Role ID | Role Name\n";
echo str_repeat("-", 80) . "\n";
foreach($rows as $row) {
    echo $row['id'] . ' | ' . $row['email'] . ' | ' . $row['role_id'] . ' | ' . $row['name'] . "\n";
}
?>
