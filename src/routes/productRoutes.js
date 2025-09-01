const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

// Lấy tất cả sản phẩm (phân trang)
router.get("/", productController.getAllProducts);

// Lấy 08 sản phẩm mới nhất
router.get("/newest", productController.getNewestProducts);

// Lấy 06 sản phẩm bán chạy
router.get("/bestselling", productController.getBestSellingProducts);

// Lấy 08 sản phẩm được xem nhiều
router.get("/mostviewed", productController.getMostViewedProducts);

// Lấy 04 sản phẩm khuyến mãi cao nhất
router.get("/topdiscounted", productController.getTopDiscountedProducts);

router.get("/:id", productController.getProductById);
module.exports = router;
