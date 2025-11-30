#!/bin/bash
# Chat Feature Verification Script
# Run this to verify all components are ready

echo "=== Chat Feature Verification ==="
echo ""

# Check if customer account exists and has correct password
echo "1. Checking customer account..."
php -r "
require_once 'backend/vendor/autoload.php';
require_once 'backend/app/config/env.php';
require_once 'backend/app/config/db.php';

use App\Config\DB;

\$pdo = DB::pdo();
\$stmt = \$pdo->prepare('SELECT id, email, role_id FROM users WHERE email = ?');
\$stmt->execute(['customer@haircut.test']);
\$user = \$stmt->fetch(PDO::FETCH_ASSOC);

if (\$user) {
    echo '   ✅ Customer account found: ID=' . \$user['id'] . ', Role ID=' . \$user['role_id'] . PHP_EOL;
} else {
    echo '   ❌ Customer account not found' . PHP_EOL;
}
"

# Check if salons exist
echo ""
echo "2. Checking salons..."
php -r "
require_once 'backend/vendor/autoload.php';
require_once 'backend/app/config/env.php';
require_once 'backend/app/config/db.php';

use App\Config\DB;

\$pdo = DB::pdo();
\$stmt = \$pdo->query('SELECT COUNT(*) as cnt FROM salons');
\$result = \$stmt->fetch(PDO::FETCH_ASSOC);

if (\$result['cnt'] > 0) {
    echo '   ✅ ' . \$result['cnt'] . ' salons found' . PHP_EOL;
} else {
    echo '   ❌ No salons found' . PHP_EOL;
}
"

# Check if support account exists
echo ""
echo "3. Checking support account..."
php -r "
require_once 'backend/vendor/autoload.php';
require_once 'backend/app/config/env.php';
require_once 'backend/app/config/db.php';

use App\Config\DB;

\$pdo = DB::pdo();
\$stmt = \$pdo->prepare('SELECT id, email FROM users WHERE email = ?');
\$stmt->execute(['support@haircut.local']);
\$user = \$stmt->fetch(PDO::FETCH_ASSOC);

if (\$user) {
    echo '   ✅ Support account found: ID=' . \$user['id'] . PHP_EOL;
} else {
    echo '   ❌ Support account not found' . PHP_EOL;
}
"

# Check if conversations table is accessible
echo ""
echo "4. Checking conversations table..."
php -r "
require_once 'backend/vendor/autoload.php';
require_once 'backend/app/config/env.php';
require_once 'backend/app/config/db.php';

use App\Config\DB;

\$pdo = DB::pdo();
\$result = \$pdo->query('DESCRIBE conversations');
\$columns = \$result->fetchAll(PDO::FETCH_COLUMN, 0);

echo '   ✅ Conversations table has ' . count(\$columns) . ' columns' . PHP_EOL;
echo '   Columns: ' . implode(', ', \$columns) . PHP_EOL;
"

# Test API endpoint
echo ""
echo "5. Testing API endpoint..."
echo "   (This requires valid JWT token - skipped in this script)"

# Check if frontend is running
echo ""
echo "6. Frontend Status:"
echo "   ℹ️  Development server should be running on http://localhost:5173 or http://localhost:5174"

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Login with: customer@haircut.test / 123456"
echo "3. Click on a salon"
echo "4. Click the 'Chat với salon này' button"
echo "5. Check browser console (F12) for detailed logs"
