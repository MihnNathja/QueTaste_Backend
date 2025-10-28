const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Hàm gửi mail chung
 * @param {Object} options - Thông tin email
 * @param {string|string[]} options.to - Email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} [options.text] - Nội dung dạng text
 * @param {string} [options.html] - Nội dung dạng HTML
 * @param {Array} [options.attachments] - File đính kèm (tùy chọn)
 */
const sendMail = async (options = {}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Đặc sản quê mình" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || "",
      html: options.html || "",
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Could not send email");
  }
};

/**
 * Hàm gửi mail OTP
 * @param {string} to - Email người nhận
 * @param {string} otp - Mã OTP cần gửi
 */
const sendOtpMail = async (to, otp) => {
  const subject = "🔐 Xác thực tài khoản của bạn";
  const text = `Mã OTP của bạn là: ${otp}`;
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Xác thực tài khoản</title>
  </head>
  <body style="margin:0; padding:20px; font-family:Arial, sans-serif; background:#f9f9f9;">
    <div style="max-width:500px; margin:0 auto; background:#fff; border-radius:8px; padding:20px;
                box-shadow:0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="text-align:left; color:#333;">🔐 Xác thực tài khoản</h2>
      <p style="color:#444; font-size:14px; line-height:1.6;">
        Xin chào,<br/><br/>
        Bạn vừa đăng ký tài khoản. Đây là mã OTP của bạn:
      </p>
      <div style="text-align:center; margin:20px 0;">
        <span style="display:inline-block; background:#2563eb; color:#fff; font-size:22px;
                      letter-spacing:6px; padding:12px 24px; border-radius:6px; font-weight:bold;">
          ${otp}
        </span>
      </div>
      <p style="color:#555; font-size:13px; line-height:1.5;">
        Vui lòng sử dụng mã này trong vòng 
        <span style="color:#e63946; font-weight:bold;">1 phút</span>.
        Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.
      </p>
    </div>
  </body>
  </html>
  `;

  //  Gọi lại hàm sendMail đã tạo
  await sendMail({ to, subject, text, html });
};

// Hàm nhỏ để escape HTML an toàn
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Gửi email liên hệ (không dùng template)
 * @param {Object} formData - Dữ liệu form liên hệ
 * @param {string} formData.fullName - Họ và tên
 * @param {string} formData.email - Email người gửi
 * @param {string} formData.phone - Số điện thoại
 * @param {string} formData.message - Nội dung
 * @param {string|string[]} to - Địa chỉ email nhận (VD: support@yourbrand.com)
 * @param {Object} [opts] - Tùy chọn thêm
 * @param {string} [opts.fromName="Đặc sản quê mình"] - Tên hiển thị người gửi hệ thống
 */
async function sendContactEmail(formData, to = process.env.EMAIL_USER) {
  const fromName = "Đặc sản quê mình";

  // Escape dữ liệu đầu vào
  const fullName = escapeHtml((formData.fullName || "").trim());
  const email = escapeHtml((formData.email || "").trim());
  const phone = escapeHtml((formData.phone || "").trim());
  const message = escapeHtml((formData.message || "").trim());

  const subject = `📩 Liên hệ mới từ ${fullName || "Khách"}${
    phone ? ` (${phone})` : ""
  }`;
  const text = [
    "Thông tin liên hệ mới:",
    `- Họ tên: ${fullName}`,
    `- Email: ${email}`,
    `- SĐT: ${phone}`,
    "",
    "Nội dung:",
    message,
  ].join("\n");

  const html = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width"/>
    <title>${subject}</title>
  </head>
  <body style="margin:0; padding:20px; font-family:Arial, Helvetica, sans-serif; background:#f9fafb;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:10px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h2 style="margin:0 0 12px 0; color:#111827;">📩 Yêu cầu liên hệ mới</h2>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:14px; color:#374151;">
        <tr>
          <td style="padding:8px 0; width:120px; color:#6b7280;">Họ & tên</td>
          <td style="padding:8px 0;"><strong>${fullName || "-"}</strong></td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#6b7280;">Email</td>
          <td style="padding:8px 0;">${email || "-"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#6b7280;">Số điện thoại</td>
          <td style="padding:8px 0;">${phone || "-"}</td>
        </tr>
      </table>

      <div style="height:1px; background:#e5e7eb; margin:16px 0;"></div>

      <div style="font-size:14px; color:#111827;">
        <div style="margin-bottom:6px; color:#6b7280;">Nội dung:</div>
        <div style="white-space:pre-wrap; line-height:1.6;">${
          message || "(Trống)"
        }</div>
      </div>
    </div>

    <div style="text-align:center; color:#9ca3af; font-size:12px; margin-top:10px;">
      Email tự động từ hệ thống ${escapeHtml(fromName)}
    </div>
  </body>
  </html>
  `;

  // Gọi lại hàm sendMail đã có sẵn
  return await sendMail({
    to,
    subject,
    text,
    html,
  });

  
}

/**
 * ✉️ Gửi email thông báo (Notification)
 * @param {string} to - Email người nhận
 * @param {string} title - Tiêu đề ngắn (VD: "Đơn hàng #123 đã xác nhận")
 * @param {string} message - Nội dung thông báo
 * @param {string} [link] - Link để người dùng mở xem
 */
const sendNotifyMail = async (to, title, message, link = null) => {
  const subject = `📢 ${title}`;
  const safeMsg = escapeHtml(message);

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8" /><title>${subject}</title></head>
  <body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f9f9f9;">
    <div style="max-width:520px;margin:auto;background:#fff;border-radius:10px;padding:20px;
                box-shadow:0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color:#2563eb;">📢 ${escapeHtml(title)}</h2>
      <p style="color:#333;line-height:1.6;">${safeMsg}</p>
      ${
        link
          ? `<div style="margin-top:16px;text-align:center;">
              <a href="${link}" style="background:#2563eb;color:#fff;
              text-decoration:none;padding:10px 20px;border-radius:6px;display:inline-block;">
              Xem chi tiết</a></div>`
          : ""
      }
      <p style="text-align:center;font-size:12px;color:#999;margin-top:24px;">
        Email tự động từ hệ thống Đặc sản quê mình
      </p>
    </div>
  </body>
  </html>
  `;

  await sendMail({ to, subject, text: message, html });
};
module.exports = { sendMail, sendOtpMail, sendContactEmail, sendNotifyMail };
