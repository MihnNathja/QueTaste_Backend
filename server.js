const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./src/config/db");
const { initSocket, getIO } = require("./src/config/socket");
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
const chatRoutes = require("./src/routes/chatRoutes");
const adminProductRoutes = require("./src/routes/adminProductRoutes");
const statisticsRoutes = require("./src/routes/statisticsRoutes");
dotenv.config();
connectDB();
require("./src/jobs/couponJob");

const app = express();
const corsOptions = {
  origin: ["http://localhost:5173"], // FE local
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // true nếu dùng cookie
};
// Middleware
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/post", postRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/userviews", userViewRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/coupon", couponRoutes);
dotenv.config();
connectDB();
require("./src/jobs/couponJob");

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
app.use("/api/statistics", statisticsRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
// ====== Socket.IO ======
const server = http.createServer(app);
const io = initSocket(server);io.use((socket, next) => {
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
