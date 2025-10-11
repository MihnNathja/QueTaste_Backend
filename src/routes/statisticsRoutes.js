const express = require("express");
const statisticsController = require("../controllers/statisticsController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// GET /api/statistics/revenue?filterType=month&range=2025-09
router.get("/revenue", authMiddleware, adminMiddleware, statisticsController.getRevenue);

// GET /api/statistics/cashflow
router.get("/cashflow", authMiddleware, adminMiddleware, statisticsController.getCashFlow);

module.exports = router;