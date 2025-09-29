const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

router.use(auth);

router.get("/conversations", chatController.getConversations);
router.get("/:conversationId/messages", chatController.getMessages);
router.post("/send", chatController.sendMessage);
router.put("/:conversationId/seen", chatController.markSeen);

module.exports = router;
