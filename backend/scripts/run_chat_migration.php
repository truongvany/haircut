<?php
/**
 * Run Chat System Database Migration
 * This script creates the chat tables
 */

require __DIR__ . '/../app/config/db.php';

use App\Config\DB;

echo "╔═══════════════════════════════════════╗\n";
echo "║   CHAT SYSTEM DATABASE MIGRATION      ║\n";
echo "╚═══════════════════════════════════════╝\n\n";

try {
    $pdo = DB::pdo();
    
    // Read the SQL file
    $sqlFile = __DIR__ . '/../migrations/create_chat_tables.sql';
    
    if (!file_exists($sqlFile)) {
        echo "❌ Migration file not found: $sqlFile\n";
        exit(1);
    }
    
    echo "📖 Reading migration file...\n";
    $sql = file_get_contents($sqlFile);

    // Remove comments
    $sql = preg_replace('/^--.*$/m', '', $sql);

    // Split by semicolons, but be smarter about it
    // We need to handle multi-line statements properly
    $rawStatements = explode(';', $sql);
    $statements = [];

    foreach ($rawStatements as $stmt) {
        $stmt = trim($stmt);
        if (!empty($stmt) && strlen($stmt) > 5) {
            $statements[] = $stmt;
        }
    }

    echo "📊 Found " . count($statements) . " SQL statements\n\n";
    
    // Separate CREATE TABLE and CREATE INDEX statements
    $createTableStmts = [];
    $createIndexStmts = [];
    $otherStmts = [];

    foreach ($statements as $statement) {
        if (empty(trim($statement))) continue;

        if (preg_match('/CREATE TABLE/i', $statement)) {
            $createTableStmts[] = $statement;
        } else if (preg_match('/CREATE INDEX/i', $statement)) {
            $createIndexStmts[] = $statement;
        } else {
            $otherStmts[] = $statement;
        }
    }

    // Execute in order: tables first, then indexes, then other statements
    $pdo->beginTransaction();

    // 1. Create tables
    echo "📊 Creating tables...\n";
    foreach ($createTableStmts as $statement) {
        if (preg_match('/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i', $statement, $matches)) {
            $tableName = $matches[1];
            echo "  → $tableName... ";

            try {
                $pdo->exec($statement);
                echo "✅\n";
            } catch (\PDOException $e) {
                if (strpos($e->getMessage(), 'already exists') !== false) {
                    echo "⚠️  (already exists)\n";
                } else {
                    throw $e;
                }
            }
        }
    }

    // 2. Create indexes
    if (!empty($createIndexStmts)) {
        echo "\n📑 Creating indexes...\n";
        foreach ($createIndexStmts as $statement) {
            if (preg_match('/CREATE INDEX\s+`?(\w+)`?\s+ON\s+`?(\w+)`?/i', $statement, $matches)) {
                $indexName = $matches[1];
                $tableName = $matches[2];
                echo "  → $indexName on $tableName... ";

                try {
                    $pdo->exec($statement);
                    echo "✅\n";
                } catch (\PDOException $e) {
                    if (strpos($e->getMessage(), 'Duplicate key') !== false ||
                        strpos($e->getMessage(), 'already exists') !== false) {
                        echo "⚠️  (already exists)\n";
                    } else {
                        throw $e;
                    }
                }
            }
        }
    }

    // Commit the transaction
    if ($pdo->inTransaction()) {
        $pdo->commit();
    }

    // 3. Execute other statements (like SELECT verification) outside transaction
    foreach ($otherStmts as $statement) {
        try {
            $pdo->exec($statement);
        } catch (\PDOException $e) {
            // Silently ignore SELECT and other non-critical statements
        }
    }
    
    echo "\n╔═══════════════════════════════════════╗\n";
    echo "║   ✅ MIGRATION COMPLETED!             ║\n";
    echo "╚═══════════════════════════════════════╝\n\n";
    
    // Verify tables
    echo "🔍 Verifying tables...\n\n";
    
    $tables = ['conversations', 'messages', 'message_reads'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            $cols = $pdo->query("SHOW COLUMNS FROM $table")->fetchAll();
            echo "✅ $table (" . count($cols) . " columns)\n";
        } else {
            echo "❌ $table (NOT FOUND)\n";
        }
    }
    
    echo "\n🎉 Chat system database is ready!\n";
    echo "📝 Run: php setup_chat.php to verify complete installation\n\n";
    
} catch (\Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "📍 File: " . $e->getFile() . "\n";
    echo "📍 Line: " . $e->getLine() . "\n\n";
    exit(1);
}

