"use strict";
require("dotenv").config();
const jwt = require("jsonwebtoken");
const axios = require("../api/axios.js");
const { Session } = require("../../models/index.js");
const logger = require("../logger.js");

const generateTokens = async (user) => {
  try {
    if (!user) {
      throw new Error("Not provided data");
    }

    const payload = {
      id: user.id,
      email: user.email,
      roleId: user.role,
    };
    console.log(payload);
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new Error(
        "ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET is not defined"
      );
    }

    const accessTokenOptions = { expiresIn: process.env.ACCESS_TOKEN_EXPIRY };
    const refreshTokenOptions = {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    };

    const accessToken = jwt.sign(payload, accessSecret, accessTokenOptions);
    const refreshToken = jwt.sign(payload, refreshSecret, refreshTokenOptions);

    return {
      success: true,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Error generating tokens:", error.message);
    return {
      success: false,
      message: error.message || "Failed to generate tokens",
    };
  }
};

const deleteToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) return res.sendStatus(204); // Changed from jwt to refreshToken
    const refreshToken = cookies.refreshToken; // Changed from jwt to refreshToken
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new Error("REFRESH_TOKEN_SECRET is not defined");
    }

    // Clear the cookie (also update the name here)
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    jwt.verify(refreshToken, refreshSecret, (err, decoded) => {
      if (err) return res.sendStatus(204);
      console.log("Token deleted successfully:", decoded);
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting token:", error.message);
    return res.sendStatus(500);
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) return res.sendStatus(401);
    const refreshToken = cookies.refreshToken;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new Error("REFRESH_TOKEN_SECRET is not defined");
    }

    const decoded = jwt.verify(refreshToken, refreshSecret);
    const userCheck = await axios.get(`/api/v1/users/${decoded.id}`);
    if (!userCheck || !userCheck.data) {
      throw new Error("User not found");
    }

    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, roleId: decoded.roleId },
      accessSecret,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );

    return res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    console.error("Error refreshing token:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid or expired refresh token",
    });
  }
};

// Validates JWT access token from the Authorization header
const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Invalid or missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token is required" });
    }

    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!accessSecret) {
      console.error("ACCESS_TOKEN_SECRET is not defined");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, accessSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      console.error("Error validating token:", error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

const validateRefreshToken = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token is missing",
      });
    }

    const refreshToken = cookies.refreshToken;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new Error("REFRESH_TOKEN_SECRET is not defined");
    }

    // Verify the refresh token and extract the user ID
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const userId = decoded.id;

    // Check if the session exists and is active
    const session = await Session.findOne({
      where: { userId: userId, refreshToken, isActive: true },
    });
    if (!session) {
      return res.status(403).json({
        status: "error",
        message: "Invalid or revoked refresh token",
      });
    }

    // Attach the user ID to the request for the next middleware
    req.userId = userId;

    next();
  } catch (error) {
    console.error("Error validating refresh token:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Refresh token has expired",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  generateTokens,
  deleteToken,
  refreshAccessToken,
  validateToken,
  validateRefreshToken,
};
