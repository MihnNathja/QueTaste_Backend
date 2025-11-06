const Notification = require("../models/Notification");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { getIO } = require("../config/socket");
const { sendNotifyMail } = require("../utils/sendMail");

const populateNotification = (query) =>
  query
    .populate({
      path: "userId",
      select: "avatar personalInfo.fullName",
    })
    .populate({
      path: "mentionedUserId",
      select: "avatar personalInfo.fullName",
    })
    .populate({
      path: "productId",
      select: "name images",
      model: "Product",
    })
    .populate({
      path: "orderId",
      select: "_id status totalAmount",
      model: "Order",
    });

class NotificationService {
  /**
   * Gửi thông báo cho 1 user
   */
  static async notifyUser(userId, options) {
    const {
      type,
      message,
      link,
      priority = "normal",
      sendEmail = false,
      productId = null,
      orderId = null,
      mentionedUserId = null,
    } = options;

    // Tạo thông báo trong DB
    const notification = await Notification.create({
      userId,
      type,
      message,
      link,
      priority,
      productId,
      orderId,
      mentionedUserId,
    });

    // Populate dữ liệu
    const populated = await populateNotification(
      Notification.findById(notification._id)
    ).lean();

    // Gửi realtime qua socket
    try {
      getIO().to(userId.toString()).emit("notification", populated);
    } catch (err) {
      console.error("⚠️ Socket emit error:", err.message);
    }

    // Gửi email nếu có yêu cầu
    if (sendEmail) {
      const user = await User.findById(userId);
      if (user?.email) {
        console.log("📧 Sending notification email to:", user.email);
        await sendNotifyMail(
          user.email,
          "📢 Thông báo từ Đặc sản quê mình",
          message,
          link ? `${process.env.FRONTEND_URL || "http://localhost:3000"}${link}` : null
        );
        console.log("✅ Notification email sent!");
      }
    }

    return populated;
  }

  /**
   * Gửi thông báo đến tất cả admin
   */
  static async notifyAdmins(params) {
    const {
      type,
      message,
      link,
      priority = "high",
      sendEmail = false,
      productId = null,
      orderId = null,
      mentionedUserId = null,
    } = params;

    const admins = await User.find({ role: "admin" }, "_id email");
    const io = getIO();
    const notifications = [];

    for (const admin of admins) {
      const created = await Notification.create({
        userId: admin._id,
        type,
        message,
        link,
        priority,
        productId,
        orderId,
        mentionedUserId,
      });

      const populated = await populateNotification(
        Notification.findById(created._id)
      ).lean();

      io.to(admin._id.toString()).emit("notification", populated);

      if (sendEmail && admin.email) {
        await sendNotifyMail(
          process.env.EMAIL_USER,
          "📢 Thông báo từ Đặc sản quê mình",
          message,
          link ? `${process.env.FRONTEND_URL || "http://localhost:3000"}${link}` : null
        );
      }

      notifications.push(populated);
    }

    io.to("admins").emit("notification", { bulk: true, items: notifications });
    return notifications;
  }

  /**
   * Gửi thông báo đến tất cả người dùng
   */
  static async notifyAllUsers({
    type,
    message,
    link,
    priority = "normal",
    sendEmail = false,
    productId = null,
    mentionedUserId = null,
  }) {
    const users = await User.find({}, "_id email");
    const io = getIO();
    const notifications = [];

    for (const user of users) {
      const notification = await Notification.create({
        userId: user._id,
        type,
        message,
        link,
        priority,
        productId,
        mentionedUserId,
      });

      const populated = await populateNotification(
        Notification.findById(notification._id)
      ).lean();

      try {
        io.to(user._id.toString()).emit("notification", populated);
      } catch (e) {
        console.error("Emit broadcast error:", e.message);
      }

      if (sendEmail && user.email) {
        await sendNotifyMail(
          user.email,
          "📢 Thông báo từ Đặc sản quê mình",
          message,
          link ? `${process.env.FRONTEND_URL || "http://localhost:3000"}${link}` : null
        );
      }

      notifications.push(populated);
    }

    return notifications;
  }

  /**
   * Lấy thông báo của user (phân trang)
   */
  static async getUserNotifications(userId, { page, limit, unreadOnly, type, priority }) {
    const skip = (page - 1) * limit;

    const allowedMentionTypes = ["chat", "comment"];

    const filter = {
      $or: [
        { userId },
        { $and: [{ mentionedUserId: userId }, { type: { $in: allowedMentionTypes } }] },
      ],
    };

    if (unreadOnly) filter.isRead = false;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const query = Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [items, total, unreadCount] = await Promise.all([
      populateNotification(query).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return { items, total, unreadCount };
  }

  static async markAsRead(userId, id) {
    return Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, seenAt: new Date() },
      { new: true }
    );
  }

  static async markAsSeen(userId, id) {
    return Notification.findOneAndUpdate(
      { _id: id, userId },
      { seenAt: new Date() },
      { new: true }
    );
  }

  static async readAll(userId) {
    return Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, seenAt: new Date() }
    );
  }

  static async seenAll(userId) {
    return Notification.updateMany(
      { userId, seenAt: null },
      { seenAt: new Date() }
    );
  }
}

module.exports = NotificationService;
