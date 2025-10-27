<?php
require __DIR__ . '/../app/config/env.php';
require __DIR__ . '/../app/config/db.php';

use App\Config\DB;

$pdo = DB::pdo();
$sid = 2;
$date = '2025-10-25';
$st = $pdo->prepare("SELECT id, customer_id, stylist_id, appointment_at, total_minutes, status, total_amt FROM bookings WHERE salon_id=? AND DATE(appointment_at)=? ORDER BY appointment_at");
$st->execute([$sid,$date]);
$rows = $st->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['count'=>count($rows),'rows'=>$rows], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
