const chatService = require("../services/chatService");
const sendResponse = require("../utils/response");

exports.sendMessage = async (req, res) => {
  try {
    let { receiverId, content, type = "text" } = req.body;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat",
        resource_type: "auto",
      });
      content = result.secure_url;
      type = result.resource_type === "image" ? "image" : "file";
    }

    const sender = { id: req.user.id, role: req.user.role };
    const receiver = { id: receiverId }; // role sẽ query từ DB ở service thật
    const message = await chatService.sendMessage({ sender, receiver, content, type });
    return sendResponse(res, 201, true, "Message sent", message);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const messages = await chatService.getMessages(req.params.conversationId, page, limit);
    return sendResponse(res, 200, true, "Messages fetched", messages);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.markSeen = async (req, res) => {
  try {
    await chatService.markSeen(req.params.conversationId, req.user.id);
    return sendResponse(res, 200, true, "Messages marked as seen");
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getConversations(req.user.id, req.user.role);
    return sendResponse(res, 200, true, "Conversations fetched", conversations);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
