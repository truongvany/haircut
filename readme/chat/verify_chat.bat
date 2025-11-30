@echo off
REM Chat Feature Verification Script for Windows

echo.
echo === Chat Feature Verification ===
echo.

echo 1. Checking customer account...
cd /d "%~dp0backend"
php -r "require_once 'vendor/autoload.php'; require_once 'app/config/env.php'; require_once 'app/config/db.php'; use App\Config\DB; $pdo = DB::pdo(); $stmt = $pdo->prepare('SELECT id, email, role_id FROM users WHERE email = ?'); $stmt->execute(['customer@haircut.test']); $user = $stmt->fetch(PDO::FETCH_ASSOC); if ($user) { echo '   OK Customer account found: ID=' . $user['id'] . ', Role ID=' . $user['role_id'] . PHP_EOL; } else { echo '   ERROR Customer account not found' . PHP_EOL; }"

echo.
echo 2. Checking salons...
php -r "require_once 'vendor/autoload.php'; require_once 'app/config/env.php'; require_once 'app/config/db.php'; use App\Config\DB; $pdo = DB::pdo(); $stmt = $pdo->query('SELECT COUNT(*) as cnt FROM salons'); $result = $stmt->fetch(PDO::FETCH_ASSOC); if ($result['cnt'] > 0) { echo '   OK ' . $result['cnt'] . ' salons found' . PHP_EOL; } else { echo '   ERROR No salons found' . PHP_EOL; }"

echo.
echo 3. Checking support account...
php -r "require_once 'vendor/autoload.php'; require_once 'app/config/env.php'; require_once 'app/config/db.php'; use App\Config\DB; $pdo = DB::pdo(); $stmt = $pdo->prepare('SELECT id, email FROM users WHERE email = ?'); $stmt->execute(['support@haircut.local']); $user = $stmt->fetch(PDO::FETCH_ASSOC); if ($user) { echo '   OK Support account found: ID=' . $user['id'] . PHP_EOL; } else { echo '   ERROR Support account not found' . PHP_EOL; }"

echo.
echo 4. Checking conversations table...
php -r "require_once 'vendor/autoload.php'; require_once 'app/config/env.php'; require_once 'app/config/db.php'; use App\Config\DB; $pdo = DB::pdo(); $result = $pdo->query('DESCRIBE conversations'); $columns = $result->fetchAll(PDO::FETCH_COLUMN, 0); echo '   OK Conversations table has ' . count($columns) . ' columns' . PHP_EOL; echo '   Columns: ' . implode(', ', $columns) . PHP_EOL;"

echo.
echo 5. Frontend Status:
echo.    Development server should be running on http://localhost:5173 or http://localhost:5174
echo.

echo === Verification Complete ===
echo.
echo Next steps:
echo 1. Open http://localhost:5173 in your browser
echo 2. Login with: customer@haircut.test / 123456
echo 3. Click on a salon
echo 4. Click the "Chat voi salon nay" button
echo 5. Check browser console (F12) for detailed logs
echo.

pause
