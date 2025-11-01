# 🌾 QueTaste Backend – API thương mại điện tử đặc sản vùng miền

QueTaste là hệ thống bán đặc sản quê hương theo mô hình thương mại điện tử.  
Backend cung cấp REST API cho web app: quản lý sản phẩm, giỏ hàng, đơn hàng, thanh toán, người dùng và quản trị.  Hệ thống hỗ trợ nhiều vai trò: Khách vãng lai, Khách hàng (đăng nhập), Quản trị viên và Nhân viên giao hàng. :contentReference[oaicite:0]{index=0}

---

## 🛠 Tech Stack

- **Node.js / Express.js** – Web server chính
- **MongoDB + Mongoose** – Lưu trữ dữ liệu sản phẩm, người dùng, đơn hàng
- **JWT** – Xác thực / phân quyền theo vai trò
- **Cloudinary** – Lưu trữ ảnh sản phẩm
- **Nodemailer + OTP** – Gửi mã xác thực email / khôi phục mật khẩu :contentReference[oaicite:1]{index=1}
- **Socket (WebSocket)** – Thông báo realtime / chat / cập nhật trạng thái đơn :contentReference[oaicite:2]{index=2}

---

## 🔐 Phân quyền chính

- **Khách vãng lai**
  - Xem danh sách / chi tiết sản phẩm
  - Tìm kiếm, xem gợi ý sản phẩm tương tự
  - Đăng ký, đăng nhập, khôi phục mật khẩu :contentReference[oaicite:3]{index=3}

- **Khách hàng (đã đăng nhập)**
  - Quản lý giỏ hàng, đặt hàng, thanh toán COD / ví điện tử
  - Theo dõi đơn hàng, hủy đơn (khi còn cho phép), xác nhận đã nhận
  - Xem lịch sử mua, mua lại nhanh
  - Đánh giá sản phẩm, lưu sản phẩm yêu thích
  - Nhắn tin với quản trị viên, nhận thông báo hệ thống :contentReference[oaicite:4]{index=4}

- **Quản trị viên**
  - Quản lý sản phẩm (thêm / sửa / ẩn / cập nhật tồn kho, giá)
  - Quản lý đơn hàng (xác nhận, phân công giao hàng, hủy đơn trong khung cho phép)
  - Quản lý người dùng, đánh giá, bài viết, phiếu giảm giá
  - Xem thống kê doanh thu / đơn hàng / sản phẩm bán chạy :contentReference[oaicite:5]{index=5}

- **Nhân viên giao hàng**
  - Xem các đơn cần giao
  - Cập nhật trạng thái (đang giao / đã giao / hủy giao) :contentReference[oaicite:6]{index=6}

---

## ✨ Các nhóm chức năng API chính

### 1. Xác thực & tài khoản
- Đăng ký (kèm OTP qua email), Xác thực OTP
- Đăng nhập / Đăng xuất / Refresh token
- Quên mật khẩu + Đặt lại mật khẩu bằng OTP email :contentReference[oaicite:7]{index=7}

### 2. Sản phẩm
- Tìm kiếm sản phẩm theo từ khóa / bộ lọc / vùng miền / giá
- Gợi ý sản phẩm liên quan khi gõ từ khóa
- Xem chi tiết sản phẩm, sản phẩm tương tự, sản phẩm đã xem gần đây
- Quản trị viên có thể thêm / sửa / ẩn / cập nhật tồn kho / xoá sản phẩm :contentReference[oaicite:8]{index=8}

### 3. Giỏ hàng
- Thêm sản phẩm vào giỏ
- Sửa số lượng trong giỏ
- Xóa sản phẩm khỏi giỏ
- Tính lại tổng tiền tạm tính theo số lượng và tồn kho :contentReference[oaicite:9]{index=9}

### 4. Thanh toán & Đơn hàng
- Tạo đơn hàng từ giỏ
- Áp dụng mã giảm giá hợp lệ
- Chọn hình thức thanh toán (COD / ví điện tử)
- Theo dõi trạng thái đơn hàng
- Hủy đơn (khách) trong điều kiện cho phép
- Xác nhận đã nhận hàng
- Admin xác nhận / huỷ đơn / gán giao hàng / cập nhật trạng thái
- Shipper cập nhật "đang giao" / "đã giao" / "hủy giao" :contentReference[oaicite:10]{index=10}

### 5. Đánh giá & yêu thích
- Khách đã mua có thể đánh giá (1–5 sao + bình luận)
- Lưu/truy xuất sản phẩm yêu thích
- Admin có thể ẩn đánh giá không phù hợp :contentReference[oaicite:11]{index=11}

### 6. Chat & thông báo realtime
- Người dùng và quản trị viên có thể nhắn tin
- Hệ thống thông báo thay đổi trạng thái đơn hàng, trả lời hỗ trợ, khuyến mãi mới :contentReference[oaicite:12]{index=12}

### 7. Thống kê (Admin)
- Doanh thu, số đơn theo giai đoạn
- Sản phẩm bán chạy
- Hiệu suất khuyến mãi / mã giảm giá :contentReference[oaicite:13]{index=13}

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
