const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { getIO } = require("../config/socket");

async function sendMessage({ sender, receiver, content, type = "text" }) {
  // Tìm hoặc tạo conversation
  let conversation = await Conversation.findOne({
    "participants.user": { $all: [sender.id, receiver.id] },
  });

  if (!conversation) {
    const receiverRole = receiver.role || "user";
    const typeConversation =
      sender.role === "admin" || receiverRole === "admin" ? "user-admin" : "user-user";

    conversation = await Conversation.create({
      participants: [{ user: sender.id, role: sender.role }, { user: receiver.id, role: receiverRole }],
      type: typeConversation,
    });
  }

  // Tạo message
  const message = await Message.create({
    conversationId: conversation._id,
    sender: sender.id,
    receiver: receiver.id,
    type,
    content,
    seenBy: [sender.id], // người gửi auto seen
  });

  await message.populate("sender", "personalInfo.fullName avatar");
  await message.populate("receiver", "personalInfo.fullName avatar role");

  // Update lastMessageAt
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // Emit socket
  const io = getIO();
  const payload = { conversationId: conversation._id, message };

  io.to(receiver.id.toString()).emit("chat:message", payload);
  io.to(sender.id.toString()).emit("chat:message", payload);

  return message;
}

// Lazy load message (phân trang ngược)
async function getMessages(conversationId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

// Mark seen nhưng không emit realtime
async function markSeen(conversationId, userId) {
  await Message.updateMany(
    { conversationId, seenBy: { $ne: userId } },
    { $addToSet: { seenBy: userId } }
  );
}

async function getConversations(userId, role) {
  const filter = { "participants.user": userId };

  return Conversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .populate("participants.user", "personalInfo.fullName avatar role");
}

module.exports = { sendMessage, getMessages, markSeen, getConversations };
