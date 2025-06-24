const { Session } = require("../models");
const bcrypt = require("bcrypt");
const { generateTokens } = require("../utils/jwt/jwtGenerate");
const {
  sendVerificationEmail,
  sendResetPassword,
} = require("../utils/nodemailer/nodemailer");
const jwt = require("jsonwebtoken");
const axios = require("../utils/api/axios");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../utils/logger");

const register = async (req, res, next) => {
  const {
    username,
    email,
    password,
    fullName = null,
    roleName = "user",
  } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return next(
      new AppError(400, "Required fields: username, email, password")
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRoleName = roleName.trim().toLowerCase();

  try {
    // Check for existing user
    const checkUserResponse = await axios.get(
      `/users/check-email?email=${normalizedEmail}`
    );

    if (checkUserResponse.data?.data?.exists) {
      return next(new AppError(409, "User with this email already exists"));
    }

    // Validate password length
    if (password.length < 8) {
      return next(
        new AppError(400, "Password must be at least 8 characters long")
      );
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return next(
        new AppError(
          400,
          "Password must contain at least one special character"
        )
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const verificationToken = jwt.sign(
      { normalizedEmail, username },
      process.env.EMAIL_VERIFICATION_SECRET,
      { expiresIn: "1h" }
    );

    const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Create user
    const createUserResponse = await axios.post(`/users`, {
      username: username,
      email: normalizedEmail,
      password: passwordHash,
      fullName: fullName,
      roleName: normalizedRoleName,
      verificationToken: verificationToken,
      verificationTokenExpires: verificationTokenExpires,
      isEmailVerified: false,
      isPrivate: false,
      isDeleted: false,
    });

    if (!createUserResponse.data?.data) {
      logger.error("Failed to create user in user service", {
        response: createUserResponse.data,
        username,
        email: normalizedEmail,
      });
      return next(new AppError(500, "Failed to create user in user service"));
    }

    const userData = createUserResponse.data.data;

    // Send verification email
    try {
      await sendVerificationEmail(
        userData.email,
        userData.username,
        verificationToken
      );
    } catch (emailError) {
      logger.error("Failed to send verification email", {
        error: emailError.message,
        userId: userData.id,
        email: userData.email,
      });
      // Don't return error, just log it
    }

    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        createdAt: userData.createdAt,
      },
    });
  } catch (error) {
    logger.error("Registration error", {
      error: error.message,
      username,
      email: normalizedEmail,
      roleName: normalizedRoleName,
    });

    if (error.response?.data) {
      const statusCode = error.response.status || 500;
      const message = error.response.data.message || "Failed to register user";
      return next(new AppError(statusCode, message));
    }

    return next(new AppError(500, "Failed to register user"));
  }
};

const login = async (req, res, next) => {
  const { email, password, lastLogin = new Date().toISOString() } = req.body;

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
      return next(new AppError(401, "Invalid email or password"));
    }

    const user = userResponse.data.data;

    // 2. Check password
    if (!user.passwordHash) {
      logger.warn("No password hash found for user", {
        email: normalizedEmail,
      });
      return next(new AppError(401, "Invalid email or password"));
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn("Invalid password", { email: normalizedEmail });
      return next(new AppError(401, "Invalid email or password"));
    }

    // 3. Generate tokens
    const tokens = await generateTokens({
      email: user.email,
      roleName: user.role,
      id: user.id,
    });
    if (!tokens.success) {
      logger.error("Failed to generate tokens", {
        userId: user.id,
        error: tokens.message,
      });
      return next(new AppError(500, "Failed to generate tokens"));
    }

    // 4. Set refresh token cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    logger.info("Attempting to change lastLogin");

    await axios.patch(`/users/${user.id}`, { lastLogin: lastLogin });

    // 5. Return user info and access token
    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          lastLogin: user.lastLogin || "there is no last login",
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

    // Check if token is expired
    if (
      user.verificationTokenExpires &&
      new Date() > new Date(user.verificationTokenExpires)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Verification token has expired",
      });
    }

    // Update user verification status
    await axios.patch(`/users/${user.id}`, {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
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

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const userResponse = await axios.get(`/users/get-by-email?email=${email}`);

  logger.info("Getting info", userResponse.data?.data);

  if (!userResponse.data?.data) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  const user = userResponse.data.data;
  const secret = process.env.RESET_TOKEN_SECRET + user.password;
  const token = jwt.sign({ id: user.id, email: user.email }, secret, {
    expiresIn: "1h",
  });
  try {
    logger.info("data", {
      email: user.email,
      username: user.username,
      token: token,
    });
    await sendResetPassword(user.email, user.username, token);
    return res.status(200).json({ message: "Reset link sent" });
  } catch (emailError) {
    logger.error("Failed to send reset password token", {
      error: emailError.message,
      userId: user.id,
      email: user.email,
    });
    // Don't return error, just log it
  }
};

const resetPassword = async (req, res) => {
  const { id, token, password } = req.body;

  const userResponse = await axios.get(`/users/${id}`);

  logger.info("Getting info", userResponse.data?.data);

  if (!userResponse.data?.data) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  const secret = process.env.RESET_TOKEN_SECRET + user.password;
  try {
    jwt.verify(token, secret);
    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    await user.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
