<?php
/**
 * Script to fix active status for services and stylists
 * This ensures all services and stylists have active = 1 by default
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/config/env.php';

use App\Config\DB;

try {
    $pdo = DB::pdo();
    
    echo "=== Checking and Fixing Active Status ===\n\n";
    
    // Check services
    echo "1. Checking SERVICES table...\n";
    $servicesCheck = $pdo->query("SELECT COUNT(*) as total, 
                                   SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive,
                                   SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active
                                   FROM services");
    $servicesStats = $servicesCheck->fetch(PDO::FETCH_ASSOC);
    echo "   Total services: {$servicesStats['total']}\n";
    echo "   Active (1): {$servicesStats['active']}\n";
    echo "   Inactive (0): {$servicesStats['inactive']}\n";
    
    if ($servicesStats['inactive'] > 0) {
        echo "   → Fixing inactive services...\n";
        $fixServices = $pdo->exec("UPDATE services SET active = 1 WHERE active = 0");
        echo "   ✓ Updated {$fixServices} services to active = 1\n";
    } else {
        echo "   ✓ All services are already active\n";
    }
    
    echo "\n2. Checking STYLISTS table...\n";
    $stylistsCheck = $pdo->query("SELECT COUNT(*) as total, 
                                   SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive,
                                   SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active
                                   FROM stylists");
    $stylistsStats = $stylistsCheck->fetch(PDO::FETCH_ASSOC);
    echo "   Total stylists: {$stylistsStats['total']}\n";
    echo "   Active (1): {$stylistsStats['active']}\n";
    echo "   Inactive (0): {$stylistsStats['inactive']}\n";
    
    if ($stylistsStats['inactive'] > 0) {
        echo "   → Fixing inactive stylists...\n";
        $fixStylists = $pdo->exec("UPDATE stylists SET active = 1 WHERE active = 0");
        echo "   ✓ Updated {$fixStylists} stylists to active = 1\n";
    } else {
        echo "   ✓ All stylists are already active\n";
    }
    
    echo "\n3. Listing all services by salon:\n";
    $allServices = $pdo->query("SELECT s.id, s.name, s.active, sal.name as salon_name 
                                FROM services s 
                                JOIN salons sal ON s.salon_id = sal.id 
                                ORDER BY sal.name, s.name");
    while ($svc = $allServices->fetch(PDO::FETCH_ASSOC)) {
        $status = $svc['active'] == 1 ? '✓ Active' : '✗ Inactive';
        echo "   [{$status}] {$svc['salon_name']} - {$svc['name']} (ID: {$svc['id']})\n";
    }
    
    echo "\n4. Listing all stylists by salon:\n";
    $allStylists = $pdo->query("SELECT st.id, st.full_name, st.active, sal.name as salon_name 
                                FROM stylists st 
                                JOIN salons sal ON st.salon_id = sal.id 
                                ORDER BY sal.name, st.full_name");
    while ($sty = $allStylists->fetch(PDO::FETCH_ASSOC)) {
        $status = $sty['active'] == 1 ? '✓ Active' : '✗ Inactive';
        echo "   [{$status}] {$sty['salon_name']} - {$sty['full_name']} (ID: {$sty['id']})\n";
    }
    
    echo "\n=== Done! ===\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

