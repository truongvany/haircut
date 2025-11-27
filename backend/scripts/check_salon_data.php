<?php
/**
 * Script to check salon data (services and stylists)
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/config/env.php';

use App\Config\DB;

$salonName = $argv[1] ?? 'Atomic';

try {
    $pdo = DB::pdo();
    
    // Tìm salon
    $st = $pdo->prepare('SELECT id, name, owner_user_id FROM salons WHERE name LIKE ?');
    $st->execute(["%{$salonName}%"]);
    $salon = $st->fetch(PDO::FETCH_ASSOC);
    
    if (!$salon) {
        echo "Salon not found with name containing: {$salonName}\n";
        echo "\nAvailable salons:\n";
        $all = $pdo->query('SELECT id, name FROM salons ORDER BY name');
        while ($s = $all->fetch(PDO::FETCH_ASSOC)) {
            echo "  - {$s['name']} (ID: {$s['id']})\n";
        }
        exit(1);
    }
    
    echo "=== Salon: {$salon['name']} (ID: {$salon['id']}) ===\n";
    echo "Owner User ID: {$salon['owner_user_id']}\n\n";
    
    // Lấy ALL services (không filter active)
    echo "ALL SERVICES (including inactive):\n";
    $svcAll = $pdo->prepare('SELECT id, name, duration_min, base_price, active FROM services WHERE salon_id = ? ORDER BY name');
    $svcAll->execute([$salon['id']]);
    $allServices = $svcAll->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($allServices)) {
        echo "  (No services found)\n";
    } else {
        foreach ($allServices as $s) {
            $activeStatus = $s['active'] == 1 ? '✓ Active' : '✗ Inactive';
            echo "  [{$activeStatus}] {$s['name']} (ID: {$s['id']}, Price: {$s['base_price']}, Duration: {$s['duration_min']} min)\n";
        }
    }
    
    echo "\nACTIVE SERVICES ONLY (active = 1):\n";
    $svcActive = $pdo->prepare('SELECT id, name, duration_min, base_price, active FROM services WHERE salon_id = ? AND active = 1 ORDER BY name');
    $svcActive->execute([$salon['id']]);
    $activeServices = $svcActive->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($activeServices)) {
        echo "  (No active services found)\n";
    } else {
        foreach ($activeServices as $s) {
            echo "  ✓ {$s['name']} (ID: {$s['id']}, Price: {$s['base_price']}, Duration: {$s['duration_min']} min)\n";
        }
    }
    
    // Lấy ALL stylists
    echo "\nALL STYLISTS (including inactive):\n";
    $styAll = $pdo->prepare('SELECT id, full_name, active FROM stylists WHERE salon_id = ? ORDER BY full_name');
    $styAll->execute([$salon['id']]);
    $allStylists = $styAll->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($allStylists)) {
        echo "  (No stylists found)\n";
    } else {
        foreach ($allStylists as $st) {
            $activeStatus = $st['active'] == 1 ? '✓ Active' : '✗ Inactive';
            echo "  [{$activeStatus}] {$st['full_name']} (ID: {$st['id']})\n";
        }
    }
    
    echo "\nACTIVE STYLISTS ONLY (active = 1):\n";
    $styActive = $pdo->prepare('SELECT id, full_name, active FROM stylists WHERE salon_id = ? AND active = 1 ORDER BY full_name');
    $styActive->execute([$salon['id']]);
    $activeStylists = $styActive->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($activeStylists)) {
        echo "  (No active stylists found)\n";
    } else {
        foreach ($activeStylists as $st) {
            echo "  ✓ {$st['full_name']} (ID: {$st['id']})\n";
        }
    }
    
    echo "\n=== Summary ===\n";
    echo "Total services: " . count($allServices) . " (Active: " . count($activeServices) . ")\n";
    echo "Total stylists: " . count($allStylists) . " (Active: " . count($activeStylists) . ")\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

