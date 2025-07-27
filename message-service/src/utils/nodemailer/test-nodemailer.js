const nodemailer = require("nodemailer");
const path = require("path");

// Load .env from the auth-service root directory
require("dotenv").config({ path: path.join(__dirname, '../../../.env') });

console.log("Email Configuration:");
console.log("Host:", process.env.EMAIL_HOST);
console.log("Port:", process.env.EMAIL_PORT);
console.log("User:", process.env.EMAIL_USER);
console.log("Has Password:", !!process.env.EMAIL_PASS);
console.log("Frontend URL:", process.env.FRONTEND_URL);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testEmail() {
  try {
    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("Transporter verified successfully");

    console.log("Sending test email...");
    const result = await transporter.sendMail({
      from: `"Test App" <${process.env.EMAIL_USER}>`,
      to: "gaismail777@gmail.com",
      subject: "Test Email",
      text: "This is a test email from your auth service.",
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from your auth service.</p>
        <p>If you receive this, your email configuration is working correctly!</p>
      `,
    });
    
    console.log("Test email sent successfully");
    console.log("Message ID:", result.messageId);
  } catch (error) {
    console.error("Error sending test email:", error);
    console.error("Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
  }
}

testEmail();
