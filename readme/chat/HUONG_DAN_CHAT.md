# 💬 HƯỚNG DẪN SỬ DỤNG CHAT - CỰC KỲ ĐỠN GIẢN!

## 🎉 HỆ THỐNG ĐÃ SẴN SÀNG 100%!

Tất cả đã được tích hợp sẵn vào hệ thống. Bạn **KHÔNG CẦN** cài đặt gì thêm!

---

## 🚀 CÁCH SỬ DỤNG (3 BƯỚC)

### **BƯỚC 1: Mở trình duyệt**
```
http://localhost:5173
```

### **BƯỚC 2: Đăng nhập**
- Đăng nhập bằng tài khoản của bạn (customer hoặc salon owner)

### **BƯỚC 3: Click "Hỗ trợ"**
- Nhìn lên thanh menu phía trên
- Click vào nút **"Hỗ trợ"**
- XONG! Trang chat đã mở! 🎉

---

## 💬 CÁCH CHAT

### **Nếu bạn là KHÁCH HÀNG (Customer):**

1. Bạn sẽ thấy danh sách các salon
2. Click vào salon bạn muốn chat
3. Gõ tin nhắn vào ô bên dưới
4. Nhấn Enter hoặc click nút "Gửi"
5. Tin nhắn xuất hiện ngay! ✨

### **Nếu bạn là CHỦ SALON (Salon Owner):**

1. Bạn sẽ thấy danh sách khách hàng đã chat với bạn
2. Click vào tên khách hàng
3. Đọc tin nhắn và trả lời
4. Gõ tin nhắn vào ô bên dưới
5. Nhấn Enter hoặc click "Gửi"
6. Khách hàng sẽ nhận được tin nhắn trong vòng 3 giây! ⚡

---

## 🎨 GIAO DIỆN

Bạn sẽ thấy:

```
┌─────────────────────────────────────────────────┐
│  💬 Hỗ trợ khách hàng                           │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│ Danh sách    │  Cửa sổ chat                    │
│ cuộc trò     │                                  │
│ chuyện       │  Tin nhắn hiển thị ở đây         │
│              │                                  │
│ 🏪 Salon ABC │  👤 Bạn: Xin chào!               │
│ 5 phút trước │                                  │
│              │  👤 Salon: Chào bạn!             │
│ 💇 Salon XYZ │                                  │
│ 1 giờ trước  │  [Nhập tin nhắn...] [Gửi]       │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

**Đặc điểm:**
- 🎨 Màu tím gradient đẹp mắt
- 💬 Tin nhắn của bạn: màu tím, bên phải
- 💬 Tin nhắn người khác: màu trắng, bên trái
- 👤 Avatar hiển thị chữ cái đầu tên
- ⏰ Thời gian: "Vừa xong", "5 phút trước", "1 giờ trước"
- 📱 Hoạt động tốt trên điện thoại

---

## ✨ TÍNH NĂNG

✅ **Real-time** - Tin nhắn tự động cập nhật mỗi 3 giây  
✅ **Lịch sử** - Xem lại tất cả tin nhắn cũ  
✅ **Nhiều cuộc trò chuyện** - Chat với nhiều salon/khách hàng  
✅ **Thời gian** - Biết tin nhắn gửi lúc nào  
✅ **Avatar** - Nhận diện người gửi dễ dàng  
✅ **Responsive** - Dùng được trên mọi thiết bị  

---

## 🔥 TEST CHAT 2 CHIỀU

Muốn test chat giữa customer và salon?

### **Cách 1: Dùng 2 trình duyệt**
1. Trình duyệt thường: Đăng nhập customer
2. Trình duyệt ẩn danh (Ctrl+Shift+N): Đăng nhập salon
3. Chat qua lại!

### **Cách 2: Dùng 2 thiết bị**
1. Máy tính: Đăng nhập customer
2. Điện thoại: Đăng nhập salon
3. Chat qua lại!

---

## ❓ CÂU HỎI THƯỜNG GẶP

### **Q: Tôi không thấy nút "Hỗ trợ"?**
A: Bạn cần đăng nhập trước. Nút "Hỗ trợ" chỉ hiện khi đã login.

### **Q: Tôi không thấy salon nào?**
A: Đảm bảo database có dữ liệu salon. Chạy lệnh:
```sql
SELECT * FROM salons;
```

### **Q: Tin nhắn không gửi được?**
A: 
1. Kiểm tra đã đăng nhập chưa
2. Mở Console (F12) xem có lỗi không
3. Thử logout và login lại

### **Q: Tin nhắn không tự động cập nhật?**
A: Đợi 3 giây. Hệ thống tự động kiểm tra tin nhắn mới mỗi 3 giây.

### **Q: Lỗi 401 Unauthorized?**
A: Token hết hạn. Logout và login lại.

---

## 🎯 ĐƯỜNG DẪN NHANH

- **Trang chủ:** http://localhost:5173
- **Trang chat:** http://localhost:5173/support
- **Đăng nhập:** http://localhost:5173/login

---

## 📊 THÔNG TIN KỸ THUẬT

### **Đã tích hợp:**
✅ Database: 3 tables (conversations, messages, message_reads)  
✅ Backend: 7 API endpoints  
✅ Frontend: Component SupportChatPage  
✅ Router: Route /support  
✅ Navigation: Link "Hỗ trợ" trên header  

### **Không cần:**
❌ Cài đặt thêm package  
❌ Chạy migration thủ công (đã chạy rồi)  
❌ Cấu hình thêm  
❌ Restart server  

---

## 🎉 KẾT LUẬN

**HỆ THỐNG ĐÃ SẴN SÀNG!**

Chỉ cần:
1. Mở http://localhost:5173
2. Đăng nhập
3. Click "Hỗ trợ"
4. Bắt đầu chat!

**ĐƠN GIẢN VẬY THÔI!** 🚀💬

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Đọc file **TEST_CHAT_NOW.md** để biết cách troubleshoot
2. Đọc file **CHAT_QUICK_START.md** để biết chi tiết kỹ thuật
3. Đọc file **CHAT_SYSTEM_GUIDE.md** để hiểu toàn bộ hệ thống

---

**CHÚC BẠN CHAT VUI VẺ! 💬✨**

