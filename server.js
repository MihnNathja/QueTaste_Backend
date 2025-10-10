const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

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

const statisticsRoutes = require("./src/routes/statisticsRoutes");

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
app.use("/api/statistics", statisticsRoutes);

// Listen
const PORT = process.env.PORT || 8088;
app.listen(PORT, () => console.log(`?? Server running on port ${PORT}`));
