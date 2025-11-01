# 🌾 QueTaste Backend – Thương mại điện tử đặc sản vùng miền

QueTaste là hệ thống bán đặc sản quê hương theo mô hình thương mại điện tử.
Backend cung cấp REST API cho website giúp: quản lý sản phẩm, giỏ hàng, đơn hàng, thanh toán, người dùng và quản trị.
Hệ thống hỗ trợ nhiều vai trò: Khách vãng lai, Khách hàng, Quản trị viên và Nhân viên giao hàng.

---

## 🛠 Tech Stack

- Node.js / Express.js – Web server chính
- MongoDB + Mongoose – Lưu trữ dữ liệu sản phẩm, người dùng, đơn hàng
- JWT – Xác thực / phân quyền theo vai trò
- Cloudinary – Lưu trữ ảnh sản phẩm
- Nodemailer + OTP – Gửi mã xác thực email / khôi phục mật khẩu
- Socket.io – Thông báo realtime / chat / cập nhật trạng thái đơn

---

## 🔐 Phân quyền chính

### Khách vãng lai
- Xem danh sách / chi tiết sản phẩm
- Tìm kiếm, xem gợi ý sản phẩm tương tự
- Đăng ký, đăng nhập, khôi phục mật khẩu (OTP email)

### Khách hàng (đã đăng nhập)
- Quản lý giỏ hàng, đặt hàng, thanh toán (COD / ví điện tử)
- Áp mã giảm giá khi checkout
- Theo dõi trạng thái đơn hàng, hủy đơn khi còn cho phép
- Xác nhận đã nhận hàng, mua lại đơn cũ
- Lưu sản phẩm yêu thích, xem sản phẩm đã xem gần đây
- Đánh giá sản phẩm sau khi mua
- Nhắn tin với quản trị viên, nhận thông báo realtime

### Quản trị viên
- Quản lý sản phẩm (thêm / sửa / ẩn / cập nhật tồn kho, giá)
- Quản lý đơn hàng (xác nhận, hủy, phân công giao hàng)
- Quản lý người dùng, đánh giá, phiếu giảm giá
- Xem thống kê doanh thu / đơn hàng / sản phẩm bán chạy

### Nhân viên giao hàng
- Nhận danh sách đơn cần giao
- Cập nhật trạng thái: đang giao / đã giao / không giao được

---

## ✨ Nhóm chức năng API chính

### 1. Xác thực & tài khoản
- Đăng ký (gửi OTP qua email) / Xác thực OTP
- Đăng nhập / Đăng xuất / Làm mới access token
- Quên mật khẩu + đặt lại mật khẩu bằng OTP

### 2. Sản phẩm
- Tìm kiếm theo từ khóa / bộ lọc / vùng miền / giá
- Gợi ý sản phẩm khi gõ
- Xem chi tiết sản phẩm, sản phẩm tương tự
- Quản trị viên có thể thêm / sửa / ẩn / xóa sản phẩm và cập nhật tồn kho

### 3. Giỏ hàng
- Thêm sản phẩm vào giỏ
- Sửa số lượng
- Xóa sản phẩm khỏi giỏ
- Tính lại tổng tiền tạm tính theo số lượng và tồn kho

### 4. Thanh toán & Đơn hàng
- Tạo đơn hàng từ giỏ
- Áp voucher giảm giá
- Chọn phương thức thanh toán (COD / ví điện tử)
- Theo dõi đơn hàng
- Hủy đơn / yêu cầu hủy
- Xác nhận đã nhận hàng
- Admin: duyệt / huỷ / phân công giao cho shipper
- Shipper: cập nhật trạng thái giao hàng

### 5. Yêu thích / Đánh giá
- Lưu sản phẩm yêu thích
- Xem lại các sản phẩm đã xem gần đây
- Đánh giá sản phẩm (sao + bình luận sau khi mua)

### 6. Chat & thông báo realtime
- Người dùng ↔ Admin nhắn tin hỗ trợ
- Gửi thông báo sự kiện (đơn hàng thay đổi trạng thái, ưu đãi mới...)

### 7. Thống kê (Admin)
- Doanh thu, số đơn theo thời gian
- Sản phẩm bán chạy
- Hiệu suất khuyến mãi

---

## 📂 Cấu trúc thư mục (rút gọn)

```txt
backend/
├─ src/
│  ├─ models/          # User, Product, Order, Cart, Review, Coupon, Message, ...
│  ├─ controllers/     # Xử lý request/response
│  ├─ services/        # Business logic (CartService, ProductService, OrderService,...)
│  ├─ routes/          # Khai báo router Express theo module
│  ├─ middleware/      # authMiddleware, adminMiddleware, upload, ...
│  ├─ utils/           # JWT, sendMail(OTP), response wrapper
│  ├─ config/          # DB connection, Cloudinary, Socket
│  └─ app.js / server.js
└─ .env.example        # Biến môi trường
```

## ⚙️ Chạy Backend cục bộ

```txt
1. Clone repo
   git clone https://github.com/MihnNathja/QueTaste.git
   cd QueTaste/backend

2. Cài đặt dependency
   npm install

3. Tạo file .env (ví dụ)

   # MongoDB connection string
   MONGO_URI=mongodb+srv://<db_username>:<db_password>@<cluster-name>.<cluster-id>.mongodb.net/<database-name>

   # JWT secrets
   JWT_SECRET=<your_jwt_secret>
   JWT_REFRESH_SECRET=<your_jwt_refresh_secret>
   
   # Email service credentials
   EMAIL_USER=<your_email_address>
   EMAIL_PASS=<your_email_app_password>
   
   # Cloudinary config (lưu và truy xuất ảnh sản phẩm)
   CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
   CLOUDINARY_API_KEY=<your_cloudinary_api_key>
   CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>

4. Chạy server dev
   npm run dev

API mặc định chạy tại http://localhost:8080

```

## 👥 Nhóm thực hiện

Nhóm 13 – Khoa CNTT, ĐH Sư phạm Kỹ thuật TP.HCM
- Đỗ Phú Luân – 22110372
- Huỳnh Minh Mẫn – 22110377
- Đặng Minh Nhật – 22110389

Giảng viên hướng dẫn: ThS. Nguyễn Hữu Trung
