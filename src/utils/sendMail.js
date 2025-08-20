const nodemailer = require("nodemailer");

const sendMail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
        service: "gmail", // hoặc smtp riêng nếu bạn có
        auth: {
            user: process.env.EMAIL_USER, // email gửi
            pass: process.env.EMAIL_PASS, // mật khẩu ứng dụng (app password)
        },
        });

        await transporter.sendMail({
        from: `"Đặc sản quê mình" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        });

        console.log("✅ Email sent successfully");
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw new Error("Could not send email");
    }
};

module.exports = sendMail;
