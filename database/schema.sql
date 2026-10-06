-- AUTOBOT Gundam Store - Complete 16-Table Relational Schema
-- Học phần: Đồ án 4 (Chuyên ngành Công nghệ phần mềm / Hệ thống thông tin)
-- Engine: MySQL 8.0+ InnoDB, UTF-8 MB4, ACID Transactions, Full FK Constraints

CREATE DATABASE IF NOT EXISTS autobot_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE autobot_store;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS news_articles;
DROP TABLE IF EXISTS order_status_logs;
DROP TABLE IF EXISTS voucher_usages;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS product_inventory_logs;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS vouchers;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- 1. USERS (Tài khoản người dùng & phân quyền)
-- ========================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE = InnoDB;

-- ========================================================
-- 2. USER_ADDRESSES (Sổ địa chỉ nhận hàng của khách)
-- ========================================================
CREATE TABLE user_addresses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  recipient_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Hồ Chí Minh',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_addresses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id)
) ENGINE = InnoDB;

-- ========================================================
-- 3. CATEGORIES (Phân loại Grade Gunpla: HG, RG, MG...)
-- ========================================================
CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ========================================================
-- 4. BRANDS (Hãng sản xuất / Thương hiệu mô hình)
-- ========================================================
CREATE TABLE brands (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  country VARCHAR(80) NOT NULL DEFAULT 'Nhật Bản',
  description VARCHAR(255) NULL,
  logo_url VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ========================================================
-- 5. PRODUCTS (Sản phẩm kit Gunpla)
-- ========================================================
CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  brand_id INT UNSIGNED NOT NULL DEFAULT 1,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  grade VARCHAR(40) NULL,
  scale VARCHAR(20) NULL,
  price DECIMAL(12, 2) NOT NULL,
  old_price DECIMAL(12, 2) NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  condition_status ENUM('con_hang', 'het_hang', 'sap_co_hang') NOT NULL DEFAULT 'con_hang',
  warranty_months INT UNSIGNED NOT NULL DEFAULT 12,
  warranty_policy TEXT NULL,
  manufacturer VARCHAR(120) NULL,
  series_name VARCHAR(120) NULL,
  material VARCHAR(120) NULL,
  detail_count INT UNSIGNED NULL,
  accessories TEXT NULL,
  assembly_type VARCHAR(80) NULL,
  origin VARCHAR(120) NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  gallery_images TEXT NULL,
  height_cm DECIMAL(6, 2) NULL,
  box_weight_g INT UNSIGNED NULL,
  box_size VARCHAR(80) NULL,
  release_year INT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_products_brand
    FOREIGN KEY (brand_id) REFERENCES brands(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_stock CHECK (stock_quantity >= 0),
  INDEX idx_products_category (category_id),
  INDEX idx_products_brand (brand_id),
  INDEX idx_products_name (name),
  INDEX idx_products_stock (stock_quantity),
  INDEX idx_products_active (is_active)
) ENGINE = InnoDB;

-- ========================================================
-- 6. PRODUCT_IMAGES (Bộ sưu tập hình ảnh chi tiết sản phẩm)
-- ========================================================
CREATE TABLE product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_images_product (product_id)
) ENGINE = InnoDB;

-- ========================================================
-- 7. PRODUCT_INVENTORY_LOGS (Nhật ký biến động nhập - xuất kho)
-- ========================================================
CREATE TABLE product_inventory_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  change_type ENUM('nhap_kho', 'xuat_ban', 'huy_don_hoan_kho', 'dieu_chinh') NOT NULL,
  quantity_change INT NOT NULL,
  previous_stock INT UNSIGNED NOT NULL,
  current_stock INT UNSIGNED NOT NULL,
  note VARCHAR(255) NULL,
  created_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_logs_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_inventory_logs_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_inventory_product (product_id),
  INDEX idx_inventory_created_at (created_at)
) ENGINE = InnoDB;

-- ========================================================
-- 8. WISHLISTS (Danh sách yêu thích / Kit muốn ráp của Builder)
-- ========================================================
CREATE TABLE wishlists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
  CONSTRAINT fk_wishlist_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_wishlist_user (user_id)
) ENGINE = InnoDB;

-- ========================================================
-- 9. CART_ITEMS (Giỏ hàng trực tuyến lưu trữ trên Server)
-- ========================================================
CREATE TABLE cart_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  CONSTRAINT fk_cart_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cart_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_cart_quantity CHECK (quantity > 0),
  INDEX idx_cart_user (user_id)
) ENGINE = InnoDB;

-- ========================================================
-- 10. VOUCHERS (Mã giảm giá & chương trình khuyến mãi)
-- ========================================================
CREATE TABLE vouchers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  discount_percent INT UNSIGNED NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  min_order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  usage_limit INT UNSIGNED NOT NULL DEFAULT 100,
  times_used INT UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ========================================================
-- 11. ORDERS (Đơn đặt hàng)
-- ========================================================
CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('da_dat', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy') NOT NULL DEFAULT 'da_dat',
  payment_method ENUM('cod', 'banking') NOT NULL DEFAULT 'cod',
  shipping_address VARCHAR(255) NOT NULL,
  customer_note VARCHAR(500) NULL,
  voucher_code VARCHAR(50) NULL,
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0),
  CONSTRAINT chk_orders_shipping_fee CHECK (shipping_fee >= 0),
  CONSTRAINT chk_orders_total CHECK (total_amount >= 0),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE = InnoDB;

-- ========================================================
-- 12. ORDER_ITEMS (Chi tiết các mặt hàng trong đơn hàng)
-- ========================================================
CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(180) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total DECIMAL(12, 2) AS (unit_price * quantity) STORED,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0),
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id)
) ENGINE = InnoDB;

-- ========================================================
-- 13. VOUCHER_USAGES (Lịch sử sử dụng voucher theo đơn)
-- ========================================================
CREATE TABLE voucher_usages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  voucher_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  discount_applied DECIMAL(12, 2) NOT NULL,
  used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_voucher_usages_voucher
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_voucher_usages_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_voucher_usages_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_voucher_usages_user (user_id),
  INDEX idx_voucher_usages_order (order_id)
) ENGINE = InnoDB;

-- ========================================================
-- 14. ORDER_STATUS_LOGS (Lịch sử cập nhật tiến trình đơn hàng)
-- ========================================================
CREATE TABLE order_status_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  previous_status ENUM('da_dat', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy') NULL,
  new_status ENUM('da_dat', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy') NOT NULL,
  note VARCHAR(255) NULL,
  changed_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_logs_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_status_logs_user
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_status_logs_order (order_id)
) ENGINE = InnoDB;

-- ========================================================
-- 15. REVIEWS (Đánh giá và nhận xét sản phẩm)
-- ========================================================
CREATE TABLE reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
  comment TEXT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5),
  INDEX idx_reviews_product (product_id),
  INDEX idx_reviews_user (user_id)
) ENGINE = InnoDB;

-- ========================================================
-- 16. NEWS_ARTICLES (Bài viết tin tức, cẩm nang ráp Gundam)
-- ========================================================
CREATE TABLE news_articles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id INT UNSIGNED NOT NULL,
  related_product_id INT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  excerpt VARCHAR(350) NOT NULL,
  content LONGTEXT NOT NULL,
  cover_image VARCHAR(500) NULL,
  category_tag VARCHAR(50) NOT NULL DEFAULT 'Kỹ thuật ráp',
  related_grade VARCHAR(50) NOT NULL DEFAULT 'Tất cả',
  views_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_author
    FOREIGN KEY (author_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_articles_product
    FOREIGN KEY (related_product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_articles_slug (slug),
  INDEX idx_articles_published (is_published),
  INDEX idx_articles_grade (related_grade),
  INDEX idx_articles_category (category_tag)
) ENGINE = InnoDB;

-- ========================================================
-- DỮ LIỆU MẪU (SEED DATA ĐẦY ĐỦ 16 BẢNG)
-- ========================================================

-- 1. USERS (Mật khẩu: Password123!)
INSERT INTO users (full_name, email, password_hash, phone, address, role) VALUES
  ('AUTOBOT Admin', 'admin@autobot.local', '$2b$12$Zyb3yDUtlcoUmSWjK9/.q.PWoXAlVzI.I/NbdjCZZJjjd4dbcQqdq', '0901234567', 'Trụ sở AUTOBOT Store, Quận 1, TP.HCM', 'admin'),
  ('Nguyễn Văn Tuấn', 'user@autobot.local', '$2b$12$Zyb3yDUtlcoUmSWjK9/.q.PWoXAlVzI.I/NbdjCZZJjjd4dbcQqdq', '0912345678', '12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM', 'user'),
  ('Trần Hoàng Nam', 'builder@autobot.local', '$2b$12$Zyb3yDUtlcoUmSWjK9/.q.PWoXAlVzI.I/NbdjCZZJjjd4dbcQqdq', '0987654321', '45 Lê Duẩn, Hải Châu, TP. Đà Nẵng', 'user');

-- 2. USER_ADDRESSES
INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, city, is_default) VALUES
  (2, 'Nguyễn Văn Tuấn', '0912345678', '12 Nguyễn Trãi, Phường Bến Thành, Quận 1', 'TP. Hồ Chí Minh', TRUE),
  (2, 'Nguyễn Văn Tuấn (Cơ quan)', '0912345678', 'Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1', 'TP. Hồ Chí Minh', FALSE),
  (3, 'Trần Hoàng Nam', '0987654321', '45 Lê Duẩn, Phường Thạch Thang, Hải Châu', 'Đà Nẵng', TRUE);

-- 3. CATEGORIES
INSERT INTO categories (name, slug, description) VALUES
  ('High Grade', 'hg', 'Tỷ lệ 1/144, biên độ uốn dẻo cao, phù hợp từ nhập môn đến custom nâng cao'),
  ('Real Grade', 'rg', 'Tỷ lệ 1/144, khung xương Advanced MS Joint siêu nét, chi tiết cơ khí đỉnh cao'),
  ('Master Grade', 'mg', 'Tỷ lệ 1/100, khung xương cơ khí đầy đủ, buồng lái mở và tỉ lệ hiển thị ấn tượng'),
  ('Perfect Grade', 'pg', 'Tỷ lệ 1/60, đỉnh cao công nghệ mô hình Bandai, hỗ trợ hệ thống LED và gimmick phức tạp'),
  ('Super Deformed', 'sd', 'Phong cách Chibi đáng yêu, dễ thương, lắp ráp nhanh không cần kìm cắt chuyên dụng');

-- 4. BRANDS
INSERT INTO brands (name, slug, country, description, logo_url) VALUES
  ('Bandai Spirits', 'bandai-spirits', 'Nhật Bản', 'Hãng sản xuất mô hình Gunpla bản quyền số 1 thế giới', 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=200&q=80'),
  ('Kotobukiya', 'kotobukiya', 'Nhật Bản', 'Hãng sản xuất mô hình mecha và figure cao cấp Megami Device, Frame Arms', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=200&q=80'),
  ('Good Smile Company', 'good-smile', 'Nhật Bản', 'Thương hiệu nổi tiếng dòng Moderoid mecha cổ điển', 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=200&q=80');

-- 5. PRODUCTS
INSERT INTO products
  (category_id, brand_id, sku, name, grade, scale, price, old_price, stock_quantity, condition_status, warranty_months, warranty_policy, manufacturer, series_name, material, detail_count, accessories, assembly_type, origin, description, image_url, gallery_images, height_cm, box_weight_g, box_size, release_year)
VALUES
  (2, 1, 'RG-RX782-001', 'RG 1/144 RX-78-2 Gundam Ver. 2.0', 'RG 1/144', '1/144', 1180000, 1350000, 15, 'con_hang', 12, 'Bảo hành lỗi đúc runner và khớp gãy trong 7 ngày', 'Bandai Spirits', 'Mobile Suit Gundam (1979)', 'PS, ABS, PP', 380, 'Beam Rifle, Beam Saber x2, Shield, Core Fighter, Decal nước', 'Lắp ráp Snap-fit', 'Nhật Bản', 'Cột mốc mới của dòng Real Grade với cấu trúc bán khung xương cải tiến, tách màu siêu chi tiết và độ vững chắc vượt trội.', 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=85|https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=900&q=85', 13.50, 450, '31 x 20 x 10 cm', 2024),
  (2, 1, 'RG-SAZABI-001', 'RG 1/144 MSN-04 Sazabi', 'RG 1/144', '1/144', 2050000, 2250000, 8, 'con_hang', 12, 'Bảo hành chính hãng Bandai, hỗ trợ phụ kiện', 'Bandai Spirits', "Char's Counterattack", 'PS, ABS', 520, 'Beam Shot Rifle, Beam Tomahawk, Shield, Funnel x6', 'Lắp ráp Snap-fit', 'Nhật Bản', 'Một trong những mẫu RG đồ sộ nhất từng được sản xuất với cơ chế mở giáp mở rộng vũ khí Funnel cực kỳ chân thực.', 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=900&q=85', 18.00, 720, '39 x 31 x 11 cm', 2018),
  (1, 1, 'HG-AERIAL-001', 'HG 1/144 Gundam Aerial', 'HG 1/144', '1/144', 820000, 900000, 24, 'con_hang', 12, 'Bảo hành 1 đổi 1 nếu gãy khớp do lỗi đúc', 'Bandai Spirits', 'The Witch from Mercury', 'PS, PE', 210, 'Beam Rifle, Escutcheon (Gund-bit Shield), Beam Saber x2', 'Lắp ráp Snap-fit', 'Nhật Bản', 'Mobile Suit chính của Suletta Mercury với các chi tiết in sẵn trong suốt GUND-Format phản quang tuyệt đẹp.', 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=900&q=85', 13.00, 320, '30 x 19 x 6 cm', 2022),
  (1, 1, 'HG-ZAKU-001', 'HG 1/144 MS-06S Zaku II (Char Custom)', 'HG 1/144', '1/144', 690000, 780000, 19, 'con_hang', 12, 'Bảo hành chính hãng', 'Bandai Spirits', 'Mobile Suit Gundam', 'PS, PE', 190, 'Zaku Machine Gun, Heat Hawk, Bazooka', 'Lắp ráp Snap-fit', 'Nhật Bản', 'Biểu tượng Comet Đỏ của Char Aznable với chất liệu nhựa mềm ở hông cho biên độ quỳ bắn chân thực.', 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=900&q=85', 12.80, 290, '30 x 19 x 7 cm', 2020),
  (3, 1, 'MG-FREEDOM-001', 'MG 1/100 Freedom Gundam Ver. 2.0', 'MG 1/100', '1/100', 1920000, 2100000, 10, 'con_hang', 12, 'Bảo hành runner và decal chính hãng', 'Bandai Spirits', 'Mobile Suit Gundam SEED', 'PS, ABS, PE', 480, 'Lupus Beam Rifle, Lacerta Beam Saber x2, Laminated Anti-beam Shield, Display Base', 'Lắp ráp Snap-fit', 'Nhật Bản', 'Cánh tự do dang rộng với cơ chế trượt mở rộng pháo plasma Balaena và railgun Xiphias đỉnh cao.', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=85', 19.50, 850, '39 x 31 x 12 cm', 2016),
  (3, 1, 'MG-BARBATOS-001', 'MG 1/100 Gundam Barbatos', 'MG 1/100', '1/100', 1850000, 1990000, 12, 'con_hang', 12, 'Bảo hành khung gầm pít-tông thủy lực', 'Bandai Spirits', 'Iron-Blooded Orphans', 'PS, ABS', 450, 'Mace, Sword, 300mm Smoothbore Gun', 'Lắp ráp Snap-fit', 'Nhật Bản', 'Khung Gundam Frame đầy đủ với hệ thống pít-tông xi lanh mạ chrome hoạt động cơ học cực kỳ chân thực.', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85', 18.80, 820, '39 x 31 x 11 cm', 2019),
  (4, 1, 'PG-UNICORN-001', 'PG 1/60 RX-0 Unicorn Gundam', 'PG 1/60', '1/60', 5350000, 5800000, 3, 'con_hang', 24, 'Bảo hành LED và biến hình Destroy Mode 24 tháng', 'Bandai Spirits', 'Mobile Suit Gundam UC', 'PS, ABS, POM, PE', 850, 'Beam Magnum, Hyper Bazooka, Shield, Beam Saber x4, Display Stand', 'Lắp ráp Snap-fit cao cấp', 'Nhật Bản', 'Đỉnh cao cơ khí với tính năng chuyển đổi hoàn toàn giữa Unicorn Mode và Destroy Mode không cần tháo rời.', 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=900&q=85', 36.00, 2200, '59 x 40 x 17 cm', 2014),
  (4, 1, 'PG-PERFECT-STRIKE', 'PG 1/60 Perfect Strike Gundam', 'PG 1/60', '1/60', 6500000, 7100000, 2, 'con_hang', 24, 'Bảo hành chính hãng 24 tháng', 'Bandai Spirits', 'Mobile Suit Gundam SEED', 'PS, ABS, Diecast Metal', 980, 'Aile Striker, Sword Striker, Launcher Striker, Grand Slam, Armor Schneider x2', 'Lắp ráp Snap-fit kèm kim loại', 'Nhật Bản', 'Bộ trang bị đầy đủ 3 Striker Pack cùng khung kim loại Diecast tăng cường độ chắc chắn của các khớp chịu tải.', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=85', 33.00, 2800, '60 x 42 x 20 cm', 2020),
  (5, 1, 'SD-WING-001', 'SDW Heroes Wukong Impulse Gundam', 'SD', 'Non-scale', 420000, 480000, 30, 'con_hang', 6, 'Bảo hành mảnh đúc 6 tháng', 'Bandai Spirits', 'SD Gundam World Heroes', 'PS', 95, 'Như ý kim cô bổng, hiệu ứng lửa trong suốt', 'Lắp ráp Snap-fit không cần kìm', 'Nhật Bản', 'Biến thể Ngộ Không với các mảnh nhựa trong suốt rực rỡ, có thể biến hình sang dạng Tề Thiên Đại Thánh.', 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=900&q=85', 8.50, 160, '20 x 15 x 6 cm', 2021),
  (1, 1, 'HG-CALIBARN-001', 'HG 1/144 Gundam Calibarn', 'HG 1/144', '1/144', 890000, 950000, 18, 'con_hang', 12, 'Bảo hành linh kiện 12 tháng', 'Bandai Spirits', 'The Witch from Mercury', 'PS', 230, 'Variable Rod Rifle, Shield Bits, Beam Saber x2, Stand Base', 'Lắp ráp Snap-fit', 'Nhật Bản', 'Quái vật trắng trong tập cuối Witch from Mercury, trang bị cán chổi pháo đẩy phản lực đa chiều.', 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=900&q=85', 13.50, 340, '30 x 19 x 7 cm', 2023);

-- 6. PRODUCT_IMAGES
INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES
  (1, 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=85', TRUE, 1),
  (1, 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=900&q=85', FALSE, 2),
  (2, 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=900&q=85', TRUE, 1),
  (3, 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=900&q=85', TRUE, 1),
  (5, 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=85', TRUE, 1);

-- 7. PRODUCT_INVENTORY_LOGS
INSERT INTO product_inventory_logs (product_id, change_type, quantity_change, previous_stock, current_stock, note, created_by_user_id) VALUES
  (1, 'nhap_kho', 20, 0, 20, 'Nhập lô hàng đợt 1 từ Bandai Nhật Bản', 1),
  (1, 'xuat_ban', -5, 20, 15, 'Xuất kho cho các đơn hàng đầu tuần', 1),
  (2, 'nhap_kho', 10, 0, 10, 'Nhập kho lô RG Sazabi chính hãng', 1),
  (2, 'xuat_ban', -2, 10, 8, 'Xuất bán cho khách hàng đặt sớm', 1),
  (3, 'nhap_kho', 25, 0, 25, 'Nhập kho lô Aerial đợt 2', 1);

-- 8. WISHLISTS
INSERT INTO wishlists (user_id, product_id) VALUES
  (2, 2),
  (2, 7),
  (3, 1),
  (3, 5);

-- 9. VOUCHERS
INSERT INTO vouchers (code, description, discount_percent, discount_amount, min_order_amount, usage_limit, times_used, is_active) VALUES
  ('AUTOBOT10', 'Giảm 10% cho tất cả đơn hàng từ 1.000.000đ', 10, 0, 1000000, 200, 2, TRUE),
  ('GUNDAM50K', 'Giảm trực tiếp 50.000đ cho đơn hàng từ 500.000đ', 0, 50000, 500000, 500, 1, TRUE),
  ('FREESHIP', 'Miễn phí vận chuyển cho đơn hàng từ 1.500.000đ', 0, 30000, 1500000, 1000, 0, TRUE);

-- 10. ORDERS
INSERT INTO orders
  (order_code, user_id, status, payment_method, shipping_address, customer_note, voucher_code, discount_amount, subtotal, shipping_fee, total_amount, created_at)
VALUES
  ('AB2026090001', 2, 'da_giao', 'cod', '12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM', 'Giao giờ hành chính, gọi trước 15p', 'GUNDAM50K', 50000, 2360000, 0, 2310000, '2026-09-15 10:30:00'),
  ('AB2026090002', 2, 'dang_giao', 'cod', '12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM', 'Để trước cửa nhà bảo vệ', NULL, 0, 820000, 30000, 850000, '2026-10-01 14:20:00'),
  ('AB2026090003', 3, 'da_xac_nhan', 'banking', '45 Lê Duẩn, Hải Châu, TP. Đà Nẵng', 'Đóng gói bọc bubble wrap kỹ', 'AUTOBOT10', 192000, 1920000, 0, 1728000, '2026-10-04 09:15:00'),
  ('AB2026090004', 3, 'da_dat', 'cod', '45 Lê Duẩn, Hải Châu, TP. Đà Nẵng', 'Kiểm tra hộp vuông vắn trước khi gửi', NULL, 0, 1850000, 0, 1850000, '2026-10-06 11:00:00');

-- 11. ORDER_ITEMS
INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES
  (1, 1, 'RG 1/144 RX-78-2 Gundam Ver. 2.0', 1180000, 2),
  (2, 3, 'HG 1/144 Gundam Aerial', 820000, 1),
  (3, 5, 'MG 1/100 Freedom Gundam Ver. 2.0', 1920000, 1),
  (4, 6, 'MG 1/100 Gundam Barbatos', 1850000, 1);

-- 12. VOUCHER_USAGES
INSERT INTO voucher_usages (voucher_id, user_id, order_id, discount_applied, used_at) VALUES
  (2, 2, 1, 50000, '2026-09-15 10:30:00'),
  (1, 3, 3, 192000, '2026-10-04 09:15:00');

-- 13. ORDER_STATUS_LOGS
INSERT INTO order_status_logs (order_id, previous_status, new_status, note, changed_by_user_id, created_at) VALUES
  (1, NULL, 'da_dat', 'Khách hàng tạo đơn hàng', 2, '2026-09-15 10:30:00'),
  (1, 'da_dat', 'da_xac_nhan', 'Admin đã kiểm tra kho và xác nhận', 1, '2026-09-15 11:00:00'),
  (1, 'da_xac_nhan', 'dang_giao', 'Bàn giao cho đơn vị vận chuyển GHTK', 1, '2026-09-16 08:30:00'),
  (1, 'dang_giao', 'da_giao', 'Giao thành công cho khách hàng', 1, '2026-09-17 14:00:00'),
  (2, NULL, 'da_dat', 'Khách hàng tạo đơn hàng', 2, '2026-10-01 14:20:00'),
  (2, 'da_dat', 'dang_giao', 'Đang vận chuyển hỏa tốc', 1, '2026-10-02 09:00:00'),
  (3, NULL, 'da_dat', 'Khách hàng tạo đơn hàng', 3, '2026-10-04 09:15:00'),
  (3, 'da_dat', 'da_xac_nhan', 'Đã nhận chuyển khoản ngân hàng', 1, '2026-10-04 10:00:00');

-- 14. REVIEWS
INSERT INTO reviews (product_id, user_id, rating, comment, created_at) VALUES
  (1, 2, 5, 'Khung xương Ver 2.0 quá đỉnh, khớp chắc chắn, biên độ uốn dẻo tuyệt vời!', '2026-09-20 18:30:00'),
  (1, 3, 5, 'Chi tiết cơ khí tách màu nhựa rất tốt, không cần kẻ lằn chìm nhiều vẫn đẹp xuất sắc.', '2026-09-25 20:10:00'),
  (2, 2, 5, 'Sazabi to đầm tay dã man, lắp xong cao ngang ngửa một con MG luôn.', '2026-09-22 15:00:00'),
  (3, 3, 5, 'Kit Aerial này khớp dẻo, effect GUND-format trong suốt siêu lung linh.', '2026-10-02 11:45:00'),
  (5, 3, 5, 'Freedom 2.0 dáng sải cánh cực kỳ ngầu, shop đóng bọc bong bóng kỹ càng!', '2026-10-05 16:20:00');

-- 15. NEWS_ARTICLES (Cẩm nang Gunpla & Kỹ thuật builder)
INSERT INTO news_articles (author_id, related_product_id, title, slug, excerpt, content, cover_image, category_tag, related_grade, views_count) VALUES
  (1, 1, 'Hướng dẫn kỹ thuật kẻ lằn chìm Panel Lining chuẩn Pro Builder', 'huong-dan-ke-lan-chim-panel-lining', 'Bí quyết giúp mô hình Gunpla của bạn nổi bật từng đường rãnh cơ khí chỉ với bút lằn và gôm chuyên dụng.', 'Panel Lining (kẻ lằn chìm) là kỹ thuật cơ bản nhưng mang lại sự thay đổi ngoạn mục nhất cho bất kỳ kit Gundam nào. Bằng cách sử dụng bút kẻ lằn hoặc dung dịch Tamiya Panel Line Accent Color vào các đường rãnh được đúc sẵn trên bề mặt giáp, bạn sẽ tạo ra hiệu ứng bóng đổ chiều sâu cơ khí như một cỗ máy chiến đấu thực thụ.\n\n1. Chuẩn bị dụng cụ:\n- Bút kẻ Gundam Marker GM01 (màu đen) hoặc GM02 (màu xám cho giáp trắng).\n- Tẩy gôm mềm hoặc tăm bông thấm cồn y tế 70 độ để lau mực thừa.\n\n2. Quy trình thực hiện:\n- Chấm nhẹ đầu bút vào các rãnh chìm, để mực chảy tự nhiên theo lực mao dẫn.\n- Đợi mực khô khoảng 2-3 phút, sau đó dùng tăm bông gạt vuông góc với đường rãnh để làm sạch phần mực loang.\n- Phủ một lớp sơn bóng Topcoat Matt để khóa bảo vệ lớp mực không bị trầy xước.', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=85', 'Kỹ thuật ráp', 'Tất cả', 1250),
  (1, 3, 'Cách cắt runner không để lại ghẻ (Nub Marks) cho người mới bắt đầu', 'cach-cat-runner-khong-de-lai-nup-marks', 'Phương pháp cắt 2 bước thần thánh với kìm chuyên dụng single-blade giúp bề mặt nhựa phẳng mịn không tì vết.', 'Ghẻ nhựa (Nub marks) là nỗi ám ảnh lớn nhất của mọi người chơi Gunpla. Khi cắt trực tiếp sát giáp, lực ép của kìm sẽ làm biến màu và kéo đứt sợi nhựa, để lại các đốm trắng hoặc vết lõm khó khắc phục.\n\nGiải pháp hoàn hảo là Quy tắc Cắt 2 Bước:\n- Bước 1: Dùng kìm cắt cách chi tiết khoảng 1-2mm để tách part ra khỏi runner.\n- Bước 2: Dùng kìm lưỡi đơn (Single Blade Nipper như GodHand hoặc Dspiae) gọt sát phần chân cuống nhựa còn lại một cách nhẹ nhàng.\n- Bước 3: Dùng dũa thủy tinh (Nano Glass File) miết nhẹ để làm phẳng bóng bề mặt.', 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=85', 'Kinh nghiệm chơi', 'HG 1/144', 980),
  (1, NULL, 'So sánh chi tiết các cấp độ Gunpla: HG, RG, MG, PG nên chọn dòng nào?', 'so-sanh-cac-cap-do-gunpla-hg-rg-mg-pg', 'Tổng hợp phân tích ưu nhược điểm từng Grade giúp bạn chọn đúng mẫu kit phù hợp ngân sách và trình độ kỹ năng.', 'Nếu bạn đang phân vân không biết nên chọn dòng nào để bắt đầu hành trình builder, đây là bản tóm lược nhanh:\n\n- HG (High Grade - 1/144): Giá dễ tiếp cận (300k - 800k), lắp nhanh 2-3 tiếng, độ bền cao, thích hợp người mới và người thích custom sơn.\n- RG (Real Grade - 1/144): Nhỏ gọn nhưng chi tiết cơ khí siêu nét, có khung xương đúc sẵn hoặc bán khung xương, độ khó trung bình khá.\n- MG (Master Grade - 1/100): Kích thước to đầm tay (khoảng 18-20cm), khung xương hoàn chỉnh, buồng lái phi công mở được, độ chi tiết cao.\n- PG (Perfect Grade - 1/60): Đỉnh cao công nghệ Gunpla, cao tới 35cm, hỗ trợ đèn LED, hàng trăm chi tiết cơ khí phức tạp, dành cho builder tâm huyết.', 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=900&q=85', 'Cẩm nang chọn kit', 'Tất cả', 2140),
  (1, 2, 'Đánh giá chi tiết RG 1/144 MSN-04 Sazabi: Đỉnh cao chi tiết dòng Real Grade', 'danh-gia-chi-tiet-rg-sazabi', 'Mẫu RG đồ sộ nhất từng sản xuất với cơ cấu mở giáp bung pháo Funnel siêu ấn tượng và khung xương vững chắc.', 'RG Sazabi được mệnh danh là kiệt tác của Bandai khi kết hợp hoàn hảo giữa kích thước đồ sộ ngang ngửa MG và độ chi tiết thu nhỏ sắc lẹm của dòng RG.\n\nĐiểm nổi bật:\n- Khung xương cải tiến hạn chế tối đa tình trạng nhão khớp cổ điển của các đời RG đầu.\n- Hệ thống mở giáp (Open-hatch gimmick) ở vai, bắp chân và ba lô động cơ phản lực cực kỳ mượt mà.\n- 6 nòng pháo Funnel có thể tháo rời và tạo dáng bắn đa hướng.', 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=900&q=85', 'Review mô hình', 'RG 1/144', 3420),
  (1, 6, 'Cẩm nang lắp ráp MG 1/100 Barbatos: Tối ưu khung xương Pít-tông thủy lực', 'cam-nang-lap-rap-mg-barbatos', 'Hướng dẫn chi tiết từng công đoạn ráp khung Gundam Frame với hệ thống xi lanh cơ học mạ chrome chuyển động thật.', 'MG Gundam Barbatos là một trong những mẫu kit có trải nghiệm lắp ráp cơ khí đã tay nhất. Bộ khung Gundam Frame thế hệ thứ tư sở hữu hàng loạt pít-tông thủy lực mạ chrome sáng bóng, co giãn nhịp nhàng theo từng chuyển động gập gối, xoay hông và nâng ngực.\n\nLưu ý quan trọng khi ráp:\n- Không cắt nhầm các ngàm khóa pít-tông nhỏ ở khớp bắp đùi.\n- Chấm một giọt dầu bôi trơn silicone chuyên dụng nếu khớp háng quá chặt để tránh gãy chốt khi xoay góc rộng.', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85', 'Kỹ thuật ráp', 'MG 1/100', 1890),
  (1, 7, 'Kinh nghiệm lắp ráp và đi dây LED cho PG 1/60 RX-0 Unicorn Gundam', 'kinh-nghiem-lap-rap-led-pg-unicorn', 'Mẹo giấu dây LED thông minh và xử lý khớp chuyển dạng Unicorn sang Destroy Mode an toàn tuyệt đối.', 'Sở hữu một chú PG Unicorn Gundam kèm bộ đèn LED chuyển màu Psycho-Frame là mơ ước của mọi tín đồ Gunpla. Tuy nhiên việc đi dây điện ngầm qua hàng chục khớp nối đòi hỏi sự kiên nhẫn và cẩn trọng cực lớn.\n\nBí kíp từ Pro Builder:\n- Thử sáng toàn bộ dây LED trước khi lắp ráp để đảm bảo không có bóng nào bị chập.\n- Dùng băng keo đệm mỏng cố định dây tại các khớp xoay mắt cá chân và vai để tránh kẹp đứt lõi đồng khi chuyển dạng.', 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=900&q=85', 'Kinh nghiệm chơi', 'PG 1/60', 4150),
  (1, 10, 'Top 5 kit HG đáng chơi nhất: Gundam Aerial & Calibarn khuấy đảo cộng đồng', 'top-kit-hg-dang-choi-nhat', 'Dòng High Grade ngày càng tiến hóa vượt bậc với biên độ uốn dẻo tuyệt đỉnh cùng nhựa trong suốt phản quang.', 'Thế hệ Gunpla mới từ anime Phù Thủy Sao Thủy đã định nghĩa lại hoàn toàn chuẩn mực dòng High Grade (HG 1/144). Cả Aerial lẫn Calibarn đều sở hữu biên độ gập mở không thua kém RG, trong khi số lượng mảnh ghép vừa phải giúp bạn hoàn thành một kit lung linh chỉ trong 3-4 giờ lắp ráp cuối tuần.', 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=900&q=85', 'Review mô hình', 'HG 1/144', 2760);
