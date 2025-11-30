# Chat System - Setup & Troubleshooting Guide

## Quick Start

### 1. Run Setup Script (IMPORTANT!)
```
http://localhost/haircut/backend/public/setup_chat_complete.php
```

This will:
- Add `support_user_id` column to conversations table
- Create support account (support@haircut.local)
- Setup all indexes and constraints

### 2. Check Setup Status
```
http://localhost/haircut/backend/public/check_chat_setup.php
```

This shows:
- Database table structure
- Support account status
- Conversation count
- Migration status

### 3. Test API (Must be logged in)
```
http://localhost/haircut/backend/public/test_chat_api.php
```

Shows:
- Current user info
- Database status
- Columns that exist

## Common Issues & Solutions

### Issue 1: "Chưa có cuộc hội thoại nào" (No conversations)
**Cause**: conversations table doesn't have support_user_id column yet

**Solution**:
1. Run: `http://localhost/haircut/backend/public/setup_chat_complete.php`
2. Refresh `/support` page
3. Click "Bắt đầu chat với Support"

### Issue 2: Chat button not working on Salon Detail
**Cause**: Route conflict or API error

**Solution**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab → find the POST /api/v1/chats/* request
4. If 404, check backend routes in `public/index.php`
5. Ensure routes are in correct order:
   - Fixed routes FIRST: `/api/v1/chats/conversations`, `/api/v1/chats/total-unread`
   - Dynamic routes AFTER: `/api/v1/chats/{salon_id}/start`, etc.

### Issue 3: API returns 308/404 errors
**Cause**: Router.php is case-sensitive or path matching issue

**Solution**:
1. Run check_chat_setup.php to verify database
2. Check if routes are registered correctly in index.php
3. Verify URL format matches exactly
4. Check CORS settings in config/cors.php

### Issue 4: "Support account not found"
**Cause**: No admin user with role_id=1

**Solution**:
1. Check users table: `SELECT * FROM users WHERE role_id = 1`
2. If empty, run setup script
3. If exists, setup script will use it

### Issue 5: Database column errors in console
**Cause**: Trying to access support_user_id before column exists

**Solution**:
1. Run setup_chat_complete.php
2. Wait for all steps to complete
3. Check browser console for confirmation

## Testing Workflow

### Test as Customer
1. Login with customer account
2. Go to `/salons` page
3. Click on a salon
4. Click "💬 Chat với salon này" button
5. Should redirect to `/support` with conversation selected
6. Type message and click "Gửi"
7. Message should appear in chat

### Test Support Chat
1. Login with customer account
2. Go to `/support`
3. Click "Bắt đầu chat với Support" (if no conversations)
4. Should see welcome message from Support Team
5. Reply with a message
6. Check as admin/support account to see response

### Test as Salon Owner
1. Login with salon owner account
2. Go to `/support`
3. Should see list of customer conversations
4. Click on a customer
5. See all messages
6. Send reply
7. Check as customer to verify message received

### Test as Admin
1. Login with admin account
2. Go to `/support`
3. Should see all conversations (both salon and support)
4. Can chat in any conversation

## Database Structure

### conversations table
```
- id (PK)
- customer_id (FK users)
- salon_id (FK salons, NULLABLE)
- support_user_id (FK users, NULLABLE) ← ADDED BY SETUP
- last_message_at
- created_at
- updated_at

Unique constraint: (customer_id, salon_id, support_user_id)
```

### messages table
```
- id (PK)
- conversation_id (FK conversations)
- sender_id (FK users)
- message_text
- created_at
```

### message_reads table
```
- id (PK)
- message_id (FK messages)
- user_id (FK users)
- read_at
```

## API Routes

All routes require authentication header:
```
Authorization: Bearer {token}
```

### Routes (in correct order)
```
GET    /api/v1/chats/conversations              → List user conversations
GET    /api/v1/chats/total-unread               → Get unread count
POST   /api/v1/chats/{salon_id}/start           → Start chat (salon_id=0 for support)
GET    /api/v1/chats/{conversation_id}/messages → Get messages
POST   /api/v1/chats/{conversation_id}/messages → Send message
GET    /api/v1/chats/{conversation_id}/unread-count → Unread for conversation
PUT    /api/v1/chats/{message_id}/read          → Mark message as read
```

## Support Account

After running setup:
```
Email: support@haircut.local
Password: support123
Role: Admin
```

Use this account to:
- Chat with customers via Support page
- Respond to support requests
- View all conversations

## Setup Scripts

### setup_chat_complete.php
**Purpose**: Complete setup with error handling

**Does**:
- Checks if support_user_id column exists
- Adds column if missing
- Creates/verifies support account
- Sets up indexes and constraints
- Shows detailed status

**When to use**: First time setup and troubleshooting

### check_chat_setup.php
**Purpose**: Check current setup status

**Shows**:
- Table structure
- Column list
- Support account existence
- Conversation count
- Detailed debug info

**When to use**: Verify setup completed successfully

### test_chat_api.php
**Purpose**: Test API with current user

**Shows**:
- Authenticated user info
- Database status
- Column availability

**When to use**: Debug API issues

## Important Notes

1. **Route Order Matters**: Fixed routes must come before dynamic routes
2. **Backward Compatibility**: Code handles missing support_user_id column
3. **Real-time**: Uses polling (2-3 seconds) not WebSocket
4. **Support Badge**: Shows "🎧 Support" for support conversations
5. **Welcome Message**: Auto-sent when support conversation created

## Next Steps

1. Run `setup_chat_complete.php`
2. Verify with `check_chat_setup.php`
3. Test with `test_chat_api.php`
4. Try customer workflow
5. Try salon owner workflow
6. Try admin workflow

If issues persist, check console errors and database directly.
