# Chat System Implementation - Complete Setup Checklist

## ✅ What's Been Done

### Backend Changes
- ✅ Updated `ChatController.php` to support support_user_id
- ✅ Added backward compatibility for databases without support_user_id
- ✅ Fixed route order in `public/index.php` (fixed routes before dynamic routes)
- ✅ Created 3 setup/debug scripts:
  - `setup_chat_complete.php` - Full setup with error handling
  - `check_chat_setup.php` - Check current status
  - `test_chat_api.php` - API test endpoint

### Frontend Changes
- ✅ Updated `SupportChat.tsx` with real-time polling
- ✅ Added error handling for API responses
- ✅ Added "Start chat with Support" button
- ✅ Added button to Salon Detail page
- ✅ Updated CSS styling
- ✅ Added support for both salon and support conversations

## 🚀 Setup Instructions (MUST DO!)

### Step 1: Initialize Database
1. Open your browser and go to:
   ```
   http://localhost/haircut/backend/public/setup_chat_complete.php
   ```

2. Wait for all steps to complete (should see ✅ checkmarks)

3. You'll see:
   ```
   Support Account Details:
   Email: support@haircut.local
   Password: support123
   ```

### Step 2: Verify Setup
1. Go to:
   ```
   http://localhost/haircut/backend/public/check_chat_setup.php
   ```

2. Check that it shows:
   - ✓ support_user_id column EXISTS
   - ✓ Support account found
   - ✓ Tables verified

### Step 3: Test API
1. Make sure you're logged in on the frontend
2. Go to:
   ```
   http://localhost/haircut/backend/public/test_chat_api.php
   ```

3. Should show your user info and database status

## 📱 How to Use

### As a Customer

#### Method 1: Chat from Salon Detail
1. Go to `/salons`
2. Click on a salon
3. Look for "💬 Chat với salon này" button
4. Click it
5. Automatically goes to `/support` with that conversation
6. Start chatting!

#### Method 2: Support Chat Page
1. Go to `/support`
2. If you have no conversations, click "Bắt đầu chat với Support"
3. Receive welcome message from Support Team
4. Reply and chat!

### As Salon Owner
1. Go to `/support`
2. You'll see list of customers who want to chat
3. Click on a customer
4. See all messages and reply

### As Admin
1. Go to `/support`
2. See ALL conversations (both salon and support)
3. Can chat with anyone

## 🔍 Troubleshooting

### Problem: Still see "Chưa có cuộc hội thoại nào"
**Solution**: 
1. Run `setup_chat_complete.php` again
2. Refresh the page
3. Click "Bắt đầu chat với Support"

### Problem: Chat button on Salon Detail doesn't work
**Solution**:
1. Open DevTools (F12) → Console tab
2. Look for error message
3. If it says "Support feature not available", run `setup_chat_complete.php`
4. If it says "Unauthorized", login first

### Problem: Can't see any conversations
**Solution**:
1. Run `check_chat_setup.php`
2. Check "Conversations count" - should be > 0
3. Create a conversation by clicking "Bắt đầu chat với Support"

### Problem: API returns 404 or 308
**Solution**:
1. Check backend `public/index.php` routes are correct
2. Verify fixed routes come before dynamic routes:
   - `/api/v1/chats/conversations` ← MUST be before
   - `/api/v1/chats/{conversation_id}/messages`

## 📊 Database Schema After Setup

```
conversations
├── id (PK)
├── customer_id (FK users)
├── salon_id (FK salons, NULL for support)
├── support_user_id (FK users, NULL for salon) ← ADDED
├── last_message_at
├── created_at

messages
├── id (PK)
├── conversation_id (FK)
├── sender_id (FK users)
├── message_text
├── created_at

message_reads
├── id (PK)
├── message_id (FK)
├── user_id (FK)
├── read_at
```

## 🎯 Features

- ✅ Real-time polling (2-3 seconds)
- ✅ Direct chat from Salon Detail page
- ✅ Support account for general inquiries
- ✅ Auto-scroll to latest message
- ✅ Message timestamps
- ✅ User avatars
- ✅ Support badge for support conversations
- ✅ Welcome message from Support
- ✅ Responsive design
- ✅ Error handling

## 📝 Files Modified/Created

### Backend
- `app/controllers/ChatController.php` - Updated with support
- `public/index.php` - Fixed route order
- `public/setup_chat_complete.php` - NEW
- `public/check_chat_setup.php` - NEW
- `public/test_chat_api.php` - NEW

### Frontend
- `pages/Support/SupportChat.tsx` - Updated
- `pages/Support/SupportChat.module.css` - Updated
- `pages/Salon/SalonDetail.tsx` - Added button
- `components/SalonDetail.css` - Added button styling
- `api/chat.ts` - Updated
- `App.tsx` - Updated routes

## ⚙️ Configuration

### Support Account
```
Email: support@haircut.local
Password: support123
Role: Admin
```

You can change the password after first login.

### Polling Interval
Current: 2-3 seconds for messages, 3 seconds for conversations

To change, edit `SupportChat.tsx`:
- Line with `setInterval(loadMessages, 2000)` → change 2000 to ms
- Line with `setInterval(loadConversations, 3000)` → change 3000 to ms

## 🚨 Important Notes

1. **Run setup_chat_complete.php first!** - This is essential
2. **Route order matters** - Fixed routes must come before dynamic routes
3. **Real-time = polling** - Not WebSocket, so max 2-3 second delay
4. **Support badge** - Shows "🎧 Support" for support conversations
5. **Auto-message** - First support message is auto-sent

## 📚 Related Documentation

- `SETUP_REALTIME_SUPPORT.md` - Overview of features
- `CHAT_SETUP_TROUBLESHOOTING.md` - Detailed troubleshooting
- `CHAT_QUICK_START.md` - Quick start guide

## ✨ What's Next

Future improvements:
- [ ] WebSocket for true real-time (no polling)
- [ ] Typing indicators
- [ ] File/image sharing
- [ ] Message search
- [ ] Conversation archive
- [ ] Push notifications
