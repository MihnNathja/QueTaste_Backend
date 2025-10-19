const { sendContactEmail } = require("../utils/sendMail");

const sendContact = async (formData) => {
  try {
    return await sendContactEmail(formData);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
};

module.exports = { sendContact };
