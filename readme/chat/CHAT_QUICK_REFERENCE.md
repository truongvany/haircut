# Chat Feature - Quick Reference

## Test Account Credentials
```
Email:    customer@haircut.test
Password: 123456
Role:     Customer
```

## Frontend URL
```
Development:  http://localhost:5173 or http://localhost:5174
Production:   (not deployed yet)
```

## API Endpoints Summary
```
POST   /api/v1/chats/{salon_id}/start              → Create/get conversation
GET    /api/v1/chats/conversations                  → List all conversations
GET    /api/v1/chats/{conversation_id}/messages    → Get messages
POST   /api/v1/chats/{conversation_id}/messages    → Send message
GET    /api/v1/chats/{conversation_id}/unread-count → Get unread count
GET    /api/v1/chats/total-unread                  → Get total unread
PUT    /api/v1/chats/{message_id}/read             → Mark as read
```

## File Locations
```
Backend:
  - Controller:        /backend/app/controllers/ChatController.php
  - Database Schema:   /backend/migrations/create_chat_tables.sql
  - Setup Script:      /backend/scripts/setup_chat_complete.php
  - Routes:            /backend/public/index.php (lines 81-87)

Frontend:
  - Main Component:    /frontend/src/pages/Support/SupportChat.tsx
  - Chat Button:       /frontend/src/pages/Salon/SalonDetail.tsx
  - API Module:        /frontend/src/api/chat.ts
  - Login:             /frontend/src/pages/Account/login.tsx

Tests:
  - DB Structure:      /backend/scripts/test_chat_start.php
  - API Test:          /backend/scripts/test_api_chat.php
  - Create Conv Test:  /backend/scripts/test_create_conversation.php
  - User List:         /backend/scripts/list_users.php
  - Windows Verify:    /verify_chat.bat
```

## Database Tables
```
conversations
  id              INT PRIMARY KEY
  customer_id     INT FOREIGN KEY
  salon_id        INT FOREIGN KEY (nullable)
  support_user_id INT FOREIGN KEY (nullable)
  last_message_at TIMESTAMP (nullable)
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

messages
  id              INT PRIMARY KEY
  conversation_id INT FOREIGN KEY
  sender_id       INT FOREIGN KEY
  message_text    TEXT
  created_at      TIMESTAMP

message_reads
  id              INT PRIMARY KEY
  message_id      INT FOREIGN KEY
  user_id         INT FOREIGN KEY
  read_at         TIMESTAMP
```

## Keyboard Shortcuts
```
In Message Input:
  Enter           → Send message
  Shift + Enter   → New line in message
```

## Browser Console Commands (for debugging)
```javascript
// Check if user is logged in
JSON.parse(localStorage.getItem('hc_user'))

// Check auth token
localStorage.getItem('hc_token')

// Clear auth (for logout/testing)
localStorage.removeItem('hc_token')
localStorage.removeItem('hc_user')

// View selected conversation ID
localStorage.getItem('selectedConversationId')
```

## Common Errors & Quick Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Unauthorized" (401) | Not authenticated | Login with customer account |
| "Customer ID required" (400) | Logged in as salon/admin | Login with customer@haircut.test |
| "Salon not found" (404) | Invalid salon ID | Check salon exists in database |
| "Cannot create conversation" (500) | Database error | Check tables exist and have data |
| Conversation not created | User role not 'customer' | Verify localStorage hc_user shows role: 'customer' |
| Messages not updating | Polling stopped | Refresh page, check console for errors |

## Testing Workflows

### Quick Test (2 minutes)
1. Open browser → http://localhost:5173
2. Login with customer@haircut.test / 123456  
3. Click a salon
4. Click "Chat với salon này"
5. Check that you're redirected to /support

### Full Test (10 minutes)
1. Do Quick Test above
2. Type a message in the chat input
3. Press Enter to send
4. Wait 2 seconds and verify message appears
5. Open same conversation in another browser window
6. Send message from first window
7. Verify it appears in second window within 2 seconds

### API Test (5 minutes)
1. Run: `cd backend && php scripts/test_api_chat.php`
2. Check that response shows Status 201
3. Verify conversation data is returned
4. Look for API Response in browser console
5. Check Network tab for request/response details

## Ports & Services

| Service | Port | Status |
|---------|------|--------|
| Frontend Dev Server | 5173/5174 | Running (started earlier) |
| Backend Apache | 80 | Running (XAMPP) |
| MySQL | 3306 | Running (XAMPP) |

## Support Contacts

For database issues:
- MySQL running on localhost:3306
- Database: haircut_dev
- Run `/backend/scripts/test_chat_start.php` to verify connection

For API issues:
- Check `/xampp/apache/logs/error.log`
- Run test scripts in `/backend/scripts/`

For frontend issues:
- Check browser F12 console
- Check Network tab for API calls
- Review login status in localStorage

---

## Next Actions

1. **Right Now:**
   - [ ] Open http://localhost:5173
   - [ ] Login with credentials above
   - [ ] Test chat feature

2. **If Issues:**
   - [ ] Check browser console (F12)
   - [ ] Open CHAT_TESTING_GUIDE.md
   - [ ] Run test scripts in `/backend/scripts/`

3. **When Working:**
   - [ ] Test with multiple conversations
   - [ ] Test support chat
   - [ ] Review CHAT_IMPLEMENTATION_COMPLETE.md
   - [ ] Check CHAT_NEXT_STEPS.md for future improvements

---

**Status:** ✅ Ready to Test  
**Last Updated:** 2025-11-28  
**Backend API:** ✅ Verified Working  
**Frontend:** ✅ Build Successful
