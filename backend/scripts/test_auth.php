<?php
require __DIR__ . '/../app/config/db.php';
require __DIR__ . '/../app/core/Auth.php';

use App\Core\Auth;

// Test Auth
echo "=== AUTH TEST ===\n";
$user = Auth::user();
echo "Auth::user() returned: " . json_encode($user) . "\n";

if (!$user || !isset($user['uid'])) {
  echo "❌ Auth failed - user is null or no uid\n";
  echo "  Authorization header: " . ($_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET') . "\n";
  exit(1);
}

echo "✅ Auth successful - UID: " . $user['uid'] . "\n";
?>
