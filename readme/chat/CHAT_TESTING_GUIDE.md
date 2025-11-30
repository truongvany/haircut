# Chat Feature - Testing Guide

## Latest Updates

### 1. Backend Improvements
- ✅ Added comprehensive error logging to `ChatController::startConversation()`
- ✅ Added try-catch error handling for database operations  
- ✅ Better error messages for debugging
- ✅ Verified database structure and support account creation

### 2. Frontend Improvements
- ✅ Updated `SalonDetail.tsx` with better error handling and logging
- ✅ Added localStorage to pass selected conversation ID from salon detail to support page
- ✅ Enhanced `SupportChat.tsx` to auto-select conversation from localStorage
- ✅ Added detailed console logging for debugging
- ✅ Changed default login credentials to customer account

### 3. Database / Users
- ✅ Created test customer account: **customer@haircut.test / 123456**
- ✅ Database tested and verified working
- ✅ Conversations table has proper constraints and support column

## API Endpoint Test Results

Successfully tested `/api/v1/chats/{salon_id}/start` endpoint:

```
POST /api/v1/chats/1/start
Authorization: Bearer <token>
```

**Response (201 Created):**
```json
{
  "conversation": {
    "id": 5,
    "customer_id": 2,
    "salon_id": 1,
    "support_user_id": null,
    "last_message_at": null,
    "created_at": "2025-11-28 09:42:15"
  }
}
```

✅ **Backend API is working correctly!**

## How to Test the Chat Feature

### Step 1: Open the Frontend Application
- URL: `http://localhost:5173`
- You should see the login page

### Step 2: Login with Customer Account
- **Email:** `customer@haircut.test`
- **Password:** `123456`
- (This is pre-filled in the login form)

### Step 3: Navigate to a Salon
- Click on any salon from the list
- You'll see the salon detail page with a "💬 Chat với salon này" button

### Step 4: Click the Chat Button
- Click the chat button
- Check the browser console (F12 → Console tab) for detailed logging
- Expected: Should create a conversation and redirect to /support page
- New conversation should be auto-selected in the chat list

### Step 5: Send a Test Message
- Type a message in the message input box
- Click send
- Message should appear in the chat

## Expected Behavior Flow

1. **Login** → User authenticates as customer
2. **Browse Salons** → View salon details
3. **Click Chat** → 
   - Creates conversation (customer_id + salon_id)
   - Stores conversation ID in localStorage
   - Redirects to /support page
4. **Auto-Select Conversation** →
   - /support page loads and fetches conversations
   - Detects selected conversation ID from localStorage
   - Auto-selects it in the conversation list
5. **Chat Interface** →
   - Messages poll every 2 seconds
   - Conversations poll every 3 seconds
   - Messages display in real-time

## Debugging

If you encounter errors:

1. **Check Browser Console (F12 → Console)**
   - Look for API request logs starting with "🚀 API Request"
   - Look for response logs starting with "✅ API Response" or "❌ API Error"
   - Check for error messages from SalonDetail button click

2. **Check Backend Logs**
   - Error logs in `/xampp/apache/logs/` with detailed debug output
   - Look for "=== START CONVERSATION REQUEST ===" in logs

3. **Verify User Role**
   - Logged-in user must have role: "customer"
   - Can check in browser console: `localStorage.getItem('hc_user')`

4. **Check Network Tab**
   - F12 → Network tab
   - Click chat button
   - Look for POST request to `/v1/chats/*/start`
   - Check response status and content

## File Changes Summary

| File | Changes |
|------|---------|
| `backend/app/controllers/ChatController.php` | Added error logging and better exception handling |
| `frontend/src/pages/Salon/SalonDetail.tsx` | Enhanced error handling, added logging, localStorage support |
| `frontend/src/pages/Support/SupportChat.tsx` | Added auto-select from localStorage, fixed TypeScript types |
| `frontend/src/pages/Account/login.tsx` | Changed default login credentials to customer |

## Test Cases to Run

- [ ] Login as customer
- [ ] Browse salons
- [ ] Click "Chat với salon này" button
- [ ] Verify conversation created
- [ ] Check /support page shows conversation
- [ ] Send a test message
- [ ] Verify message appears immediately
- [ ] Reload page and verify message persists
- [ ] Open support chat from /support page directly

## Support Chat Feature (Bonus)

On the /support page, there's also a "Bắt đầu chat với Support" button that creates conversations with the support team (support@haircut.local, ID: 9006).

This is currently available in the UI but may show "Không thể tạo conversation" if the support flow has the same issues.

## Next Steps if Issues Persist

1. **Share console error details** - Run through test steps and copy console errors
2. **Share network tab response** - The actual API error response will pinpoint the issue  
3. **Check authentication** - Verify user is logged in as customer (not salon or admin)
4. **Database verification** - Run `/backend/scripts/test_chat_start.php` to verify DB is correct

---

**Last Updated:** 2025-11-28 09:45 UTC
