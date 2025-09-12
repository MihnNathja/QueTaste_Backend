const express = require("express");
const orderController = require("../controllers/orderController");
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router();

router.post("/checkout", authMiddleware, orderController.checkout);
router.get("/me", authMiddleware, orderController.getMyOrders);

module.exports = router;
