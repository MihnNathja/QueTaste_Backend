// src/services/notificationService.js
const Notification = require("../models/Notification");
const { io } = require("../../server");
const sendMail = require("../utils/sendMail");
const User = require("../models/User");
const { getIO } = require("../config/socket");
/**
 * Gửi thông báo cho 1 user
 */
const notifyUser = async (userId, { type, message, link, priority = "normal", sendEmail = false }) => {
  const notification = await Notification.create({ userId, type, message, link, priority });

  // emit realtime
  try {
    getIO().to(userId.toString()).emit("notification", notification);
  } catch (e) {
    console.error("Emit error:", e.message);
  }

  // gửi email (không chặn)
  if (sendEmail) {
    try {
      const user = await User.findById(userId);
      if (user?.email) {
        await sendMail(user.email, message);
      }
    } catch (err) {
      console.error("❌ Error sending email:", err.message);
    }
  }

  return notification;
};

/**
 * Gửi thông báo cho tất cả admin
 */
const notifyAdmins = async ({ type, message, link, priority = "high" }) => {
  const admins = await User.find({ role: "admin" }, "_id");
  const io = getIO();
  const notifications = [];

  for (const admin of admins) {
    const n = await Notification.create({ userId: admin._id, type, message, link, priority });
    try {
      io.to(admin._id.toString()).emit("notification", n);
    } catch (e) {
      console.error("Emit admin error:", e.message);
    }
    notifications.push(n);
  }

  try {
    io.to("admins").emit("notification", { bulk: true, items: notifications });
  } catch (e) {
    console.error("Emit room admins error:", e.message);
  }
  return notifications;
};

/**
 * Broadcast đến tất cả user
 */
const notifyAllUsers = async ({ type, message, link, priority = "normal" }) => {
  const users = await User.find({}, "_id");
  const io = getIO();
  const notifications = [];

  for (const user of users) {
    const n = await Notification.create({ userId: user._id, type, message, link, priority });
    try {
      io.to(user._id.toString()).emit("notification", n);
    } catch (e) {
      console.error("Emit all users error:", e.message);
    }
    notifications.push(n);
  }

  return notifications;
};

/**
 * CRUD helpers cho controller
 */
const getUserNotifications = async (userId, { page, limit, unreadOnly, type, priority }) => {
  const skip = (page - 1) * limit;
  const filter = { userId };
  if (unreadOnly) filter.isRead = false;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { items, total, unreadCount };
};

const markAsRead = async (userId, id) => {
  return Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true, seenAt: new Date() },
    { new: true }
  );
};

const markAsSeen = async (userId, id) => {
  return Notification.findOneAndUpdate(
    { _id: id, userId },
    { seenAt: new Date() },
    { new: true }
  );
};

const readAll = async (userId) => {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true, seenAt: new Date() });
};

const seenAll = async (userId) => {
  return Notification.updateMany({ userId, seenAt: null }, { seenAt: new Date() });
};

module.exports = {
  notifyUser,
  notifyAdmins,
  notifyAllUsers,
  getUserNotifications,
  markAsRead,
  markAsSeen,
  readAll,
  seenAll,
};
