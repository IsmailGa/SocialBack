const nodemailer = require("nodemailer");
require("dotenv").config();
const db = require("../../models");
const logger = require("../logger");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, username, verificationToken) => {
  if (!email || !username || !verificationToken) {
    throw new Error("Email, username, and verification token are required");
  }

  const verificationUrl = `${process.env.FRONTEND_URL}/api/v1/auth/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Socialka " <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <h2>Hello, ${username}!</h2>
      <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If the button above doesn't work, copy and paste this link into your browser:</p>
      <p>Don't share this link with anyone else:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>Socialka</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    throw new Error("Failed to send verification email");
  }
};

const sendResetPassword = async (user, token) => {
  if (!user.email || !user.username || !token) {
    throw new Error("Email, username, and verification token are required");
  }

  const link = `${process.env.FRONTEND_URL}/api/v1/auth/reset-password?token=${token}&id=${user.id}&password=${user.passwordHash}`;

  const mailOptions = {
    from: `"Socialka " <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Verify Your Email Address",
    html: `
      <h2>Hello, ${user.username}!</h2>
      <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If the button above doesn't work, copy and paste this link into your browser:</p>
      <p>Don't share this link with anyone else:</p>
      <p>${link}</p>
      <p>This link will expire within 1 hour.</p>
      <p>Best regards,<br>Socialka</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset password link sent to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send reset password link to ${user.email}:`, error);
    throw new Error("Failed to reset password link");
  }
};

module.exports = { sendVerificationEmail, sendResetPassword };
