# Real-time Support Chat System Setup Guide

## Overview
Hệ thống chat real-time cho phép:
- Khách hàng chat trực tiếp với các salon từ trang chi tiết salon
- Khách hàng chat với Support Team khi không có conversation nào
- Shop (salon owner) chat với khách hàng
- Polling real-time mỗi 2-3 giây

## Setup Steps

### 1. **Database Migration** (Backend)
Chạy setup script để tạo support account và cập nhật database:

```bash
# Truy cập:
http://localhost/haircut/backend/public/setup_support.php
```

Script sẽ:
- Thêm cột `support_user_id` vào bảng `conversations`
- Cập nhật constraint unique key
- Tạo support account (email: support@haircut.local)

### 2. **Support Account Credentials**
Sau khi chạy setup script:
- **Email**: support@haircut.local
- **Password**: support123
- **Role**: Admin (Support)

Bạn có thể đăng nhập với tài khoản này để chat trực tiếp với khách hàng qua trang Support.

## Features

### Frontend - Customer Side
1. **Chat từ Salon Detail Page** 
   - Button "💬 Chat với salon này" trên trang chi tiết salon
   - Click button → tự động mở trang Support với conversation được chọn
   - Có thể gửi tin nhắn ngay lập tức

2. **Support Chat Page** (`/support`)
   - Danh sách các cuộc hội thoại (cả salon và support)
   - Tự động hiển thị "Support" conversation cho khách hàng mới
   - Chat interface real-time

3. **Auto-start Support Chat**
   - Nếu khách hàng chưa có conversation nào, click "Bắt đầu chat với Support"
   - Tự động gửi tin nhắn welcome từ Support Team
   - Tin nhắn: "Xin chào! 👋 Tôi là Support Team của Haircut. Bạn cần hỗ trợ gì không?"

### Frontend - Real-time Updates
- Polling conversations mỗi 3 giây
- Polling messages mỗi 2 giây
- Auto-scroll đến message mới nhất
- Responsive design (mobile, tablet, desktop)

### Backend - API Endpoints

#### Chat Routes
- `POST /api/v1/chats/{salon_id}/start` - Bắt đầu/lấy conversation (salon_id=0 → support)
- `GET /api/v1/chats/conversations` - Danh sách conversations
- `GET /api/v1/chats/{conversation_id}/messages` - Danh sách tin nhắn
- `POST /api/v1/chats/{conversation_id}/messages` - Gửi tin nhắn
- `PUT /api/v1/chats/{message_id}/read` - Đánh dấu đã đọc
- `GET /api/v1/chats/{conversation_id}/unread-count` - Số tin chưa đọc
- `GET /api/v1/chats/total-unread` - Tổng tin chưa đọc

#### Support Account Endpoints
Chỉ support admin và shop owner có thể truy cập.

## Database Schema Changes

### conversations Table
```sql
ALTER TABLE conversations 
ADD COLUMN support_user_id BIGINT UNSIGNED NULL;

-- Unique constraint: (customer_id, salon_id, support_user_id)
-- Một conversation chỉ có EITHER salon_id HOẶC support_user_id
```

### messages Table
Không thay đổi - vẫn sử dụng hiện tại.

## File Structure

### Backend
```
app/controllers/ChatController.php
- startConversation() - Hỗ trợ cả salon_id và support
- listConversations() - Liệt kê conversations của user
- getMessages() - Lấy tin nhắn
- sendMessage() - Gửi tin nhắn
```

### Frontend
```
pages/Support/
  ├── SupportChat.tsx        - Main component
  └── SupportChat.module.css - Styling

api/chat.ts                   - API methods

pages/Salon/SalonDetail.tsx   - Thêm button chat

components/SalonDetail.css    - Thêm .chat-btn style
```

## UI/UX Features

### Support Chat Page
- 💬 Header với emoji
- Badge "🎧 Support" cho support conversations
- Gradient background (purple)
- Message bubbles (sent: gradient, received: gray)
- Auto-scroll
- Real-time message count
- Support welcome message

### Salon Detail Page
- "💬 Chat với salon này" button
- Integrated vào salon info section
- Hover effect
- Direct navigation đến support page

## Testing

### Manual Test Steps

1. **Create Support Conversation**
   ```
   POST /api/v1/chats/0/start (salon_id=0 = support)
   Response: New conversation with initial message from Support
   ```

2. **Send Message**
   ```
   POST /api/v1/chats/{conversation_id}/messages
   Body: { "message": "Hello" }
   ```

3. **List Conversations**
   ```
   GET /api/v1/chats/conversations
   Response: List with conversation_type field
   ```

4. **Frontend Flow**
   - Login as customer
   - Browse salons
   - Click "Chat với salon này" on salon detail
   - Should redirect to /support with that conversation selected
   - Should be able to send/receive messages

## Future Improvements

1. **WebSocket** - Thay thế polling bằng WebSocket/SSE cho real-time
2. **Notifications** - Thêm notification khi có tin nhắn mới
3. **Typing Indicators** - Hiển thị "Đang gõ..."
4. **File Upload** - Gửi hình ảnh trong chat
5. **Encryption** - Mã hóa tin nhắn
6. **Search** - Tìm kiếm trong conversations/messages

## Troubleshooting

### Issue: "Support account not found"
- Chạy setup_support.php script lại
- Kiểm tra users table có admin role

### Issue: Chat button không hoạt động
- Kiểm tra API routes trong backend/public/index.php
- Verify authentication token

### Issue: Messages không update real-time
- Kiểm tra polling interval (2-3 giây)
- Xem browser console for errors
- Verify database connection

## Support
Liên hệ: support@haircut.local
