const { Session } = require("../models");
const bcrypt = require("bcrypt");
const { generateTokens } = require("../utils/jwt/jwtGenerate");
const axios = require("../utils/api/axios");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../utils/logger");

exports.login = async (req, res, next) => {
  const { email, password, lastLogin = new Date().toISOString() } = req.body;
  const deviceInfo = req.headers["user-agent"] || "Unknown";
  const ipAddress = req.ip || "Unknown";

  if (!email || !password) {
    logger.warn("Login attempt with missing credentials", {
      hasEmail: !!email,
      hasPassword: !!password,
    });
    return next(new AppError(400, "Required fields: email, password"));
  }

  const normalizedEmail = email.trim().toLowerCase();
  logger.info("Attempting to login user", { email: normalizedEmail });

  try {
    // 1. Find user by email
    const userResponse = await axios.get(
      `/users/get-by-email?email=${normalizedEmail}`
    );

    if (!userResponse.data?.data) {
      logger.warn("User not found during login", { email: normalizedEmail });
      return next(new AppError(401, "Invalid email or password 3"));
    }

    const user = userResponse.data.data;

    const passwordHashResponse = await axios.get(
      `/users/get-password-hash?email=${normalizedEmail}`
    );

    if (!passwordHashResponse.data?.data) {
      logger.warn("No password hash found for user", {
        email: normalizedEmail,
      });
      return next(new AppError(401, "Invalid email or password 4"));
    }

    const passwordHash = passwordHashResponse.data.data.passwordHash;

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      logger.warn("Invalid password", { email: normalizedEmail });
      return next(new AppError(401, "Invalid email or password 5"));
    }

    // 3. Generate tokens
    const tokens = await generateTokens({
      email: user.email,
      role: user.role,
      id: user.id,
    });
    if (!tokens.success) {
      logger.error("Failed to generate tokens", {
        userId: user.id,
        error: tokens.message,
      });
      return next(new AppError(500, "Failed to generate tokens"));
    }

    // 4. Calculate refresh token expiration (assuming 7 days from jwtGenerate)
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 5. Store session in database
    await Session.create({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt,
      deviceInfo,
      ipAddress,
      isActive: true,
    });

    // 6. Set refresh token cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Update last login
    logger.info("Attempting to update lastLogin");
    await axios.patch(`/users/${user.id}`, { lastLogin: lastLogin });

    // 8. Return user info and access token
    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          lastLogin: lastLogin,
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    logger.error("Login error", {
      error: error.message,
      stack: error.stack,
      email: normalizedEmail,
      response: error.response?.data,
    });

    if (error.response?.data) {
      const statusCode = error.response.status || 500;
      const message = error.response.data.message || "Failed to login";
      return next(new AppError(statusCode, message));
    }

    return next(new AppError(500, "Failed to login"));
  }
};