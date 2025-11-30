<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth;

class ChatController extends Controller
{
    // POST /api/v1/chats/{salon_id}/start
    // Start or get existing conversation with a salon, or with support
    public function startConversation(array $params)
    {
        try {
            error_log("=== START CONVERSATION REQUEST ===");
            error_log("Params: " . json_encode($params));
            
            $me = Auth::user();
            error_log("Authenticated user: " . json_encode($me));
            
            if (!$me || !isset($me['uid'])) {
                error_log("Authentication failed");
                return $this->json(['error' => 'Unauthorized'], 401);
            }

            $salonId = (int)($params['salon_id'] ?? 0);
            error_log("Salon ID: $salonId");
            
            $pdo = DB::pdo();
            $userId = (int)$me['uid'];
            $userRole = $me['role'] ?? '';
            
            error_log("User ID: $userId, Role: $userRole");

            // Check if support_user_id column exists
            $result = $pdo->query("DESCRIBE conversations");
            $columns = $result->fetchAll(\PDO::FETCH_COLUMN, 0);
            $hasSupport = in_array('support_user_id', $columns);
            
            error_log("Support column exists: " . ($hasSupport ? 'yes' : 'no'));

            // Determine customer_id and target (salon or support)
            if ($userRole === 'customer') {
                $customerId = $userId;
                error_log("Customer ID: $customerId");
                
                if ($salonId > 0) {
                    error_log("Creating salon conversation");
                    // Chat with specific salon
                    $salonCheck = $pdo->prepare("SELECT id FROM salons WHERE id = ?");
                    $salonCheck->execute([$salonId]);
                    if (!$salonCheck->fetch()) {
                        error_log("Salon not found: $salonId");
                        return $this->json(['error' => 'Salon not found'], 404);
                    }
                    error_log("Salon verified");

                    // Check if conversation already exists
                    if ($hasSupport) {
                        $stmt = $pdo->prepare("
                            SELECT id, customer_id, salon_id, support_user_id, last_message_at, created_at 
                            FROM conversations 
                            WHERE customer_id = ? AND salon_id = ? AND support_user_id IS NULL
                        ");
                    } else {
                        $stmt = $pdo->prepare("
                            SELECT id, customer_id, salon_id, last_message_at, created_at 
                            FROM conversations 
                            WHERE customer_id = ? AND salon_id = ?
                        ");
                    }
                    $stmt->execute([$customerId, $salonId]);
                    $conversation = $stmt->fetch(\PDO::FETCH_ASSOC);

                    if ($conversation) {
                        error_log("Returning existing conversation: " . $conversation['id']);
                        return $this->json(['conversation' => $conversation]);
                    }

                    error_log("Inserting new conversation");
                    // Create new salon conversation
                    try {
                        if ($hasSupport) {
                            $insert = $pdo->prepare("
                                INSERT INTO conversations (customer_id, salon_id, support_user_id) 
                                VALUES (?, ?, NULL)
                            ");
                            $insert->execute([$customerId, $salonId]);
                        } else {
                            $insert = $pdo->prepare("
                                INSERT INTO conversations (customer_id, salon_id) 
                                VALUES (?, ?)
                            ");
                            $insert->execute([$customerId, $salonId]);
                        }
                        
                        $conversationId = (int)$pdo->lastInsertId();
                        error_log("New conversation created: $conversationId");

                        if ($hasSupport) {
                            $newConv = $pdo->prepare("SELECT id, customer_id, salon_id, support_user_id, last_message_at, created_at FROM conversations WHERE id = ?");
                        } else {
                            $newConv = $pdo->prepare("SELECT id, customer_id, salon_id, last_message_at, created_at FROM conversations WHERE id = ?");
                        }
                        $newConv->execute([$conversationId]);
                        $conversation = $newConv->fetch(\PDO::FETCH_ASSOC);

                        error_log("Returning new conversation: " . json_encode($conversation));
                        return $this->json(['conversation' => $conversation], 201);
                    } catch (\PDOException $e) {
                        error_log("Database error: " . $e->getMessage());
                        return $this->json(['error' => 'Failed to create conversation: ' . $e->getMessage()], 500);
                    }
                } else {
                    return $this->json(['error' => 'Support feature not available. Run setup_chat_complete.php'], 503);
                }
                
                // Get support user
                $supportStmt = $pdo->prepare("SELECT id FROM users WHERE role_id = 1 LIMIT 1");
                $supportStmt->execute();
                $support = $supportStmt->fetch(\PDO::FETCH_ASSOC);

                if (!$support) {
                    return $this->json(['error' => 'Support account not found'], 404);
                }

                $supportId = (int)$support['id'];

                // Check if conversation already exists
                $stmt = $pdo->prepare("
                    SELECT id, customer_id, salon_id, support_user_id, last_message_at, created_at 
                    FROM conversations 
                    WHERE customer_id = ? AND support_user_id = ?
                ");
                $stmt->execute([$customerId, $supportId]);
                $conversation = $stmt->fetch(\PDO::FETCH_ASSOC);

                if ($conversation) {
                    return $this->json(['conversation' => $conversation]);
                }

                // Create new support conversation
                try {
                    $insert = $pdo->prepare("
                        INSERT INTO conversations (customer_id, salon_id, support_user_id) 
                        VALUES (?, NULL, ?)
                    ");
                    $insert->execute([$customerId, $supportId]);
                    $conversationId = (int)$pdo->lastInsertId();

                    $newConv = $pdo->prepare("SELECT id, customer_id, salon_id, support_user_id, last_message_at, created_at FROM conversations WHERE id = ?");
                    $newConv->execute([$conversationId]);
                    $conversation = $newConv->fetch(\PDO::FETCH_ASSOC);

                    // Send initial support message
                    $supportMessage = "Xin chào! 👋 Tôi là Support Team của Haircut. Bạn cần hỗ trợ gì không?";
                    $insertMsg = $pdo->prepare("
                        INSERT INTO messages (conversation_id, sender_id, message_text)
                        VALUES (?, ?, ?)
                    ");
                    $insertMsg->execute([$conversationId, $supportId, $supportMessage]);

                    return $this->json(['conversation' => $conversation], 201);
                } catch (\PDOException $e) {
                    return $this->json(['error' => 'Failed to create support conversation: ' . $e->getMessage()], 500);
                }
        } elseif ($userRole === 'salon' || $userRole === 'admin') {
            // Salon owner accessing their own conversations
            // For now, we'll require a customer_id in the request body
            $body = $this->body();
            $customerId = (int)($body['customer_id'] ?? 0);
            if ($customerId <= 0) {
                return $this->json(['error' => 'Customer ID required for salon users'], 400);
            }

            if ($salonId <= 0) {
                return $this->json(['error' => 'Invalid salon ID'], 400);
            }

            // Check if conversation already exists
            if ($hasSupport) {
                $stmt = $pdo->prepare("
                    SELECT id, customer_id, salon_id, support_user_id, last_message_at, created_at 
                    FROM conversations 
                    WHERE customer_id = ? AND salon_id = ?
                ");
            } else {
                $stmt = $pdo->prepare("
                    SELECT id, customer_id, salon_id, last_message_at, created_at 
                    FROM conversations 
                    WHERE customer_id = ? AND salon_id = ?
                ");
            }
            $stmt->execute([$customerId, $salonId]);
            $conversation = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($conversation) {
                return $this->json(['conversation' => $conversation]);
            }

            // Create new conversation
            if ($hasSupport) {
                $insert = $pdo->prepare("
                    INSERT INTO conversations (customer_id, salon_id, support_user_id) 
                    VALUES (?, ?, NULL)
                ");
                $insert->execute([$customerId, $salonId]);
            } else {
                $insert = $pdo->prepare("
                    INSERT INTO conversations (customer_id, salon_id) 
                    VALUES (?, ?)
                ");
                $insert->execute([$customerId, $salonId]);
            }

            $conversationId = (int)$pdo->lastInsertId();

            if ($hasSupport) {
                $newConv = $pdo->prepare("SELECT id, customer_id, salon_id, support_user_id, last_message_at, created_at FROM conversations WHERE id = ?");
            } else {
                $newConv = $pdo->prepare("SELECT id, customer_id, salon_id, last_message_at, created_at FROM conversations WHERE id = ?");
            }
            $newConv->execute([$conversationId]);
            $conversation = $newConv->fetch(\PDO::FETCH_ASSOC);

            return $this->json(['conversation' => $conversation], 201);
        } else {
            return $this->json(['error' => 'Invalid user role'], 403);
        }
        } catch (\Exception $e) {
            return $this->json(['error' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    // GET /api/v1/chats/conversations
    // List all conversations for current user
    public function listConversations()
    {
        $me = Auth::user();
        if (!$me || !isset($me['uid'])) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $pdo = DB::pdo();
        $userId = (int)$me['uid'];
        $userRole = $me['role'] ?? '';

        if ($userRole === 'customer') {
            // Get conversations where user is customer (both salon and support)
            $stmt = $pdo->prepare("
                SELECT c.id, c.customer_id, c.salon_id, 
                       COALESCE(c.support_user_id, 0) AS support_user_id,
                       c.last_message_at, c.created_at,
                       CASE 
                           WHEN c.salon_id IS NOT NULL THEN s.name
                           ELSE u.full_name
                       END AS target_name,
                       CASE 
                           WHEN c.salon_id IS NOT NULL THEN s.id
                           ELSE u.id
                       END AS target_id,
                       CASE WHEN c.salon_id IS NOT NULL THEN 'salon' ELSE 'support' END AS conversation_type
                FROM conversations c
                LEFT JOIN salons s ON c.salon_id = s.id
                LEFT JOIN users u ON c.support_user_id = u.id
                WHERE c.customer_id = ?
                ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
            ");
            $stmt->execute([$userId]);
        } elseif ($userRole === 'salon') {
            // Get salon owned by this user
            $salonStmt = $pdo->prepare("SELECT id FROM salons WHERE owner_user_id = ? LIMIT 1");
            $salonStmt->execute([$userId]);
            $salon = $salonStmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$salon) {
                return $this->json(['conversations' => []]);
            }

            // Get conversations for this salon
            $stmt = $pdo->prepare("
                SELECT c.id, c.customer_id, c.salon_id, 
                       COALESCE(c.support_user_id, 0) AS support_user_id,
                       c.last_message_at, c.created_at,
                       u.full_name AS customer_name,
                       'salon' AS conversation_type
                FROM conversations c
                JOIN users u ON c.customer_id = u.id
                WHERE c.salon_id = ?
                ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
            ");
            $stmt->execute([$salon['id']]);
        } elseif ($userRole === 'admin') {
            // Admin can see all conversations
            $stmt = $pdo->prepare("
                SELECT c.id, c.customer_id, c.salon_id, 
                       COALESCE(c.support_user_id, 0) AS support_user_id,
                       c.last_message_at, c.created_at,
                       CASE 
                           WHEN c.salon_id IS NOT NULL THEN s.name
                           WHEN c.support_user_id IS NOT NULL THEN 'Support'
                           ELSE 'Chat'
                       END AS target_name,
                       u.full_name AS customer_name,
                       CASE WHEN c.salon_id IS NOT NULL THEN 'salon' ELSE 'support' END AS conversation_type
                FROM conversations c
                JOIN users u ON c.customer_id = u.id
                LEFT JOIN salons s ON c.salon_id = s.id
                ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
            ");
            $stmt->execute();
        } else {
            return $this->json(['conversations' => []]);
        }

        $conversations = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        return $this->json(['conversations' => $conversations]);
    }

    // GET /api/v1/chats/{conversation_id}/messages
    // Get all messages in a conversation
    public function getMessages(array $params)
    {
        $me = Auth::user();
        if (!$me || !isset($me['uid'])) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $conversationId = (int)($params['conversation_id'] ?? 0);
        if ($conversationId <= 0) {
            return $this->json(['error' => 'Invalid conversation ID'], 400);
        }

        $pdo = DB::pdo();
        $userId = (int)$me['uid'];

        // Verify user has access to this conversation
        if (!$this->canAccessConversation($conversationId, $userId)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        // Get messages
        $stmt = $pdo->prepare("
            SELECT m.id, m.conversation_id, m.sender_id, m.message_text, m.created_at,
                   u.full_name AS sender_name, u.avatar_url AS sender_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        ");
        $stmt->execute([$conversationId]);
        $messages = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return $this->json(['messages' => $messages]);
    }

    // POST /api/v1/chats/{conversation_id}/messages
    // Send a message in a conversation
    public function sendMessage(array $params)
    {
        $me = Auth::user();
        if (!$me || !isset($me['uid'])) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $conversationId = (int)($params['conversation_id'] ?? 0);
        if ($conversationId <= 0) {
            return $this->json(['error' => 'Invalid conversation ID'], 400);
        }

        $body = $this->body();
        $messageText = trim($body['message'] ?? '');

        if ($messageText === '') {
            return $this->json(['error' => 'Message cannot be empty'], 400);
        }

        $pdo = DB::pdo();
        $userId = (int)$me['uid'];

        // Verify user has access to this conversation
        if (!$this->canAccessConversation($conversationId, $userId)) {
            return $this->json(['error' => 'Access denied'], 403);
        }

        // Insert message
        $insert = $pdo->prepare("
            INSERT INTO messages (conversation_id, sender_id, message_text)
            VALUES (?, ?, ?)
        ");
        $insert->execute([$conversationId, $userId, $messageText]);
        $messageId = (int)$pdo->lastInsertId();

        // Update conversation's last_message_at
        $update = $pdo->prepare("UPDATE conversations SET last_message_at = NOW() WHERE id = ?");
        $update->execute([$conversationId]);

        // Get the created message
        $stmt = $pdo->prepare("
            SELECT m.id, m.conversation_id, m.sender_id, m.message_text, m.created_at,
                   u.full_name AS sender_name, u.avatar_url AS sender_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        ");
        $stmt->execute([$messageId]);
        $message = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $this->json(['message' => $message], 201);
    }

    // PUT /api/v1/chats/{message_id}/read
    // Mark a message as read
    public function markAsRead(array $params)
    {
        $me = Auth::user();
        if (!$me || !isset($me['uid'])) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $messageId = (int)($params['message_id'] ?? 0);
        if ($messageId <= 0) {
            return $this->json(['error' => 'Invalid message ID'], 400);
        }

        $pdo = DB::pdo();
        $userId = (int)$me['uid'];

        // Check if already marked as read
        $check = $pdo->prepare("SELECT id FROM message_reads WHERE message_id = ? AND user_id = ?");
        $check->execute([$messageId, $userId]);

        if ($check->fetch()) {
            return $this->json(['message' => 'Already marked as read']);
        }

        // Insert read record
        $insert = $pdo->prepare("INSERT INTO message_reads (message_id, user_id) VALUES (?, ?)");
        $insert->execute([$messageId, $userId]);

        return $this->json(['message' => 'Marked as read']);
    }

    // GET /api/v1/chats/{conversation_id}/unread-count
    // Get unread message count for a conversation
    public function getUnreadCount(array $params)
    {
        $me = Auth::user();
        if (!$me || !isset($me['uid'])) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $conversationId = (int)($params['conversation_id'] ?? 0);
        if ($conversationId <= 0) {
            return $this->json(['error' => 'Invalid conversation ID'], 400);
        }

        $pdo = DB::pdo();
        $userId = (int)$me['uid'];

        // Count unread messages (messages not sent by user and not in message_reads)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS unread_count
            FROM messages m
            WHERE m.conversation_id = ?
              AND m.sender_id != ?
              AND NOT EXISTS (
                  SELECT 1 FROM message_reads mr
                  WHERE mr.message_id = m.id AND mr.user_id = ?
              )
        ");
        $stmt->execute([$conversationId, $userId, $userId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $this->json(['unread_count' => (int)$result['unread_count']]);
    }

    // GET /api/v1/chats/total-unread
    // Get total unread message count across all conversations
    public function getTotalUnread()
    {
        $me = Auth::user();
        if (!$me || !isset($me['uid'])) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $pdo = DB::pdo();
        $userId = (int)$me['uid'];
        $userRole = $me['role'] ?? '';

        if ($userRole === 'customer') {
            // Count unread in customer's conversations
            $stmt = $pdo->prepare("
                SELECT COUNT(*) AS total_unread
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.customer_id = ?
                  AND m.sender_id != ?
                  AND NOT EXISTS (
                      SELECT 1 FROM message_reads mr
                      WHERE mr.message_id = m.id AND mr.user_id = ?
                  )
            ");
            $stmt->execute([$userId, $userId, $userId]);
        } elseif ($userRole === 'salon') {
            // Get salon owned by this user
            $salonStmt = $pdo->prepare("SELECT id FROM salons WHERE owner_user_id = ? LIMIT 1");
            $salonStmt->execute([$userId]);
            $salon = $salonStmt->fetch(\PDO::FETCH_ASSOC);

            if (!$salon) {
                return $this->json(['total_unread' => 0]);
            }

            // Count unread in salon's conversations
            $stmt = $pdo->prepare("
                SELECT COUNT(*) AS total_unread
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.salon_id = ?
                  AND m.sender_id != ?
                  AND NOT EXISTS (
                      SELECT 1 FROM message_reads mr
                      WHERE mr.message_id = m.id AND mr.user_id = ?
                  )
            ");
            $stmt->execute([$salon['id'], $userId, $userId]);
        } else {
            return $this->json(['total_unread' => 0]);
        }

        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $this->json(['total_unread' => (int)$result['total_unread']]);
    }

    // Helper method to check if user can access a conversation
    private function canAccessConversation(int $conversationId, int $userId): bool
    {
        $pdo = DB::pdo();

        // Get conversation details
        $stmt = $pdo->prepare("
            SELECT c.customer_id, c.salon_id, c.support_user_id, s.owner_user_id
            FROM conversations c
            LEFT JOIN salons s ON c.salon_id = s.id
            WHERE c.id = ?
        ");
        $stmt->execute([$conversationId]);
        $conv = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$conv) {
            return false;
        }

        // User can access if they are:
        // 1. The customer in the conversation, OR
        // 2. The salon owner (if it's a salon conversation), OR
        // 3. The support user (if it's a support conversation)
        return ($userId === (int)$conv['customer_id']) 
            || ($conv['salon_id'] && $userId === (int)$conv['owner_user_id'])
            || ($conv['support_user_id'] && $userId === (int)$conv['support_user_id']);
    }
}
