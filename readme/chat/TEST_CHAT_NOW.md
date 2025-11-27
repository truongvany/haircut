# 🚀 TEST CHAT NGAY BÂY GIỜ!

## ✅ Hệ thống đã sẵn sàng 100%

### **Đã tích hợp:**
- ✅ Database tables (conversations, messages, message_reads)
- ✅ Backend API (7 endpoints trong ChatController.php)
- ✅ Frontend routes (đã có trong App.tsx)
- ✅ Navigation link (nút "Hỗ trợ" trên header)
- ✅ API client (chats.ts)
- ✅ UI Component (SupportChatPage.tsx)

---

## 🎯 CÁCH TEST (3 BƯỚC ĐƠN GIẢN)

### **Bước 1: Mở trình duyệt**
```
http://localhost/haircut/frontend/
```
hoặc
```
http://localhost:5173
```
(tùy theo bạn đang chạy dev server hay build)

### **Bước 2: Đăng nhập**

**Option A - Đăng nhập Customer:**
- Email: customer@test.com (hoặc tài khoản customer của bạn)
- Password: (mật khẩu của bạn)

**Option B - Đăng nhập Salon Owner:**
- Email: salon@test.com (hoặc tài khoản salon của bạn)
- Password: (mật khẩu của bạn)

### **Bước 3: Click vào "Hỗ trợ"**
- Nhìn lên header, click vào link **"Hỗ trợ"**
- Trang chat sẽ mở ra!

---

## 💬 CÁCH SỬ DỤNG

### **Nếu bạn là CUSTOMER:**
1. Bạn sẽ thấy danh sách các salon
2. Click vào một salon để bắt đầu chat
3. Gõ tin nhắn và nhấn Enter hoặc click "Gửi"
4. Tin nhắn sẽ xuất hiện ngay lập tức!

### **Nếu bạn là SALON OWNER:**
1. Bạn sẽ thấy danh sách các cuộc trò chuyện với khách hàng
2. Click vào một cuộc trò chuyện
3. Gõ tin nhắn để trả lời khách hàng
4. Tin nhắn sẽ được gửi real-time!

---

## 🔥 TEST REAL-TIME (2 CỬA SỔ)

### **Cách test chat 2 chiều:**

1. **Cửa sổ 1 - Customer:**
   - Mở trình duyệt thường
   - Đăng nhập customer
   - Vào `/support`
   - Chọn một salon
   - Gửi tin nhắn: "Xin chào, tôi muốn đặt lịch"

2. **Cửa sổ 2 - Salon Owner:**
   - Mở trình duyệt ẩn danh (Ctrl+Shift+N)
   - Đăng nhập salon owner
   - Vào `/support`
   - Bạn sẽ thấy tin nhắn từ customer trong vòng 3 giây!
   - Trả lời: "Chào bạn! Bạn muốn đặt lịch lúc nào?"

3. **Quay lại cửa sổ 1:**
   - Tin nhắn từ salon sẽ xuất hiện tự động!

---

## 🎨 GIAO DIỆN

Bạn sẽ thấy:
- 🎨 **Gradient tím đẹp mắt**
- 💬 **Message bubbles** (tin nhắn gửi/nhận khác màu)
- 👤 **Avatar** với chữ cái đầu tên
- ⏰ **Thời gian** ("5 phút trước", "Vừa xong")
- 📱 **Responsive** (hoạt động tốt trên mobile)
- ✨ **Animation mượt mà**

---

## ❓ NẾU KHÔNG THẤY GÌ?

### **Kiểm tra:**

1. **Database có tables chưa?**
   ```bash
   php backend/scripts/setup_chat.php
   ```
   Phải thấy:
   ```
   ✅ Table: conversations (6 columns)
   ✅ Table: messages (5 columns)
   ✅ Table: message_reads (4 columns)
   ```

2. **Frontend dev server đang chạy?**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Backend server đang chạy?**
   - XAMPP Apache phải đang chạy
   - MySQL phải đang chạy

4. **Đã đăng nhập chưa?**
   - Phải đăng nhập mới vào được `/support`

---

## 🐛 TROUBLESHOOTING

### **Lỗi 404 Not Found:**
- Kiểm tra backend routes đã có chưa
- File: `backend/public/index.php`
- Phải có 7 routes chat (dòng 77-83)

### **Không thấy salon nào:**
- Đảm bảo database có dữ liệu salon
- Chạy: `SELECT * FROM salons;`

### **Tin nhắn không gửi được:**
- Mở Console (F12)
- Xem tab Network
- Kiểm tra API response
- Có thể là JWT token hết hạn → Đăng nhập lại

### **401 Unauthorized:**
- Token hết hạn (24 giờ)
- Logout và login lại
- Clear localStorage: `localStorage.clear()`

---

## 📊 KIỂM TRA API TRỰC TIẾP

### **Test bằng Postman/Thunder Client:**

1. **Get JWT Token:**
   ```
   POST http://localhost/haircut/backend/public/api/v1/auth/login
   Body: {"email": "customer@test.com", "password": "yourpass"}
   ```

2. **List Conversations:**
   ```
   GET http://localhost/haircut/backend/public/api/v1/chats/conversations
   Headers: Authorization: Bearer YOUR_TOKEN
   ```

3. **Start Conversation:**
   ```
   POST http://localhost/haircut/backend/public/api/v1/chats/1/start
   Headers: Authorization: Bearer YOUR_TOKEN
   ```

---

## ✅ CHECKLIST

- [ ] Database tables đã tạo
- [ ] XAMPP đang chạy
- [ ] Frontend dev server đang chạy
- [ ] Đã đăng nhập
- [ ] Click vào "Hỗ trợ" trên header
- [ ] Thấy giao diện chat
- [ ] Có thể chọn salon (customer) hoặc thấy conversations (salon)
- [ ] Gửi tin nhắn thành công
- [ ] Tin nhắn hiển thị trong chat
- [ ] Test với 2 cửa sổ (customer + salon)
- [ ] Tin nhắn real-time (3 giây)

---

## 🎉 KẾT QUẢ MONG ĐỢI

Khi test thành công, bạn sẽ thấy:

```
┌─────────────────────────────────────────────────┐
│  💬 Hỗ trợ khách hàng                           │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│ Cuộc trò     │  Chat với Salon ABC              │
│ chuyện       │  ────────────────────────────    │
│              │                                  │
│ 🏪 Salon ABC │  👤 Bạn: Xin chào!               │
│ Vừa xong     │     Vừa xong                     │
│              │                                  │
│              │  👤 Salon: Chào bạn!             │
│              │     Vừa xong                     │
│              │                                  │
│              │  ────────────────────────────    │
│              │  [Nhập tin nhắn...] [Gửi]       │
└──────────────┴──────────────────────────────────┘
```

---

## 🚀 ĐƯỜNG DẪN NHANH

- **Frontend:** http://localhost:5173
- **Chat Page:** http://localhost:5173/support
- **Backend API:** http://localhost/haircut/backend/public/api/v1/chats/
- **phpMyAdmin:** http://localhost/phpmyadmin

---

## 📞 CẦN TRỢ GIÚP?

Nếu gặp vấn đề:
1. Chụp màn hình lỗi
2. Mở Console (F12) → Tab Console
3. Mở Console (F12) → Tab Network
4. Gửi cho tôi thông tin lỗi

---

**HÃY THỬ NGAY! 🚀💬**

Hệ thống đã sẵn sàng 100%, chỉ cần mở trình duyệt và test thôi!

