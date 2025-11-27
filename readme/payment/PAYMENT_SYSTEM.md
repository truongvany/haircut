# 💳 Hệ Thống Thanh Toán - Payment System Documentation

## 📋 Tổng Quan (Overview)

Hệ thống thanh toán của Haircut Booking hỗ trợ hai phương thức thanh toán chính:

1. **💵 Thanh Toán Tiền Mặt (Cash)** - Thanh toán khi đến salon
2. **🏦 Chuyển Khoản Ngân Hàng (Bank Transfer)** - Thanh toán trực tuyến qua ngân hàng

---

## 🗄️ Cơ Sở Dữ Liệu (Database)

### Bảng `payments`
```sql
CREATE TABLE payments (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id    BIGINT UNSIGNED NOT NULL,
  method        ENUM('cash','vn_pay','momo') NOT NULL,
  status        ENUM('init','paid','failed','refunded') NOT NULL DEFAULT 'init',
  amount        INT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Trạng Thái Thanh Toán (Payment Status)
- **init** - Thanh toán mới được tạo, chờ xác nhận
- **paid** - Thanh toán thành công, xác nhận rồi
- **failed** - Thanh toán thất bại
- **refunded** - Hoàn tiền

### Phương Thức Thanh Toán (Payment Methods)
- **cash** - Tiền mặt
- **vn_pay** - Cổng VN Pay (có thể mở rộng sau)
- **momo** - Mobile Money (có thể mở rộng sau)

---

## 🔌 API Endpoints

### Backend Routes (PHP)

#### 1. Tạo thanh toán mới
```http
POST /api/v1/payments
Content-Type: application/json

{
  "booking_id": 1,
  "method": "cash" | "bank_transfer"
}

Response:
{
  "payment_id": 1,
  "booking_id": 1,
  "method": "cash",
  "amount": 500000,
  "status": "init",
  "message": "Payment initialized successfully"
}
```

#### 2. Lấy thông tin thanh toán
```http
GET /api/v1/payments/{id}

Response:
{
  "payment_id": 1,
  "booking_id": 1,
  "method": "cash",
  "status": "init",
  "amount": 500000,
  "created_at": "2025-11-12 10:00:00",
  "updated_at": "2025-11-12 10:00:00"
}
```

#### 3. Xác nhận thanh toán
```http
POST /api/v1/payments/{id}/confirm

Response:
{
  "message": "Payment confirmed successfully",
  "payment_id": 1,
  "status": "paid"
}
```

#### 4. Lấy thanh toán của booking
```http
GET /api/v1/bookings/{id}/payment

Response:
{
  "has_payment": true,
  "payment_id": 1,
  "booking_id": 1,
  "method": "cash",
  "status": "init",
  "amount": 500000,
  "created_at": "2025-11-12 10:00:00",
  "updated_at": "2025-11-12 10:00:00"
}
```

#### 5. Danh sách thanh toán
```http
GET /api/v1/payments?booking_id=1

Response:
{
  "items": [
    {
      "payment_id": 1,
      "booking_id": 1,
      "method": "cash",
      "status": "paid",
      "amount": 500000,
      "salon_name": "Salon ABC",
      "created_at": "2025-11-12 10:00:00",
      "updated_at": "2025-11-12 10:00:00"
    }
  ]
}
```

---

## 🎨 Frontend Components

### 1. PaymentForm Component
**File**: `src/components/PaymentForm.tsx`

Hiển thị form chọn phương thức thanh toán với 2 lựa chọn:
- 💵 Tiền mặt (Cash)
- 🏦 Chuyển khoản (Bank Transfer)

**Props**:
```typescript
interface PaymentFormProps {
  amount: number;              // Số tiền cần thanh toán
  bookingId: number;           // ID của lịch hẹn
  onSubmit: (method: PaymentMethod) => Promise<void>;  // Callback khi submit
  onCancel: () => void;        // Callback khi hủy
  isLoading?: boolean;         // Trạng thái loading
}
```

**Features**:
- ✨ Giao diện đẹp với gradient colors
- 🎯 Chọn phương thức bằng radio button
- 📱 Responsive trên mobile
- ⚡ Smooth animations

### 2. PaymentSuccess Component
**File**: `src/components/PaymentSuccess.tsx`

Hiển thị thông báo thanh toán thành công với:
- ✓ Checkmark animation
- 💳 Chi tiết giao dịch
- 📋 Hướng dẫn thanh toán (dành cho chuyển khoản)
- 📍 Các bước tiếp theo

**Props**:
```typescript
interface PaymentSuccessProps {
  bookingId: number;
  amount: number;
  method: 'cash' | 'bank_transfer';
  onContinue: () => void;
}
```

### 3. PaymentPage Component
**File**: `src/pages/PaymentPage.tsx`

Trang hiển thị lịch sử thanh toán với:
- 🔍 Bộ lọc theo trạng thái (Tất cả, Đã thanh toán, Chờ thanh toán, Thất bại)
- 📊 Grid view của các giao dịch
- 📱 Responsive design

---

## 🔄 Luồng Thanh Toán (Payment Flow)

```
1. Người dùng đặt lịch
   ↓
2. Nhấn "Xác nhận đặt lịch"
   ↓
3. Hệ thống tạo booking thành công
   ↓
4. Hiển thị form chọn phương thức thanh toán (PaymentForm)
   ↓
5a. Nếu chọn "Tiền mặt"          | 5b. Nếu chọn "Chuyển khoản"
   ↓                              ↓
6a. Tạo payment record (init)    6b. Tạo payment record (init)
   ↓                              ↓
7a. Xác nhận thanh toán (paid)   7b. Hiển thị hướng dẫn chuyển khoản
   ↓                              ↓
8a. Hiển thị success page        8b. Xác nhận thanh toán (paid)
   ↓                              ↓
9. Chuyển tới BookingHistory     9. Hiển thị success page
                                  ↓
                                 10. Chuyển tới BookingHistory
```

---

## 📱 Quy Trình Sử Dụng (User Journey)

### Thanh Toán Tiền Mặt (Cash)
1. Đặt lịch
2. Chọn "Tiền mặt"
3. Xác nhận
4. Nhận thông báo thành công
5. Thanh toán khi đến salon

### Thanh Toán Chuyển Khoản (Bank Transfer)
1. Đặt lịch
2. Chọn "Chuyển khoản"
3. Nhận thông tin ngân hàng (Số TK, tên ngân hàng, etc.)
4. Chuyển khoản theo hướng dẫn
5. Xác nhận trong ứng dụng
6. Nhận xác nhận thành công

---

## 🛠️ Backend Implementation

### PaymentController.php

**Các phương thức chính**:

1. **create()** - Tạo thanh toán mới
   - Verify booking exists
   - Check duplicate payment
   - Insert payment record

2. **getById($params)** - Lấy chi tiết thanh toán
   - Verify ownership
   - Return payment data

3. **confirm($params)** - Xác nhận thanh toán
   - Update status to 'paid'
   - Check if already confirmed

4. **getByBookingId($params)** - Lấy thanh toán của booking
   - Return latest payment for booking

5. **list()** - Danh sách thanh toán
   - Filter by user
   - Optional filter by booking_id

---

## 🔐 Bảo Mật (Security)

- ✅ JWT Authentication trên tất cả endpoints
- ✅ Verify booking ownership
- ✅ Prevent duplicate payments
- ✅ Amount validation
- ✅ SQL Injection protection (prepared statements)

---

## 🚀 Mở Rộng (Future Enhancements)

1. **Integrate Stripe/PayPal**
   - Add new payment methods
   - Support card payments
   - Webhook handling

2. **VN Pay Integration**
   - Support Vietnamese payment gateway
   - Real-time transaction status

3. **Momo Payment**
   - Mobile money support
   - Quick payment process

4. **Payment Refunds**
   - Refund policy management
   - Automated refund processing

5. **Invoice Generation**
   - Generate PDF invoices
   - Email receipts

6. **Analytics Dashboard**
   - Payment statistics
   - Revenue charts
   - Transaction history

---

## 📚 API Usage Examples

### Frontend (TypeScript/React)

```typescript
import { createPayment, confirmPayment, listPayments } from '../api/payments';

// Create payment
const payment = await createPayment(bookingId, 'cash');
console.log(payment.payment_id); // 1

// Confirm payment
const result = await confirmPayment(payment.payment_id);
console.log(result.status); // 'paid'

// List payments
const { items } = await listPayments();
console.log(items); // Array of payments
```

### cURL Examples

```bash
# Create payment
curl -X POST http://localhost/haircut/backend/public/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "booking_id": 1,
    "method": "cash"
  }'

# Get payment
curl -X GET http://localhost/haircut/backend/public/api/v1/payments/1 \
  -H "Authorization: Bearer TOKEN"

# Confirm payment
curl -X POST http://localhost/haircut/backend/public/api/v1/payments/1/confirm \
  -H "Authorization: Bearer TOKEN"

# List payments
curl -X GET http://localhost/haircut/backend/public/api/v1/payments \
  -H "Authorization: Bearer TOKEN"
```

---

## ✅ Testing Checklist

- [ ] Create payment with cash method
- [ ] Create payment with bank_transfer method
- [ ] Confirm payment status update
- [ ] Verify payment ownership (security)
- [ ] Test duplicate payment prevention
- [ ] Test invalid booking ID
- [ ] Test payment list with filters
- [ ] Test mobile responsiveness
- [ ] Test form validation
- [ ] Test error handling

---

## 📝 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── PaymentForm.tsx              (Component)
│   │   ├── PaymentForm.module.css       (Styling)
│   │   ├── PaymentSuccess.tsx           (Component)
│   │   ├── PaymentSuccess.module.css    (Styling)
│   │   └── PaymentHistory.css           (Styling)
│   ├── pages/
│   │   ├── NewBooking.tsx               (Updated with payment)
│   │   └── PaymentPage.tsx              (Payment history)
│   └── api/
│       └── payments.ts                  (API functions)

backend/
├── app/
│   └── controllers/
│       └── PaymentController.php        (Backend logic)
└── public/
    └── index.php                        (Routes added)
```

---

## 🎯 Kết Luận

Hệ thống thanh toán được thiết kế với:
- ✨ Giao diện người dùng đẹp, trực quan
- 🔒 Bảo mật cao
- 📱 Mobile-friendly
- 🚀 Dễ mở rộng với các cổng thanh toán khác
- 🎨 Consistent branding và styling
- 💪 Robust error handling

Bạn có thể bắt đầu sử dụng hệ thống ngay và mở rộng tính năng khi cần!

