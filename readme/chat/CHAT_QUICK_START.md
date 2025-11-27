# 💬 Chat System - Quick Start Guide

**⏱️ Setup Time:** 5 minutes  
**Status:** ✅ Ready to use

---

## 🚀 Quick Setup (3 Steps)

### **Step 1: Run Database Migration** (2 minutes)

Open phpMyAdmin or MySQL command line:

```bash
# Option A: Command line
cd backend
mysql -u root -p haircut_dev < migrations/create_chat_tables.sql

# Option B: phpMyAdmin
# 1. Open phpMyAdmin
# 2. Select 'haircut_dev' database
# 3. Click 'Import' tab
# 4. Choose 'backend/migrations/create_chat_tables.sql'
# 5. Click 'Go'
```

### **Step 2: Verify Installation** (1 minute)

```bash
cd backend/scripts
php setup_chat.php
```

You should see:
```
✅ Table: conversations (6 columns)
✅ Table: messages (5 columns)
✅ Table: message_reads (4 columns)
✅ CHAT SYSTEM READY TO USE!
```

### **Step 3: Test the Chat** (2 minutes)

1. **Open browser:** `http://localhost/support`
2. **Login as customer**
3. **Select a salon** from the list
4. **Send a message:** "Hello, I'd like to book an appointment"
5. **Open another browser window** (or incognito)
6. **Login as salon owner**
7. **Navigate to:** `http://localhost/support`
8. **See the conversation** and reply!

---

## 🎯 What You Get

### **Features**
✅ Real-time messaging (3-second polling)  
✅ Conversation management  
✅ Message history  
✅ Beautiful gradient UI  
✅ Responsive design  
✅ User avatars  
✅ Timestamps  
✅ Auto-scroll to latest message

### **For Customers**
- Chat with any salon
- View all conversations
- Send/receive messages
- See message history

### **For Salon Owners**
- See all customer conversations
- Reply to customer messages
- Manage multiple chats
- Track conversation history

---

## 📱 How to Use

### **As a Customer:**
1. Go to `/support` page
2. Click on a salon to start chatting
3. Type your message
4. Press Enter or click "Gửi"
5. Messages appear in real-time (within 3 seconds)

### **As a Salon Owner:**
1. Go to `/support` page
2. See list of customer conversations
3. Click on a conversation
4. Reply to customer messages
5. Messages sync automatically

---

## 🔧 Troubleshooting

### **Tables not found?**
```bash
# Run the migration again
mysql -u root -p haircut_dev < backend/migrations/create_chat_tables.sql
```

### **Can't see conversations?**
- Make sure you're logged in
- Check browser console for errors
- Verify database connection in backend/.env

### **Messages not appearing?**
- Wait 3 seconds (polling interval)
- Check network tab in browser dev tools
- Verify JWT token is valid

### **401 Unauthorized error?**
- Login again
- Check if token expired (24 hours)
- Clear localStorage and re-login

---

## 📊 API Endpoints

All endpoints require JWT authentication:

```
POST   /api/v1/chats/{salon_id}/start              → Start conversation
GET    /api/v1/chats/conversations                 → List conversations
GET    /api/v1/chats/{conversation_id}/messages    → Get messages
POST   /api/v1/chats/{conversation_id}/messages    → Send message
PUT    /api/v1/chats/{message_id}/read             → Mark as read
GET    /api/v1/chats/{conversation_id}/unread-count → Unread count
GET    /api/v1/chats/total-unread                  → Total unread
```

---

## 🎨 UI Preview

```
┌─────────────────────────────────────────────────┐
│  💬 Hỗ trợ khách hàng                           │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│ Conversations│  Chat with Salon ABC             │
│              │  ────────────────────────────    │
│ 🏪 Salon ABC │                                  │
│ 5 phút trước │  👤 John: Hello!                 │
│              │     2 phút trước                 │
│ 💇 Salon XYZ │                                  │
│ 1 giờ trước  │  👤 You: I'd like to book...     │
│              │     Vừa xong                     │
│              │                                  │
│              │  ────────────────────────────    │
│              │  [Type message...] [Gửi]        │
└──────────────┴──────────────────────────────────┘
```

---

## 📖 Full Documentation

For complete details, see:
- **CHAT_SYSTEM_GUIDE.md** - Complete technical documentation
- **backend/app/controllers/ChatController.php** - Backend implementation
- **frontend/src/pages/Support/SupportChatPage.tsx** - Frontend implementation

---

## ✅ Checklist

- [ ] Database tables created
- [ ] Verification script passed
- [ ] Can start conversation as customer
- [ ] Can send messages
- [ ] Can receive messages (within 3 seconds)
- [ ] Can see conversation list
- [ ] UI looks good on mobile
- [ ] Tested with multiple users

---

## 🎉 You're Done!

The chat system is now fully operational. Customers can chat with salons in real-time!

**Need help?** Check CHAT_SYSTEM_GUIDE.md for detailed documentation.

---

**Happy Chatting!** 💬✨

