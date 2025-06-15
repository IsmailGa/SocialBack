const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  try {
    await transporter.sendMail({
      from: `"Test App" <${process.env.EMAIL_USER}>`,
      to: "gaismail777@gmail.com",
      subject: "Test Email",
      text: "This is a gay club invite. Please join us for a fabulous time!",
      html: `
        <h2>Welcome to the Fabulous Gay Club!</h2>
        <p>We are excited to invite you to join us for a fabulous time filled with fun, laughter, and great company.</p>
        <p>Don't miss out on the excitement!</p>
      `,
    });
    console.log("Test email sent successfully");
  } catch (error) {
    console.error("Error sending test email:", error);
  }
}

testEmail();
