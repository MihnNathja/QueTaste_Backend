const { sendContact } = require("../services/contactService");
const sendResponse = require("../utils/response");

// POST /api/contact/send
exports.sendContact = async (req, res) => {
  try {
    const formData = req.body;
    console.log(formData);
    // kiểm tra dữ liệu cơ bản
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.message
    ) {
      return sendResponse(res, 400, false, "Thiếu thông tin liên hệ");
    }

    // gọi hàm gửi mail
    await sendContact(formData);

    return sendResponse(res, 201, true, "Liên hệ đã được gửi thành công");
  } catch (err) {
    console.error("❌ Error in contact controller:", err);
    return sendResponse(res, 500, false, "Gửi liên hệ thất bại");
  }
};
