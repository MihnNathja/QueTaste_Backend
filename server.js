const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const postRoutes = require("./src/routes/postRoute");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const favoriteRoutes = require("./src/routes/favoriteRoutes");
const userViewRoutes = require("./src/routes/userViewRoutes");
const reviewRoutes = require("./src/routes/reviewRoutes");
const couponRoutes = require("./src/routes/couponRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

dotenv.config();
connectDB();
require("./src/jobs/couponJob");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/post", postRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/userviews", userViewRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/notifications", notificationRoutes);

// ====== Socket.IO ======
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Token invalid"));
    socket.user = decoded; // gắn user vào socket
    next();
  });
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // join room theo userId
  socket.join(socket.user.id);

  // nếu role = admin thì join room admin
  if (socket.user.role === "admin") {
    socket.join("admins");
  }

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

// export io để services khác dùng push notification
module.exports = { io };

// Listen
const PORT = process.env.PORT || 8088;
server.listen(PORT, () => console.log(`?? Server running on port ${PORT}`));
