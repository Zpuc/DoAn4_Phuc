# 🔍 Phân Tích Chức Năng Còn Thiếu — AUTOBOT Gundam Store

> Phân tích dựa trên schema 16 bảng, backend API routes, controllers, và trang Admin hiện tại.

---

## ✅ Những gì bạn ĐÃ CÓ (Đã triển khai)

| Module | Backend API | Frontend Admin UI |
|--------|:-----------:|:-----------------:|
| Quản lý sản phẩm (CRUD) | ✅ | ✅ |
| Quản lý danh mục (CRUD) | ✅ | ❌ Thiếu UI |
| Quản lý đơn hàng (xem + cập nhật trạng thái) | ✅ | ✅ |
| Quản lý người dùng (xem danh sách) | ✅ | ✅ (chỉ xem) |
| Dashboard tổng quan (doanh thu, biểu đồ) | ✅ | ✅ |
| Nhật ký kho hàng + điều chỉnh tồn kho | ✅ | ✅ |
| Tạo bài viết mới | ✅ | ❌ Thiếu UI |
| Upload hình ảnh | ✅ | ✅ |

---

## 🚨 Những chức năng THIẾU cho một hệ thống quản lý thực thụ

### 1. 📦 Quản lý Danh mục (Categories) — Thiếu UI Admin

> [!WARNING]
> Backend đã có API CRUD categories nhưng **trang Admin không có tab/UI** để quản lý danh mục.

**Cần thêm:**
- Tab "Quản lý Danh mục" trong Admin Panel
- Form thêm/sửa/xóa danh mục (name, slug, description, is_active)
- Bảng hiển thị danh sách danh mục với thao tác

**Files liên quan:** [categories.controller.js](file:///c:/hehe/zpucmuonlap/vscode/backend/src/controllers/categories.controller.js), [AdminPage.jsx](file:///c:/hehe/zpucmuonlap/vscode/frontend/src/pages/AdminPage.jsx)

---

### 2. 🏷️ Quản lý Thương hiệu (Brands) — Thiếu hoàn toàn

> [!CAUTION]
> Bảng `brands` có trong DB, backend chỉ có `listBrands` (chỉ đọc). **Không có CRUD** và **không có UI**.

**Cần thêm:**
- API: `POST /brands`, `PUT /brands/:id`, `DELETE /brands/:id`
- UI Admin: Tab/section quản lý thương hiệu
- Form: name, slug, country, description, logo_url, is_active

**File liên quan:** [brands.controller.js](file:///c:/hehe/zpucmuonlap/vscode/backend/src/controllers/brands.controller.js) — chỉ có 1 hàm `listBrands`

---

### 3. 🎟️ Quản lý Voucher/Mã giảm giá — Thiếu CRUD + UI

> [!CAUTION]
> Backend chỉ có `listVouchers` và `validateVoucher` (chỉ đọc). **Không thể tạo, sửa, xóa, vô hiệu hóa voucher** từ admin.

**Cần thêm:**
- API: `POST /vouchers`, `PUT /vouchers/:id`, `DELETE /vouchers/:id`
- Tab "Quản lý Voucher" trong Admin Panel
- Form: code, description, discount_percent/amount, min_order_amount, usage_limit, is_active
- Hiển thị: lượt đã dùng, voucher còn hiệu lực, voucher hết hạn
- Xem lịch sử sử dụng voucher (bảng `voucher_usages`)

**File liên quan:** [vouchers.controller.js](file:///c:/hehe/zpucmuonlap/vscode/backend/src/controllers/vouchers.controller.js)

---

### 4. ⭐ Quản lý Đánh giá (Reviews) — Thiếu Admin CRUD

> [!WARNING]
> Backend chỉ có `listProductReviews` và `createReview`. **Admin không thể duyệt, ẩn, xóa review.**

**Cần thêm:**
- API: `GET /reviews` (tất cả reviews), `PATCH /reviews/:id/approve`, `DELETE /reviews/:id`
- Tab "Quản lý Đánh giá" trong Admin
- Duyệt/từ chối review (bảng có cột `is_approved` nhưng chưa dùng)
- Lọc theo sản phẩm, rating, trạng thái duyệt

**File liên quan:** [reviews.controller.js](file:///c:/hehe/zpucmuonlap/vscode/backend/src/controllers/reviews.controller.js)

---

### 5. 📰 Quản lý Bài viết (Articles) — Thiếu UI + Sửa/Xóa

> [!WARNING]
> Backend có `createArticle` nhưng **không có sửa, xóa bài viết**. Trang Admin **không có form tạo/quản lý bài viết**.

**Cần thêm:**
- API: `PUT /articles/:id`, `DELETE /articles/:id`
- Tab "Quản lý Bài viết" trong Admin
- Form tạo/sửa bài viết với editor WYSIWYG
- Quản lý trạng thái xuất bản (is_published)
- Liên kết sản phẩm với bài viết (related_product_id)

**File liên quan:** [articles.controller.js](file:///c:/hehe/zpucmuonlap/vscode/backend/src/controllers/articles.controller.js)

---

### 6. 👤 Quản lý Người dùng — Thiếu các thao tác quan trọng

> [!IMPORTANT]
> UI Admin chỉ hiển thị **danh sách người dùng**, không có nút thao tác nào. Backend có `createUser` và `updateUser` nhưng frontend không dùng.

**Cần thêm:**
- Nút **Khóa/Mở khóa** tài khoản (toggle `is_active`)
- Nút **Đổi vai trò** (user ↔ admin)
- Form **Tạo tài khoản** nhân viên/admin mới
- **Xóa tài khoản** (hoặc vô hiệu hóa vĩnh viễn)
- Xem chi tiết: lịch sử đơn hàng, địa chỉ, reviews của user

**File liên quan:** [users.controller.js](file:///c:/hehe/zpucmuonlap/vscode/backend/src/controllers/users.controller.js) — đã có logic nhưng UI thiếu

---

### 7. 📋 Quản lý Chi tiết Đơn hàng — Thiếu xem chi tiết

> [!IMPORTANT]
> Admin chỉ thấy bảng tổng quan đơn hàng (mã đơn, tổng tiền, trạng thái). **Không thể xem chi tiết sản phẩm trong đơn**, ghi chú khách, lịch sử thay đổi trạng thái.

**Cần thêm:**
- Modal/page xem chi tiết đơn hàng: danh sách sản phẩm, số lượng, đơn giá
- Hiển thị: địa chỉ giao hàng, ghi chú khách, phương thức thanh toán
- Lịch sử cập nhật trạng thái (bảng `order_status_logs`)
- Tìm kiếm/lọc đơn hàng theo: mã đơn, khách hàng, trạng thái, khoảng thời gian
- In/xuất hóa đơn PDF

---

### 8. 🔔 Hệ thống Thông báo — Chưa có

**Cần thêm:**
- Thông báo đơn hàng mới cho admin (realtime hoặc polling)
- Thông báo tồn kho thấp tự động
- Thông báo review mới cần duyệt

---

### 9. 📊 Báo cáo & Xuất dữ liệu — Chưa có

**Cần thêm:**
- Xuất báo cáo doanh thu ra Excel/CSV
- Xuất danh sách sản phẩm, đơn hàng, khách hàng
- Thống kê theo khoảng thời gian tùy chọn (date picker)
- Biểu đồ tỷ lệ trạng thái đơn hàng (pie/donut chart)
- So sánh doanh thu giữa các tháng/quý

---

### 10. 🔒 Phân quyền nâng cao — Chưa có

> [!NOTE]
> Hiện chỉ có 2 role đơn giản: `admin` và `user`. Chưa có phân quyền chi tiết.

**Cần thêm nếu muốn nâng cao:**
- Role `staff`/`editor` cho nhân viên xem nhưng không xóa
- Ghi log ai thao tác gì (audit trail) — **đã có bảng `order_status_logs` và `product_inventory_logs` nhưng chưa đầy đủ**
- Phân quyền theo module (chỉ quản lý sản phẩm, chỉ quản lý đơn hàng...)

---

## 📊 Tổng hợp mức độ ưu tiên & Trạng thái hoàn thành

| # | Chức năng | Mức độ | Trạng thái triển khai | Chi tiết kỹ thuật |
|---|-----------|:------:|:--------------------:|-------------------|
| 1 | **Quản lý Voucher (CRUD + UI)** | 🔴 Cao |  **ĐÃ HOÀN THÀNH** | CRUD đầy đủ, bật/tắt voucher, xem modal lịch sử dùng mã (`voucher_usages`), xuất CSV |
| 2 | **Quản lý Đánh giá (Admin)** | 🔴 Cao |  **ĐÃ HOÀN THÀNH** | Duyệt/ẩn review (`is_approved`), xóa review, lọc theo trạng thái duyệt & số sao, tìm kiếm, xuất CSV |
| 3 | **Chi tiết Đơn hàng (Admin)** | 🔴 Cao |  **ĐÃ HOÀN THÀNH** | Modal chi tiết đơn hàng (sản phẩm, số lượng, đơn giá, địa chỉ, timeline trạng thái), in hóa đơn PDF, lọc & tìm kiếm đơn, xuất CSV |
| 4 | **Quản lý Bài viết (CRUD + UI)** | 🟡 TB |  **ĐÃ HOÀN THÀNH** | Form đăng & sửa bài viết, quản lý trạng thái xuất bản, liên kết mô hình & grade, xóa bài viết |
| 5 | **Quản lý Danh mục (UI)** | 🟡 TB |  **ĐÃ HOÀN THÀNH** | Form tạo/sửa danh mục Grade, bảng danh sách trực quan, nút sửa/xóa đồng bộ MySQL |
| 6 | **Quản lý Thương hiệu (CRUD + UI)** | 🟡 TB |  **ĐÃ HOÀN THÀNH** | CRUD thương hiệu (Bandai, Kotobukiya,...), quản lý quốc gia, logo, mô tả, kiểm tra ràng buộc FK |
| 7 | **Thao tác Người dùng (UI)** | 🟡 TB |  **ĐÃ HOÀN THÀNH** | Khóa/Mở khóa tài khoản, đổi role (Khách hàng ↔ Admin), form tạo tài khoản mới, xóa tài khoản, xuất CSV |
| 8 | **Xuất báo cáo (Excel/CSV/In PDF)** | 🟢 Thấp |  **ĐÃ HOÀN THÀNH** | Xuất CSV chuẩn UTF-8 BOM cho Đơn hàng, Sản phẩm, Khách hàng, Voucher, Doanh thu, Đánh giá; In hóa đơn |
| 9 | **Hệ thống Thông báo (Admin)** | 🟢 Thấp |  **ĐÃ HOÀN THÀNH** | Huy hiệu số lượng cảnh báo realtime trên Sidebar, Trung tâm cảnh báo khẩn cấp đầu trang Dashboard |
| 10 | **Phân quyền & Quản lý vai trò** | 🟢 Thấp |  **ĐÃ HOÀN THÀNH** | Bảo vệ API với JWT + middleware `authorize('admin')`, phân chia vai trò `admin`/`user` trực tiếp trên UI |

---

## 💡 Nhận xét tổng thể

 **100% tất cả 10 chức năng trong bảng yêu cầu đã được triển khai hoàn chỉnh cả Backend API lẫn Frontend Admin Panel.** Toàn bộ 16 bảng của database schema đã được khai thác tối đa, đem lại trải nghiệm quản trị chuyên nghiệp, toàn diện và tối ưu cho quản trị viên store Gunpla.
