const { Session, AuthToken, TokenTypes } = require("../models");
const bcrypt = require("bcrypt");
const {
  sendVerificationEmail,
  sendResetPassword,
} = require("../utils/nodemailer/nodemailer");
const jwt = require("jsonwebtoken");
const axios = require("../utils/api/axios");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../utils/logger");

const { register } = require("./register.controller");
const { login } = require("./login.controller");


// # LOGOUT
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(204).json({
        status: "success",
        message: "No active session",
      });
    }

    // Invalidate session in database
    const session = await Session.findOne({
      where: { refreshToken, isActive: true },
    });

    if (session) {
      await session.update({
        isActive: false,
        updatedAt: new Date(),
      });
      logger.info("Session invalidated", {
        userId: session.userId,
        sessionId: session.id,
      });
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error", {
      error: error.message,
      stack: error.stack,
    });

    return next(new AppError(500, "Failed to logout"));
  }
};

// # VERIFY EMAIL

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      status: "error",
      message: "Verification token is required",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
    const { email } = decoded;

    // Get user by email
    const userResponse = await axios.get(`/users/get-by-email?email=${email}`);

    if (!userResponse.data?.data) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification token",
      });
    }

    const user = userResponse.data.data;

    const verificationToken = await AuthToken.findOne({
      where: {
        token: token,
      },
    });

    if (!verificationToken) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification token",
      });
    }

    if (
      verificationToken.expiresAt &&
      new Date() > new Date(verificationToken.expiresAt)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Verification token has expired",
      });
    }

    // Update user verification status
    await axios.patch(`/users/${user.id}`, {
      isEmailVerified: true,
    });

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    logger.error("Failed to verify email:", {
      error: error.message,
      token: token,
    });

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        status: "error",
        message: "Verification token has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({
        status: "error",
        message: "Invalid verification token",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Failed to verify email",
      error: error.message,
    });
  }
};

// # RESENDVERIFICATIONEMAIL

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: "error",
      message: "Email is required",
    });
  }

  try {
    // Get user by email
    const userResponse = await axios.get(`/users/get-by-email?email=${email}`);

    logger.info("Getting info", userResponse.data?.data);

    if (!userResponse.data?.data) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const user = userResponse.data.data;

    if (user.isEmailVerified) {
      return res.status(400).json({
        status: "error",
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      { email: user.email, username: user.username },
      process.env.EMAIL_VERIFICATION_SECRET,
      { expiresIn: "1h" }
    );

    const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with new token
    await axios.patch(`/users/${user.id}`, {
      verificationToken,
      verificationTokenExpires,
    });

    // Send new verification email
    await sendVerificationEmail(user.email, user.username, verificationToken);

    return res.status(200).json({
      status: "success",
      message: "Verification email sent successfully",
    });
  } catch (error) {
    logger.error("Failed to resend verification email:", {
      error: error.message,
      email: email,
    });

    return res.status(500).json({
      status: "error",
      message: "Failed to resend verification email",
      error: error.message,
    });
  }
};

// # FORGOTPASSWORD

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: "error",
      message: "Email is required",
    });
  }

  try {
    const userResponse = await axios.get(`/users/get-by-email?email=${email}`);

    logger.info("Getting info", userResponse.data?.data);

    if (!userResponse.data?.data) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const user = userResponse.data.data;
    const secret = process.env.RESET_TOKEN_SECRET + user.passwordHash;
    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "1h",
    });

    const resetToken = await TokenTypes.findOne({
      where: { token: "passwordReset" },
    });

    await AuthToken.create({
      userId: user.id,
      tokenTypeId: resetToken.id,
      token: token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    logger.info("data", {
      email: user.email,
      username: user.username,
      token: token,
    });

    await sendResetPassword(user, token);
    return res.status(200).json({
      status: "success",
      message: "Reset link sent",
    });
  } catch (emailError) {
    logger.error("Failed to send reset password token", {
      error: emailError.message,
      userId: user?.id,
      email: email,
    });

    return res.status(500).json({
      status: "error",
      message: "Failed to send reset password email",
      error: emailError.message,
    });
  }
};

// # RESETPASSWORD

const resetPassword = async (req, res) => {
  const { id, token } = req.query;
  const { password } = req.body;

  if (!id || !token || !password) {
    return res.status(400).json({
      status: "error",
      message: "ID, token, and password are required",
    });
  }

  try {
    const resetToken = await AuthToken.findOne({
      where: {
        userId: id,
        token: token,
        tokenTypeId: (
          await TokenTypes.findOne({ where: { token: "passwordReset" } })
        ).id,
      },
    });

    if (!resetToken) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired reset token",
      });
    }

    if (token !== resetToken.token) {
      return res.status(400).json({
        status: "error",
        message: "Invalid reset token",
      });
    }

    const userResponse = await axios.get(`/users/${id}`);

    logger.info("Getting info", userResponse.data?.data);

    if (!userResponse.data?.data) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const user = userResponse.data.data;
    const secret = process.env.RESET_TOKEN_SECRET + user.passwordHash;

    try {
      jwt.verify(token, secret);
    } catch (jwtError) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters long",
      });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        status: "error",
        message: "Password must contain at least one special character",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await axios.patch(`/users/${user.id}`, {
      passwordHash: hash,
    });

    return res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    logger.error("Reset password error", {
      error: error.message,
      userId: id,
    });

    return res.status(500).json({
      status: "error",
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  logout,
};
