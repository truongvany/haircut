# 📌 **README – Hệ thống đặt lịch cắt tóc Haircut (Full-stack)**

Haircut là một ứng dụng web full-stack giúp khách hàng **đặt lịch cắt tóc**, còn chủ tiệm quản lý **dịch vụ – stylist – lịch làm – đặt lịch – vouchers**, và admin giám sát toàn hệ thống.

Hệ thống hỗ trợ 3 vai trò:

* **Khách hàng**
* **Chủ tiệm (Salon owner)**
* **Quản trị viên (Admin)**

Toàn bộ giao diện và tài liệu trong project này đều được thiết kế theo chuẩn **báo cáo đồ án – dễ cài – dễ demo – dễ chấm**.

---

# 🎯 **1. Chức năng chính**

## 🧑‍💼 Đối với khách hàng

* Đăng ký / đăng nhập bằng JWT
* Xem danh sách salon
* Xem chi tiết salon (dịch vụ, stylist, ảnh, giờ mở cửa)
* Đặt lịch: chọn dịch vụ + stylist + ngày + giờ
* Quản lý lịch hẹn: chờ xác nhận / đã xác nhận / hoàn thành / hủy / vắng mặt
* Thanh toán (demo): tiền mặt / chuyển khoản
* Đánh giá salon sau khi hoàn thành lịch
* Chat trực tiếp với salon
* Xem tin tức / khuyến mại

## 💈 Đối với chủ tiệm (Salon owner)

* Quản lý thông tin salon (tên, mô tả, địa chỉ, ảnh, giờ mở cửa)
* Quản lý dịch vụ: thêm / sửa / bật tắt
* Quản lý stylist
* Thiết lập giờ làm việc của salon & stylist
* Xác nhận / hủy / hoàn thành lịch
* Tạo voucher giảm giá
* Trả lời chat của khách

## 🛠 Đối với admin

* Thống kê hệ thống
* Quản lý người dùng, salon, bookings, payments
* Quản lý tin tức

---

# 🔧 **2. Công nghệ sử dụng**

## Backend (PHP)

* PHP 8+
* Router tự viết (MVC nhẹ)
* MySQL (PDO)
* JWT: `firebase/php-jwt`
* Dotenv: cấu hình môi trường
* PHPMailer
* Migration SQL đầy đủ

## Frontend (React + TypeScript)

* React 18 + Vite
* React Router
* Axios
* LocalStorage auth
* CSS Modules

---

# 🗂 **3. Cấu trúc thư mục chính**

```text
backend/
  app/
    config/        # DB, env, cors
    controllers/   # Auth, Salon, Booking...
    core/          # Router, BaseController
  migrations/      # Schema SQL + seed
  public/          # index.php + /api
  create_admin.php
frontend/
  src/
    api/           # axios client
    pages/
    components/
    hooks/
    store/
```

---

# 🗄 **4. Cơ sở dữ liệu**

Database gồm nhiều bảng:

* roles
* users
* salons
* salon_photos
* stylists
* services
* working_hours
* bookings
* payments
* vouchers
* reviews
* chat_conversations
* chat_messages
* news

File SQL có tại:

```
backend/migrations/
```

---

# ⚙ **5. Hướng dẫn cài đặt – chi tiết (Windows + XAMPP)**

💯 **PHẦN QUAN TRỌNG NHẤT – đảm bảo chạy được 100%**

---

# 🧩 **5.1. Cài backend (PHP + MySQL)**

## **Bước 1 – Giải nén project**

Giải nén project vào:

```
C:\xampp\htdocs\haircut
```

Sau giải nén bạn phải có:

```
C:\xampp\htdocs\haircut\backend
C:\xampp\htdocs\haircut\frontend
```

---

## **Bước 2 – Cài Composer**

Tải composer: [https://getcomposer.org/Composer-Setup.exe](https://getcomposer.org/Composer-Setup.exe)

Chạy:

```bash
cd C:\xampp\htdocs\haircut\backend
composer install
```

---

## **Bước 3 – Tạo file .env**

Copy file mẫu:

```
backend/.env.example  →  backend/.env
```

Chỉnh theo XAMPP:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=haircut_dev
DB_USER=root
DB_PASS=
APP_URL=http://localhost/haircut/backend/public
TIMEZONE=Asia/Ho_Chi_Minh
```

---

## **Bước 4 – Tạo database**

Mở phpMyAdmin → tạo DB:

```
haircut_dev
```

Sau đó import từng file:

```
backend/migrations/schema_haircut.sql
backend/migrations/create_chat_tables.sql
backend/migrations/create_news_table.sql
backend/migrations/add_bank_transfer_method.sql
backend/migrations/update_chat_support.sql
backend/migrations/seed.sql
```

---

## **Bước 5 – Tạo tài khoản admin nhanh**

```bash
php backend/create_admin.php
```

Output sẽ tạo admin như:

```
Email: AtomicY@haircut.test
Mật khẩu: admin123
```

Bạn có thể vào file để đổi.

---

## **Bước 6 – Chạy backend**

### ✔ Cách 1 (chuẩn nhất) – chạy bằng Apache

URL backend:

```
http://localhost/haircut/backend/public
```

URL API:

```
http://localhost/haircut/backend/public/api
```

### ✔ Cách 2 – chạy bằng built-in PHP (không khuyến nghị)

```bash
cd backend/public
php -S localhost:8080
```

---

# 🌐 **5.2. Cài frontend (React + Vite)**

```bash
cd C:\xampp\htdocs\haircut\frontend
npm install
```

Tạo file:

```
frontend/.env
```

Nội dung:

```
VITE_API_URL=http://localhost/haircut/backend/public/api
```

Chạy:

```bash
npm run dev
```

Truy cập:

```
http://localhost:5173
```

---

# 🩺 **6. Kiểm tra backend**

Truy cập:

```
http://localhost/haircut/backend/public/api/v1/health
```

Nếu ra JSON:

```
{ "status": "OK" }
```

→ Backend OK.

---

# 🧭 **7. API chính**

* `/auth/register`
* `/auth/login`
* `/me`
* `/salons`
* `/salons/{id}`
* `/salons/{id}/services`
* `/salons/{id}/stylists`
* `/bookings`
* `/bookings/mine`
* `/payments`
* `/reviews`
* `/vouchers`
* `/chats`
* `/admin/...`
* `/news`

---

# 🚀 **8. Gợi ý hướng phát triển tương lai**

* Đa ngôn ngữ (VI/EN)
* Tích hợp cổng thanh toán VNPay/MoMo
* Upload ảnh lên Cloud (Cloudinary/S3)
* Push notification
* Realtime chat bằng WebSocket

---

# 🏁 **9. Tác giả**

**Trương Văn Ý – 23CNTT2 – Đại học Sư phạm – ĐH Đà Nẵng**

---
