// src/controllers/notificationController.js
const sendResponse = require("../utils/response");
const service = require("../services/notificationService");

exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);

    const data = await service.getUserNotifications(req.user.id, {
      page,
      limit,
      unreadOnly: req.query.unreadOnly === "true",
      type: req.query.type,
      priority: req.query.priority,
    });

    return sendResponse(res, 200, true, "Fetched notifications", { page, limit, ...data });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.markRead = async (req, res) => {
  try {
    const noti = await service.markAsRead(req.user.id, req.params.id);
    if (!noti) return sendResponse(res, 404, false, "Notification not found");

    const unreadCount = (await service.getUserNotifications(req.user.id, { page: 1, limit: 1 })).unreadCount;
    return sendResponse(res, 200, true, "Marked as read", { item: noti, unreadCount });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.markSeen = async (req, res) => {
  try {
    const noti = await service.markAsSeen(req.user.id, req.params.id);
    if (!noti) return sendResponse(res, 404, false, "Notification not found");
    return sendResponse(res, 200, true, "Marked as seen", noti);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.readAll = async (req, res) => {
  try {
    const result = await service.readAll(req.user.id);
    return sendResponse(res, 200, true, "All marked as read", {
      matched: result.matchedCount ?? result.n,
      modified: result.modifiedCount ?? result.nModified,
      unreadCount: 0,
    });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.seenAll = async (req, res) => {
  try {
    const result = await service.seenAll(req.user.id);
    return sendResponse(res, 200, true, "All marked as seen", {
      matched: result.matchedCount ?? result.n,
      modified: result.modifiedCount ?? result.nModified,
    });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

/* ADMIN */
exports.notifyUser = async (req, res) => {
  try {
    const { userId, type, message, link, priority = "normal", sendEmail = false } = req.body;
    if (!userId || !type || !message) {
      return sendResponse(res, 400, false, "userId, type, message are required");
    }
    const item = await service.notifyUser(userId, { type, message, link, priority, sendEmail });
    return sendResponse(res, 201, true, "Notification sent to user", item);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.broadcast = async (req, res) => {
  try {
    const { type, message, link, priority = "normal" } = req.body;
    if (!type || !message) return sendResponse(res, 400, false, "type, message are required");

    const list = await service.notifyAllUsers({ type, message, link, priority });
    return sendResponse(res, 201, true, "Broadcast sent", { count: list.length });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.notifyAdmins = async (req, res) => {
  try {
    const { type, message, link, priority = "high" } = req.body;
    if (!type || !message) return sendResponse(res, 400, false, "type, message are required");

    const list = await service.notifyAdmins({ type, message, link, priority });
    return sendResponse(res, 201, true, "Admins notified", { count: list.length });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
