/* =========================================================
   HAIRCUT DB (MariaDB-compatible)
   Engine: InnoDB, Charset: utf8mb4, TZ +07:00
========================================================= */

-- A. RESET
DROP DATABASE IF EXISTS haircut_dev;
CREATE DATABASE haircut_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE haircut_dev;

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- B. ROLES & USERS
CREATE TABLE roles (
  id           TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(50) NOT NULL UNIQUE,
  description  VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE users (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  role_id        TINYINT UNSIGNED NOT NULL,
  full_name      VARCHAR(120) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  phone          VARCHAR(20)  NULL,
  password_hash  VARCHAR(255) NOT NULL,
  avatar_url     VARCHAR(255) NULL,
  status         ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_created ON users(created_at);

-- C. SALONS
CREATE TABLE salons (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_user_id   BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(150) NOT NULL,
  slug            VARCHAR(180) NOT NULL UNIQUE,
  description     TEXT NULL,
  phone           VARCHAR(20)  NULL,
  email           VARCHAR(150) NULL,
  address_text    VARCHAR(255) NOT NULL,
  latitude        DECIMAL(10,7) NULL,
  longitude       DECIMAL(10,7) NULL,
  open_time       TIME NULL,
  close_time      TIME NULL,
  rating_avg      DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count    INT UNSIGNED NOT NULL DEFAULT 0,
  status          ENUM('draft','published','suspended') NOT NULL DEFAULT 'published',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_salons_owner
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_salons_owner ON salons(owner_user_id);
CREATE INDEX idx_salons_geo ON salons(latitude, longitude);
CREATE INDEX idx_salons_status ON salons(status);

CREATE TABLE salon_photos (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  salon_id   BIGINT UNSIGNED NOT NULL,
  url        VARCHAR(255) NOT NULL,
  caption    VARCHAR(255) NULL,
  is_cover   TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_salon_photos_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_salon_photos_salon ON salon_photos(salon_id);

-- D. STYLISTS & SERVICES
CREATE TABLE stylists (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  salon_id     BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NULL,
  full_name    VARCHAR(120) NOT NULL,
  bio          VARCHAR(500) NULL,
  specialties  JSON NULL,  -- MariaDB: JSON ~ LONGTEXT, vẫn dùng ok
  rating_avg   DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count INT UNSIGNED NOT NULL DEFAULT 0,
  active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stylists_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_stylists_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_stylists_salon ON stylists(salon_id);
CREATE INDEX idx_stylists_active ON stylists(active);

CREATE TABLE services (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  salon_id      BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  slug          VARCHAR(180) NOT NULL,
  category      ENUM('cat','goi','uốn','nhuộm','duỗi','tạo kiểu','khác') NOT NULL DEFAULT 'khác',
  duration_min  SMALLINT UNSIGNED NOT NULL,
  base_price    INT UNSIGNED NOT NULL DEFAULT 0,
  description   TEXT NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_service_slug (salon_id, slug),
  CONSTRAINT fk_services_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_services_active ON services(active);

-- E. HOURS & HOLIDAYS (sửa cho MariaDB)
CREATE TABLE working_hours (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  salon_id    BIGINT UNSIGNED NOT NULL,
  stylist_id  BIGINT UNSIGNED NULL,
  weekday     TINYINT UNSIGNED NOT NULL, -- 1..7
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  CONSTRAINT fk_hours_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_hours_stylist
    FOREIGN KEY (stylist_id) REFERENCES stylists(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_hours_salon_day ON working_hours(salon_id, weekday);

-- holidays: dùng cột sinh stylist_id_norm thay cho COALESCE trong index
CREATE TABLE holidays (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  salon_id    BIGINT UNSIGNED NOT NULL,
  stylist_id  BIGINT UNSIGNED NULL,
  off_date    DATE NOT NULL,
  reason      VARCHAR(255) NULL,
  CONSTRAINT fk_holidays_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_holidays_stylist
    FOREIGN KEY (stylist_id) REFERENCES stylists(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  stylist_id_norm BIGINT UNSIGNED AS (IFNULL(stylist_id,0)) STORED,
  UNIQUE KEY uq_off_unique (salon_id, stylist_id_norm, off_date)
) ENGINE=InnoDB;

-- F. PROMOTIONS & VOUCHERS
CREATE TABLE promotions (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  salon_id      BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(150) NOT NULL,
  content       TEXT NULL,
  discount_pct  DECIMAL(5,2) NULL,
  discount_amt  INT UNSIGNED NULL,
  start_at      DATETIME NOT NULL,
  end_at        DATETIME NOT NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_promotions_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_promotions_time ON promotions(active, start_at, end_at);

CREATE TABLE vouchers (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  salon_id        BIGINT UNSIGNED NOT NULL,
  code            VARCHAR(50) NOT NULL,
  description     VARCHAR(255) NULL,
  discount_pct    DECIMAL(5,2) NULL,
  discount_amt    INT UNSIGNED NULL,
  min_order_amt   INT UNSIGNED NULL,
  max_discount    INT UNSIGNED NULL,
  usage_limit     INT UNSIGNED NULL,
  per_user_limit  INT UNSIGNED NULL,
  start_at        DATETIME NOT NULL,
  end_at          DATETIME NOT NULL,
  active          TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_voucher_code (salon_id, code),
  CONSTRAINT fk_vouchers_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_vouchers_time ON vouchers(active, start_at, end_at);

-- G. BOOKINGS & PAYMENTS
CREATE TABLE bookings (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  customer_id    BIGINT UNSIGNED NOT NULL,
  salon_id       BIGINT UNSIGNED NOT NULL,
  stylist_id     BIGINT UNSIGNED NULL,
  appointment_at DATETIME NOT NULL,
  total_minutes  SMALLINT UNSIGNED NOT NULL,
  subtotal_amt   INT UNSIGNED NOT NULL,
  discount_amt   INT UNSIGNED NOT NULL DEFAULT 0,
  total_amt      INT UNSIGNED NOT NULL,
  status         ENUM('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
  note           VARCHAR(500) NULL,
  voucher_id     BIGINT UNSIGNED NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_stylist
    FOREIGN KEY (stylist_id) REFERENCES stylists(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_bookings_voucher
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_bookings_lookup ON bookings(salon_id, stylist_id, appointment_at, status);
CREATE INDEX idx_bookings_customer ON bookings(customer_id, appointment_at);

CREATE TABLE booking_services (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id   BIGINT UNSIGNED NOT NULL,
  service_id   BIGINT UNSIGNED NOT NULL,
  unit_price   INT UNSIGNED NOT NULL,
  duration_min SMALLINT UNSIGNED NOT NULL,
  quantity     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_bks_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_bks_service
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_bks_booking ON booking_services(booking_id);

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

CREATE INDEX idx_payments_booking ON payments(booking_id);

CREATE TABLE transactions (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  payment_id     BIGINT UNSIGNED NOT NULL,
  gateway_txn_id VARCHAR(100) NULL,
  payload        JSON NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_txn_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- H. REVIEWS, FAVORITES, NOTIFICATIONS
CREATE TABLE reviews (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id   BIGINT UNSIGNED NOT NULL,
  salon_id     BIGINT UNSIGNED NOT NULL,
  stylist_id   BIGINT UNSIGNED NULL,
  customer_id  BIGINT UNSIGNED NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  comment      VARCHAR(500) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visible      TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reviews_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reviews_stylist
    FOREIGN KEY (stylist_id) REFERENCES stylists(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_reviews_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_reviews_salon ON reviews(salon_id, created_at);
CREATE INDEX idx_reviews_stylist ON reviews(stylist_id, created_at);

-- favorites: dùng cột sinh + trigger để ép XOR và unique theo (customer,target)
CREATE TABLE favorites (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  customer_id  BIGINT UNSIGNED NOT NULL,
  salon_id     BIGINT UNSIGNED NULL,
  stylist_id   BIGINT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fav_customer
    FOREIGN KEY (customer_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_fav_salon
    FOREIGN KEY (salon_id) REFERENCES salons(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_fav_stylist
    FOREIGN KEY (stylist_id) REFERENCES stylists(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  -- Map mục tiêu về (type, ref) để unique (NULL trong unique index là rắc rối, nên sinh cột)
  target_type TINYINT AS (CASE WHEN salon_id IS NOT NULL THEN 1 ELSE 2 END) STORED,
  target_ref  BIGINT UNSIGNED AS (IFNULL(salon_id, IFNULL(stylist_id,0))) STORED,
  UNIQUE KEY uq_fav (customer_id, target_type, target_ref)
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER favorites_xor_bi BEFORE INSERT ON favorites
FOR EACH ROW
BEGIN
  IF ( (NEW.salon_id IS NULL AND NEW.stylist_id IS NULL)
    OR (NEW.salon_id IS NOT NULL AND NEW.stylist_id IS NOT NULL) ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Exactly one of salon_id or stylist_id must be set';
  END IF;
END$$

CREATE TRIGGER favorites_xor_bu BEFORE UPDATE ON favorites
FOR EACH ROW
BEGIN
  IF ( (NEW.salon_id IS NULL AND NEW.stylist_id IS NULL)
    OR (NEW.salon_id IS NOT NULL AND NEW.stylist_id IS NOT NULL) ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Exactly one of salon_id or stylist_id must be set';
  END IF;
END$$

DELIMITER ;

CREATE TABLE notifications (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  title        VARCHAR(150) NOT NULL,
  message      VARCHAR(500) NOT NULL,
  link_url     VARCHAR(255) NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at);
