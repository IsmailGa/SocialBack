const { AuthToken, TokenTypes } = require("../models");
const bcrypt = require("bcrypt");
const {
  sendVerificationEmail,
} = require("../utils/nodemailer/nodemailer");
const jwt = require("jsonwebtoken");
const axios = require("../utils/api/axios");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../utils/logger");


exports.register = async (req, res, next) => {
  const {
    username,
    email,
    password,
    fullName = null,
    roleName = "user",
  } = req.body;

  logger.info("Registration started", {
    username,
    email,
    hasPassword: !!password,
    fullName,
    roleName,
    hasEmailSecret: !!process.env.EMAIL_VERIFICATION_SECRET,
    hasUserServiceUrl: !!process.env.USER_SERVICE_URL,
  });

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

    logger.info("Email check response", {
      exists: checkUserResponse.data?.data?.exists,
      response: checkUserResponse.data,
    });

    if (checkUserResponse.data?.data?.exists) {
      return next(new AppError(409, "User with this email already exists"));
    }

    // Validate password length
    if (password.length < 8) {
      return next(
        new AppError(400, "Password must be at least 8 characters long")
      );
    }
    if (!/[!@#$%^&*(),.?":{}|<>A-z]/.test(password)) {
      return next(
        new AppError(
          400,
          "Password must contain at least one special character"
        )
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    logger.info("Password hashed successfully");

    // Create user
    logger.info("Attempting to create user in user service");
    const createUserResponse = await axios.post(`/users`, {
      username: username,
      email: normalizedEmail,
      password: passwordHash,
      fullName: fullName,
      roleName: normalizedRoleName,
      isEmailVerified: false,
      isPrivate: false,
      isDeleted: false,
    });

    logger.info("User creation response", {
      hasData: !!createUserResponse.data,
      hasDataData: !!createUserResponse.data?.data,
      responseStatus: createUserResponse.status,
      responseData: createUserResponse.data,
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

    const verificationToken = jwt.sign(
      { email: normalizedEmail, username },
      process.env.EMAIL_VERIFICATION_SECRET,
      { expiresIn: "1h" }
    );

    const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    let verificationType;
    try {
      verificationType = await TokenTypes.findOne({
        where: { token: "emailVerification" },
      });
      if (!verificationType) {
        logger.error("Email verification token type not found in database");
        return next(
          new AppError(500, "Email verification configuration error")
        );
      }
    } catch (dbError) {
      logger.error("Database error during token type lookup", {
        error: dbError.message,
        stack: dbError.stack,
      });
      return next(new AppError(500, "Database error during token type lookup"));
    }

    try {
      const authTokenData = {
        token: verificationToken,
        userId: userData.id,
        tokenTypeId: verificationType.id,
        expiresAt: verificationTokenExpires,
        isUsed: false,
      };

      logger.info("AuthToken data to create", {
        tokenLength: authTokenData.token.length,
        userId: authTokenData.userId,
        userIdType: typeof authTokenData.userId,
        tokenTypeId: authTokenData.tokenTypeId,
        tokenTypeIdType: typeof authTokenData.tokenTypeId,
        expiresAt: authTokenData.expiresAt,
        isUsed: authTokenData.isUsed,
      });

      await AuthToken.create(authTokenData);

      logger.info("AuthToken created successfully");
    } catch (authTokenError) {
      logger.error("Database error during AuthToken creation", {
        error: authTokenError.message,
        stack: authTokenError.stack,
        userId: userData.id,
        tokenTypeId: verificationType.id,
      });
      return next(
        new AppError(500, "Database error during AuthToken creation")
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail(
        userData.email,
        userData.username,
        verificationToken
      );

      logger.info("Verification email sent successfully", {
        userId: userData.id,
        email: userData.email,
      });
    } catch (emailError) {
      logger.error("Failed to send verification email", {
        error: emailError.message,
        stack: emailError.stack,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode,
        userId: userData.id,
        email: userData.email,
        username: userData.username,
      });
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
      stack: error.stack,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
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