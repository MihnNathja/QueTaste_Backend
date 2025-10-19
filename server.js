// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");

//   Load .env & Connect DB
dotenv.config();
connectDB();
require("./src/jobs/couponJob");
require("./src/jobs/orderJob");

//   Express setup
const app = express();
app.use(express.json());

//   CORS
const corsOptions = {
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

//   Routes
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
const adminProductRoutes = require("./src/routes/adminProductRoutes");
const statisticsRoutes = require("./src/routes/statisticsRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const contactRoutes = require("./src/routes/contactRoutes");

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
app.use("/api/statistics", statisticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/contact", contactRoutes);

//   HTTP + Socket.IO
const server = http.createServer(app);
initSocket(server);

//   Start server
const PORT = process.env.PORT || 8088;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
