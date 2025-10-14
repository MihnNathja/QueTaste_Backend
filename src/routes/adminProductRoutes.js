const express = require("express");
const productController = require("../controllers/productController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const setVisibility = require("../middleware/visibilityMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware, setVisibility('admin'));

router.get("/", productController.getAllProducts);
router.get("/suggest", productController.suggestProducts);
router.post("/", upload.array("images", 5), productController.createProduct);

router.patch("/bulk/hide", productController.bulkHide);
router.patch("/bulk/show", productController.bulkShow);

router.get("/:id", productController.getProductById);
router.put("/:id", upload.array("images", 5), productController.updateProduct);
router.patch("/:id/toggle", productController.toggleActive);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
