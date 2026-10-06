# KẾ HOẠCH THỰC HIỆN ĐỒ ÁN 4: HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ AUTOBOT GUNDAM STORE

## 1. THÔNG TIN ĐỀ TÀI
- **Tên đề tài:** Xây dựng website thương mại điện tử chuyên doanh mô hình lắp ráp Gundam (AUTOBOT Store)
- **Học phần:** Đồ án 4 (Chuyên ngành Công nghệ phần mềm / Hệ thống thông tin)
- **Công nghệ chính:**
  - **Frontend:** React 19, Vite, React Router DOM v7, Ant Design (Antd), Vanilla CSS Design System.
  - **Backend:** Node.js, Express.js (RESTful API), Express-validator, JWT Authentication, Multer, Helmet, Morgan, Rate-limiting.
  - **Cơ sở dữ liệu:** MySQL 8.0+ (16 Bảng quan hệ chuẩn hóa 3NF, InnoDB Engine, Transactions ACID `FOR UPDATE`, Foreign Key Constraints).

### Cấu trúc thư mục dự án
- [frontend/](file:///c:/hehe/zpucmuonlap/vscode/frontend): Ứng dụng giao diện người dùng React + Vite (`src/`, `components/`, `pages/`, `context/`).
- [backend/](file:///c:/hehe/zpucmuonlap/vscode/backend): Máy chủ API RESTful Node.js + Express (`controllers/`, `routes/`, `middleware/`, `scripts/`).
- [database/](file:///c:/hehe/zpucmuonlap/vscode/database): File schema và migration MySQL ([schema.sql](file:///c:/hehe/zpucmuonlap/vscode/database/schema.sql)).
- [text/](file:///c:/hehe/zpucmuonlap/vscode/text): Hồ sơ kế hoạch đồ án và các sơ đồ PlantUML (Use Case, Sequence, Activity, ERD).
- [package.json](file:///c:/hehe/zpucmuonlap/vscode/package.json): Quản lý lệnh điều phối chạy song song cả 2 môi trường (`npm run dev:all`).

---

## 2. KIẾN TRÚC CƠ SỞ DỮ LIỆU CHUẨN HÓA (16 BẢNG)

Hệ thống được thiết kế theo mô hình chuẩn hóa quan hệ 3NF đảm bảo tính toàn vẹn dữ liệu và mở rộng nghiệp vụ:
1. `users`: Tài khoản người dùng (Admin, Khách hàng), mã hóa mật khẩu bcrypt, phân quyền JWT.
2. `user_addresses`: Sổ địa chỉ giao hàng nhận dạng nhiều địa chỉ nhà/cơ quan, hỗ trợ cờ địa chỉ mặc định.
3. `categories`: Phân loại cấp độ mô hình (Grade: HG, RG, MG, PG, SD).
4. `brands`: Thương hiệu & nhà sản xuất mô hình (Bandai Spirits, Kotobukiya, Good Smile Company).
5. `products`: Bảng sản phẩm cốt lõi lưu trữ đầy đủ thông số kỹ thuật, giá bán, bảo hành và trạng thái kho.
6. `product_images`: Bộ sưu tập thư viện ảnh chi tiết từng góc chụp của sản phẩm.
7. `product_inventory_logs`: Nhật ký kiểm kê và biến động xuất/nhập/hoàn kho phục vụ truy vết kho hàng.
8. `wishlists`: Danh sách sản phẩm yêu thích (Kit muốn ráp) của khách hàng.
9. `cart_items`: Giỏ hàng trực tuyến được lưu trữ kiên cố trên cơ sở dữ liệu và đồng bộ client.
10. `vouchers`: Chương trình khuyến mãi, mã giảm giá theo tỷ lệ % hoặc số tiền cố định.
11. `voucher_usages`: Nhật ký áp dụng voucher theo từng khách hàng và đơn hàng cụ thể.
12. `orders`: Đơn đặt hàng, phương thức thanh toán, tiền ship, chiết khấu và tổng thanh toán.
13. `order_items`: Chi tiết từng dòng sản phẩm trong đơn hàng kèm đơn giá tại thời điểm chốt đơn.
14. `order_status_logs`: Nhật ký dòng thời gian (Timeline logs) ghi nhận ai cập nhật trạng thái đơn lúc nào.
15. `reviews`: Đánh giá xếp hạng sao (1 - 5★) và bình luận trải nghiệm lắp ráp từ khách hàng.
16. `news_articles`: Chuyên mục cẩm nang, mẹo kỹ thuật cắt runner, kẻ lằn chìm, phân loại theo Grade/thể loại và liên kết trực tiếp với mô hình sản phẩm.

---

## 3. MỤC TIÊU VÀ PHẠM VI DỰ ÁN

### 3.1. Phía Khách hàng (End-User)
- [x] Xem danh mục sản phẩm theo Grade (HG, RG, MG, PG, SD), hãng sản xuất, mức giá.
- [x] Tìm kiếm tức thời (live search) và sắp xếp linh hoạt (giá tăng/giảm, nổi bật).
- [x] Xem trang chi tiết sản phẩm đầy đủ thông số kỹ thuật (tỷ lệ, kích thước, số mảnh ghép, bảo hành, hình ảnh bộ sưu tập).
- [x] Đăng ký / Đăng nhập tài khoản bảo mật bằng mã hóa bcrypt và JWT.
- [x] Sổ địa chỉ giao hàng: Lưu nhiều địa chỉ nhận hàng, chọn địa chỉ mặc định.
- [x] Wishlist: Bấm tim lưu kit yêu thích, xem danh sách và chuyển vào giỏ hàng nhanh chóng.
- [x] Giỏ hàng động: Thêm, bớt số lượng, kiểm tra giới hạn tồn kho, đồng bộ Database & LocalStorage.
- [x] Đặt hàng trực tuyến: Nhập địa chỉ nhận hàng, ghi chú, tính phí ship, voucher giảm giá, phương thức thanh toán (COD / Chuyển khoản QR).
- [x] Theo dõi lịch sử đơn hàng cá nhân và xem dòng thời gian xử lý đơn (Order timeline logs).
- [x] Đánh giá & nhận xét sao (Reviews) cho từng kit mô hình.
- [x] Chuyên mục Cẩm nang Builder: Đọc các bài viết kỹ thuật, bộ lọc đa năng theo Thể loại (Kỹ thuật ráp, Review, Chọn kit), lọc theo Dòng mô hình / Grade (HG, RG, MG, PG, SD), tìm kiếm từ khóa, và liên kết mua nhanh mô hình được đề cập trong bài viết.

### 3.2. Phía Quản trị viên (Admin)
- [x] Quản lý sản phẩm: Thêm mới, chỉnh sửa thông số, upload hình ảnh trực tiếp (`multer`), cập nhật tồn kho, gắn cờ trạng thái (`con_hang`, `het_hang`, `sap_co_hang`).
- [x] Quản lý danh mục & thương hiệu: Kích hoạt/ẩn danh mục Grade và hãng sản xuất.
- [x] Quản lý đơn hàng: Xem danh sách đơn, chi tiết từng món hàng, cập nhật tiến độ đơn (`da_dat` -> `da_xac_nhan` -> `dang_giao` -> `da_giao` / `da_huy`) với cơ chế hoàn kho tự động và ghi log tiến trình.
- [x] Quản lý nhật ký kho hàng (Inventory logs): Theo dõi lịch sử xuất bán, nhập kho, kiểm kê, điều chỉnh thủ công.
- [x] Quản lý tài khoản người dùng: Khóa/kích hoạt tài khoản, phân quyền.
- [x] Thống kê (Dashboard): Biểu đồ cột doanh thu theo tháng, tổng doanh thu, tổng số đơn hàng, số khách hàng, cảnh báo tồn kho sắp hết.

---

## 4. TIẾN ĐỘ THỰC HIỆN CHI TIẾT THEO GIAI ĐOẠN

### Giai đoạn 1: Chuẩn hóa Dữ liệu & Môi trường MySQL (Hoàn thành)
- [x] Thiết kế & triển khai hoàn chỉnh **16 bảng quan hệ** chuẩn InnoDB UTF8MB4.
- [x] Viết script Seed dữ liệu phong phú (`npm run seed`): người dùng, 10+ mẫu kit hot, thương hiệu, địa chỉ, đơn hàng, logs kho, bài viết cẩm nang.
- [x] Kết nối 100% dữ liệu thực từ MySQL qua Connection Pool.

### Giai đoạn 2: Tái cấu trúc & Hoàn thiện Frontend (Hoàn thành)
- [x] Tách file khổng lồ `main.jsx` thành các component tái sử dụng (`Navbar`, `Footer`, `ProductCard`, `CartDrawer`, `CheckoutModal`, `SkeletonLoader`).
- [x] Xây dựng các trang chức năng mới:
  - Trang Lịch sử đơn hàng cá nhân & Timeline logs (`MyOrdersPage.jsx`).
  - Trang Hồ sơ cá nhân & Sổ địa chỉ giao hàng (`ProfilePage.jsx`).
  - Trang Kit yêu thích Wishlist (`WishlistPage.jsx`).
  - Trang Cẩm nang & Tin tức Builder (`ArticlesPage.jsx` & `ArticleDetailPage.jsx`).
- [x] Tích hợp Wishlist ❤️, giỏ hàng, skeleton loading shimmer.

### Giai đoạn 3: Nâng cấp Backend & Nghiệp vụ nâng cao (Hoàn thành)
- [x] API Phân trang, Multi-filter theo Grade, khoảng giá, sắp xếp.
- [x] Tích hợp Upload file ảnh tĩnh bằng `multer`.
- [x] Biểu đồ cột thống kê doanh thu theo tháng trên Admin Dashboard.
- [x] Kiểm soát giao dịch Transaction ACID `FOR UPDATE` chống trừ âm kho, tự động ghi nhận nhật ký kho hàng và timeline đơn.
- [x] Hoàn thiện API cho Wishlist, Addresses, Inventory logs, Articles, Brands.

### Giai đoạn 4: Kiểm thử, Tối ưu & Đóng gói Báo cáo (Hoàn thành)
- [x] Bộ kiểm thử tích hợp tự động (`npm run test:flow`) vượt qua 10/10 kịch bản end-to-end.
- [x] Bảo mật: In-memory Rate Limiting, Helmet, Express-validator, JWT Authentication.
- [x] Hoàn thiện tài liệu và sơ đồ PlantUML (Use Case, Sequence, Activity và sơ đồ ERD 16 bảng tại `text/plantuml/04_erd_database.puml`).
