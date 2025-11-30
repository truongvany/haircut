# Chat System - Essential Info for Testing

## 🔥 FIRST THING TO DO

Run this URL in your browser:
```
http://localhost/haircut/backend/public/setup_chat_complete.php
```

Wait for all steps to complete. You should see ✅ checkmarks for:
- Adding support_user_id column
- Creating support account
- Verifying tables
- Adding indexes

## 📍 What Happens After Setup

Your database will have:
- New column: `conversations.support_user_id`
- New user: `support@haircut.local` (password: support123)
- New conversation type: Support chats

## 🧪 Test It

### Test 1: Check Setup
Go to: `http://localhost/haircut/backend/public/check_chat_setup.php`

Should show:
- ✓ support_user_id column EXISTS
- ✓ Support account found
- ✓ Tables verified

### Test 2: Login and Test API
1. Login on frontend
2. Go to: `http://localhost/haircut/backend/public/test_chat_api.php`
3. Should show your user info

### Test 3: Use Chat
1. Go to `/support` page
2. Click "Bắt đầu chat với Support" 
3. Get welcome message from Support Team
4. Reply and chat!

### Test 4: Chat from Salon Detail
1. Go to `/salons`
2. Click on a salon
3. Click "💬 Chat với salon này"
4. Should go to `/support` with conversation selected
5. Chat!

## 📋 Account Credentials

After setup:

```
Support Account:
  Email: support@haircut.local
  Password: support123
  Role: Admin
```

Use this to chat with customers via Support page.

## 🐛 If Something Goes Wrong

### Error: "Chưa có cuộc hội thoại nào"
- Run `setup_chat_complete.php` again
- Refresh page
- Click "Bắt đầu chat với Support"

### Error: "Support feature not available"
- Run `setup_chat_complete.php`
- Wait for completion
- Try again

### Error: 404 or API not working
1. Check `backend/public/index.php`
2. Verify routes are in correct order
3. Check Console (F12) for errors

## 📱 Features Implemented

✅ Chat from Salon Detail page
✅ Chat with Support Team
✅ Real-time polling (2-3 seconds)
✅ Auto-welcome message from Support
✅ Support badge for support conversations
✅ Message timestamps
✅ User avatars
✅ Responsive design
✅ Error handling

## 🎯 Workflow

### Customer Workflow
1. Browse salons
2. Click "Chat với salon này" on salon detail
3. Automatically goes to /support with conversation
4. Or click "Bắt đầu chat với Support" on /support page
5. Chat!

### Shop Owner Workflow
1. Go to /support
2. See list of customers
3. Click customer to view conversation
4. Send replies

### Admin Workflow
1. Go to /support
2. See all conversations
3. Can chat in any conversation

## 📞 Support Account

After running setup:
- Email: support@haircut.local
- Password: support123
- Login as this account to chat with customers via /support page

## ✨ Everything is Done

All code changes are complete. Just need to:
1. Run the setup script
2. Test the features
3. Enjoy!

No additional coding needed. The chat system is fully implemented.
