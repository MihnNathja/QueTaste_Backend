const nodemailer = require("nodemailer");

/**
 * Hàm gửi mail OTP
 * @param {string} to - Email người nhận
 * @param {string} otp - Mã OTP cần gửi
 */

const sendOtpMail = async (to, otp) => {
    try {
        const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        });

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
                Vui lòng sử dụng mã này trong vòng <span style="color:#e63946; font-weight:bold;">1 phút</span>.
                Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.
                </p>

            </div>
            </body>
            </html>
            `;

        await transporter.sendMail({
        from: `"Đặc sản quê mình" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
        });

        console.log("📧 Email OTP sent successfully");
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw new Error("Could not send email");
    }
};

module.exports = sendOtpMail;
