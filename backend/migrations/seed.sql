USE haircut_dev;

-- ROLES
INSERT INTO roles(name, description)
VALUES ('admin','Quản trị'),('salon','Chủ tiệm'),('customer','Khách hàng');

-- USERS
INSERT INTO users(role_id, full_name, email, phone, password_hash)
VALUES
  (2,'Salon Owner','owner@haircut.test','0900000000','$2y$10$hashdemo'),
  (3,'Nguyen Van A','customer@haircut.test','0900000001','$2y$10$hashdemo');

-- SALON + PHOTO
INSERT INTO salons(owner_user_id, name, slug, description, phone, email, address_text, latitude, longitude, open_time, close_time, status)
VALUES
  (1,'HC District 1','hc-d1','Tiệm mẫu Quận 1','0900000000','hc.d1@test.local','123 Le Loi, Q1, HCMC',10.775,106.700,'09:00','21:00','published');

INSERT INTO salon_photos(salon_id, url, caption, is_cover)
VALUES (1,'/uploads/salons/hc-d1-cover.jpg','Mặt tiền',1);

-- STYLISTS
INSERT INTO stylists(salon_id, full_name, bio, specialties, rating_avg, rating_count)
VALUES
  (1,'Tran B','Thế mạnh tóc nam','["nam","uốn"]',4.6,12),
  (1,'Le C','Kinh nghiệm nhuộm','["nhuộm","tạo kiểu"]',4.7,20);

-- SERVICES
INSERT INTO services(salon_id, name, slug, category, duration_min, base_price, description)
VALUES
  (1,'Cắt nam basic','cat-nam-basic','cat',30,80000,'Gội và cắt nam'),
  (1,'Uốn setting','uon-setting','uốn',120,800000,'Uốn công nghệ');

-- HOURS & HOLIDAYS
INSERT INTO working_hours(salon_id, weekday, start_time, end_time)
VALUES
  (1,1,'09:00','21:00'),(1,2,'09:00','21:00'),(1,3,'09:00','21:00'),
  (1,4,'09:00','21:00'),(1,5,'09:00','21:00'),(1,6,'09:00','21:00');

-- Nghỉ toàn tiệm một ngày
INSERT INTO holidays(salon_id, stylist_id, off_date, reason)
VALUES (1, NULL, '2025-10-25', 'Bảo trì');

-- PROMOTIONS & VOUCHERS
INSERT INTO promotions(salon_id, title, content, discount_pct, start_at, end_at, active)
VALUES (1,'Tuần lễ giảm 20%','Áp dụng dịch vụ uốn','20.00','2025-10-01 00:00:00','2025-10-31 23:59:59',1);

INSERT INTO vouchers(salon_id, code, description, discount_amt, min_order_amt, start_at, end_at, active)
VALUES (1,'HC100K','Giảm 100k cho đơn từ 300k',100000,300000,'2025-10-01 00:00:00','2025-12-31 23:59:59',1);

-- BOOKING DEMO
INSERT INTO bookings(customer_id, salon_id, stylist_id, appointment_at, total_minutes, subtotal_amt, discount_amt, total_amt, status, voucher_id, note)
VALUES (2,1,1,'2025-10-20 10:00:00',30,80000,0,80000,'confirmed',NULL,'Khách test');

INSERT INTO booking_services(booking_id, service_id, unit_price, duration_min, quantity)
VALUES (1,1,80000,30,1);

-- PAYMENT DEMO
INSERT INTO payments(booking_id, method, status, amount)
VALUES (1,'cash','paid',80000);

INSERT INTO transactions(payment_id, gateway_txn_id, payload)
VALUES (1,'CASH-LOCAL', JSON_OBJECT('method','cash','note','paid at salon'));

-- REVIEW, FAVORITE, NOTIF
INSERT INTO reviews(booking_id, salon_id, stylist_id, customer_id, rating, comment)
VALUES (1,1,1,2,5,'Cắt đẹp, đúng giờ');

-- yêu thích tiệm
INSERT INTO favorites(customer_id, salon_id) VALUES (2,1);

INSERT INTO notifications(user_id, title, message, link_url)
VALUES (2,'Xác nhận lịch hẹn','Lịch của bạn đã được xác nhận','/frontend/booking/1');
