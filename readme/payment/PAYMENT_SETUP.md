# 🎯 Hướng Dẫn Cài Đặt & Sử Dụng Hệ Thống Thanh Toán

## ✅ Điều Kiện Tiên Quyết

- Backend API đã chạy (PHP/Apache)
- Frontend React đã cấu hình
- Database với bảng `payments` đã tạo sẵn (checked ✓)
- JWT Authentication đã hoạt động

## 🔧 Bước 1: Backend Setup

Hệ thống thanh toán đã được thêm vào backend:

### Files thêm/sửa:
1. ✅ `backend/app/controllers/PaymentController.php` - NEW
2. ✅ `backend/public/index.php` - UPDATE (5 routes thêm)

### Routes đã thêm:
```php
POST   /api/v1/payments                  // Tạo thanh toán
GET    /api/v1/payments                  // Danh sách thanh toán
GET    /api/v1/payments/{id}             // Chi tiết thanh toán
POST   /api/v1/payments/{id}/confirm     // Xác nhận thanh toán
GET    /api/v1/bookings/{id}/payment     // Lấy payment của booking
```

**Không cần làm gì thêm** - Controllers đã sẵn sàng!

---

## 🎨 Bước 2: Frontend Setup

### Files thêm:
1. ✅ `frontend/src/api/payments.ts` - NEW (TypeScript API)
2. ✅ `frontend/src/components/PaymentForm.tsx` - NEW (Component)
3. ✅ `frontend/src/components/PaymentForm.module.css` - NEW (CSS)
4. ✅ `frontend/src/components/PaymentSuccess.tsx` - NEW (Component)
5. ✅ `frontend/src/components/PaymentSuccess.module.css` - NEW (CSS)
6. ✅ `frontend/src/components/PaymentHistory.css` - NEW (CSS)
7. ✅ `frontend/src/pages/PaymentPage.tsx` - NEW (Page)
8. ✅ `frontend/src/pages/NewBooking.tsx` - UPDATE (Payment integration)

### Điều chỉnh (nếu cần):

**1. NewBooking imports** - ✅ Already updated

```typescript
import PaymentForm from '../components/PaymentForm';
import PaymentSuccess from '../components/PaymentSuccess';
import type { PaymentMethod } from '../components/PaymentForm';
import { createPayment, confirmPayment } from '../api/payments';
```

**2. Cập nhật routes (App.tsx hoặc Router)**

```typescript
import PaymentPage from './pages/PaymentPage';

// Thêm route
<Route path="/payments" element={<PaymentPage />} />
```

---

## 🧪 Bước 3: Testing

### Test Payment Creation

```bash
# Terminal - Test backend API
curl -X POST http://localhost/haircut/backend/public/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "booking_id": 1,
    "method": "cash"
  }'
```

### Expected Response:
```json
{
  "payment_id": 1,
  "booking_id": 1,
  "method": "cash",
  "amount": 500000,
  "status": "init",
  "message": "Payment initialized successfully"
}
```

### Test in Frontend

1. Mở ứng dụng React
2. Navigate to `/new-booking`
3. Fill form: Salon → Services → Time
4. Click "Xác nhận đặt lịch"
5. Payment form sẽ hiển thị
6. Chọn phương thức (Cash hoặc Bank Transfer)
7. Click "Xác Nhận Thanh Toán"
8. Success page sẽ hiển thị ✓

---

## 📱 Features

### ✨ PaymentForm Component
- 💵 2 payment methods: Cash & Bank Transfer
- 📊 Display amount cần thanh toán
- 🎯 Radio button selection
- ⚡ Smooth animations
- 📱 Fully responsive
- ♿ Accessibility support

### ✨ PaymentSuccess Component
- ✓ Success confirmation with animation
- 📋 Transaction details
- 🏦 Bank transfer instructions (khi chọn bank transfer)
- 📍 Next steps guidance
- 🎯 Call-to-action button

### ✨ PaymentPage Component
- 📊 Payment history list
- 🔍 Filter by status (All, Paid, Pending, Failed)
- 💳 Beautiful card layout
- 📱 Mobile responsive
- 🎨 Gradient styling

---

## 🔐 Security Features

✅ **JWT Authentication**
- Tất cả requests yêu cầu Bearer token
- Auth::user() verify trong backend

✅ **Ownership Verification**
- Check booking belongs to user
- Prevent unauthorized access

✅ **Input Validation**
- booking_id validation
- payment method validation
- amount verification

✅ **SQL Injection Protection**
- Prepared statements
- PDO binding

✅ **Duplicate Prevention**
- Check existing payment
- Prevent double charges

---

## 💡 Usage Examples

### Tạo Payment (Frontend)

```typescript
import { createPayment } from '../api/payments';

const handlePayment = async (bookingId: number, method: 'cash' | 'bank_transfer') => {
  try {
    const response = await createPayment(bookingId, method);
    console.log('Payment created:', response.payment_id);
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

### Confirm Payment

```typescript
import { confirmPayment } from '../api/payments';

const handleConfirm = async (paymentId: number) => {
  try {
    const response = await confirmPayment(paymentId);
    console.log('Payment confirmed:', response.status); // 'paid'
  } catch (error) {
    console.error('Confirmation failed:', error);
  }
};
```

### List Payments

```typescript
import { listPayments } from '../api/payments';

const handleListPayments = async () => {
  try {
    const { items } = await listPayments();
    console.log('Payments:', items);
  } catch (error) {
    console.error('Failed to list:', error);
  }
};
```

---

## 🎯 Integration Checklist

- [ ] Database `payments` table exists
- [ ] PaymentController.php deployed
- [ ] Routes added to index.php
- [ ] Frontend components imported
- [ ] Payment routes added to app router
- [ ] API payments.ts created
- [ ] NewBooking.tsx updated
- [ ] PaymentPage route added
- [ ] Test cash payment flow
- [ ] Test bank transfer flow
- [ ] Verify error handling
- [ ] Check mobile responsiveness

---

## 🚀 Deployment Checklist

**Backend:**
- [ ] PaymentController.php in `app/controllers/`
- [ ] Routes in `public/index.php`
- [ ] No PHP syntax errors
- [ ] Database migrations completed

**Frontend:**
- [ ] All imports resolved
- [ ] No TypeScript errors
- [ ] CSS files imported
- [ ] Components used in pages
- [ ] Routes configured
- [ ] API URLs correct

**Testing:**
- [ ] Backend API responds correctly
- [ ] Frontend loads payment form
- [ ] Can create payments
- [ ] Can confirm payments
- [ ] Can list payments
- [ ] Error messages display
- [ ] Mobile view works

---

## 🔍 Troubleshooting

### Payment Form doesn't show
- [ ] Check NewBooking.tsx has PaymentForm import
- [ ] Verify `showPaymentForm` state is true
- [ ] Check browser console for errors

### API returns 401 Unauthorized
- [ ] Verify JWT token is valid
- [ ] Check Authorization header is sent
- [ ] Ensure user is logged in

### Payment creation fails
- [ ] Verify booking_id is valid
- [ ] Check method is 'cash' or 'bank_transfer'
- [ ] Ensure booking belongs to current user

### Styling issues
- [ ] Verify CSS files are imported
- [ ] Check module.css file names
- [ ] Clear browser cache

---

## 📞 Support

Nếu có vấn đề:
1. Check browser DevTools Console
2. Check Network tab for API calls
3. Verify database records in `payments` table
4. Check backend logs (if available)
5. Review error messages in response

---

## 🎓 Next Steps (Optional)

1. **Add Real Payment Gateway**
   - Integrate Stripe
   - Integrate PayPal
   - Integrate VN Pay

2. **Advanced Features**
   - Payment schedule/recurring
   - Refunds
   - Invoices
   - Payment analytics

3. **Notifications**
   - Email receipts
   - SMS confirmation
   - Push notifications

4. **Admin Dashboard**
   - Payment analytics
   - Transaction history
   - Refund management

---

**✅ Hệ thống thanh toán đã sẵn sàng sử dụng!**

Bạn có thể ngay lập tức:
1. Đặt lịch → Chọn phương thức thanh toán → Xác nhận ✓
2. Xem lịch sử thanh toán
3. Track trạng thái các giao dịch

Enjoy! 🚀
