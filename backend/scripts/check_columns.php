<?php
require_once 'vendor/autoload.php';
require_once 'app/config/env.php';
require_once 'app/config/db.php';

use App\Config\DB;

$pdo = DB::pdo();

echo "=== Salons Columns ===\n";
$result = $pdo->query('DESCRIBE salons');
$columns = $result->fetchAll(PDO::FETCH_ASSOC);
foreach($columns as $col) {
    echo $col['Field'] . " (" . $col['Type'] . ")\n";
}

echo "\n=== Users Columns ===\n";
$result = $pdo->query('DESCRIBE users');
$columns = $result->fetchAll(PDO::FETCH_ASSOC);
foreach($columns as $col) {
    echo $col['Field'] . " (" . $col['Type'] . ")\n";
}
?>
