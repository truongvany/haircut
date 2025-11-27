<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Config\DB;
use App\Core\Auth;

class ChatController extends Controller
{
    // POST /api/v1/chats/{salon_id}/start
    // Start or get existing conversation with a salon
    public function startConversation(array $params)
    {
        $me = Auth::user();
        if (!$me || !isset($me['uid'])) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $salonId = (int)($params['salon_id'] ?? 0);
        if ($salonId <= 0) {
            return $this->json(['error' => 'Invalid salon ID'], 400);
        }

        $pdo = DB::pdo();
        $userId = (int)$me['uid'];
        $userRole = $me['role'] ?? '';

        // Verify salon exists
        $salonCheck = $pdo->prepare("SELECT id, owner_user_id FROM salons WHERE id = ?");
        $salonCheck->execute([$salonId]);
        $salon = $salonCheck->fetch(\PDO::FETCH_ASSOC);
        
        if (!$salon) {
            return $this->json(['error' => 'Salon not found'], 404);
        }

        // Determine customer_id based on role
        if ($userRole === 'customer') {
            $customerId = $userId;
        } elseif ($userRole === 'salon' || $userRole === 'admin') {
            // Salon owner accessing their own conversations
            // For now, we'll require a customer_id in the request body
            $body = $this->body();
            $customerId = (int)($body['customer_id'] ?? 0);
            if ($customerId <= 0) {
                return $this->json(['error' => 'Customer ID required for salon users'], 400);
            }
        } else {
            return $this->json(['error' => 'Invalid user role'], 403);
        }

        // Check if conversation already exists
        $stmt = $pdo->prepare("
            SELECT id, customer_id, salon_id, last_message_at, created_at 
            FROM conversations 
            WHERE customer_id = ? AND salon_id = ?
        ");
        $stmt->execute([$customerId, $salonId]);
        $conversation = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($conversation) {
            return $this->json(['conversation' => $conversation]);
        }

        // Create new conversation
        $insert = $pdo->prepare("
            INSERT INTO conversations (customer_id, salon_id) 
            VALUES (?, ?)
        ");
        $insert->execute([$customerId, $salonId]);
        $conversationId = (int)$pdo->lastInsertId();

        $newConv = $pdo->prepare("SELECT id, customer_id, salon_id, last_message_at, created_at FROM conversations WHERE id = ?");
        $newConv->execute([$conversationId]);
        $conversation = $newConv->fetch(\PDO::FETCH_ASSOC);

        return $this->json(['conversation' => $conversation], 201);
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
            // Get conversations where user is customer
            $stmt = $pdo->prepare("
                SELECT c.id, c.customer_id, c.salon_id, c.last_message_at, c.created_at,
                       s.name AS salon_name, s.avatar_url AS salon_avatar
                FROM conversations c
                JOIN salons s ON c.salon_id = s.id
                WHERE c.customer_id = ?
                ORDER BY c.last_message_at DESC, c.created_at DESC
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
                SELECT c.id, c.customer_id, c.salon_id, c.last_message_at, c.created_at,
                       u.full_name AS customer_name, u.avatar_url AS customer_avatar
                FROM conversations c
                JOIN users u ON c.customer_id = u.id
                WHERE c.salon_id = ?
                ORDER BY c.last_message_at DESC, c.created_at DESC
            ");
            $stmt->execute([$salon['id']]);
        } else {
            // Admin can see all
            $stmt = $pdo->query("
                SELECT c.id, c.customer_id, c.salon_id, c.last_message_at, c.created_at,
                       u.full_name AS customer_name, s.name AS salon_name
                FROM conversations c
                JOIN users u ON c.customer_id = u.id
                JOIN salons s ON c.salon_id = s.id
                ORDER BY c.last_message_at DESC, c.created_at DESC
            ");
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
            SELECT c.customer_id, c.salon_id, s.owner_user_id
            FROM conversations c
            JOIN salons s ON c.salon_id = s.id
            WHERE c.id = ?
        ");
        $stmt->execute([$conversationId]);
        $conv = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$conv) {
            return false;
        }

        // User can access if they are the customer or the salon owner
        return ($userId === (int)$conv['customer_id']) || ($userId === (int)$conv['owner_user_id']);
    }
}
