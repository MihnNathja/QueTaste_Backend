// src/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const ctrl = require("../controllers/notificationController");

router.use(auth);

// user endpoints
router.get("/", ctrl.getNotifications);
router.put("/:id/read", ctrl.markRead);
router.put("/:id/seen", ctrl.markSeen);
router.put("/read-all", ctrl.readAll);
router.put("/seen-all", ctrl.seenAll);

// admin endpoints
router.post("/admin/notify-user", admin, ctrl.notifyUser);
router.post("/admin/broadcast", admin, ctrl.broadcast);
router.post("/admin/notify-admins", admin, ctrl.notifyAdmins);

module.exports = router;
