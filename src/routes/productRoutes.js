const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

// Lấy tất cả sản phẩm (có phân trang + lọc + sort)
router.get("/", productController.getAllProducts);

// Lấy chi tiết sản phẩm theo id
router.get("/:id", productController.getProductById);

module.exports = router;
