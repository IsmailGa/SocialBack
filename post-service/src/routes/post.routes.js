const express = require("express");
const router = express.Router();

const { errorHandler } = require("../middleware/error.middleware");
const {
  validateRefreshToken,
  refreshAccessToken,
  validateToken,
} = require("../utils/jwt/jwtGenerate");
const {
  register,
  login,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const {
  authLimiter,
  emailLimiter,
  passwordLimiter,
  tokenLimiter,
  logoutLimiter,
} = require("../utils/limiter/limiter");


router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logoutLimiter, validateRefreshToken, logout);
router.get("/verify-email", emailLimiter, verifyEmail);
router.post("/reset-password", passwordLimiter, resetPassword);
router.post("/forgot-password", passwordLimiter, forgotPassword);
router.post("/resend-verification", emailLimiter, resendVerificationEmail);
router.get(
  "/refresh-token",
  tokenLimiter,
  validateRefreshToken,
  refreshAccessToken
);
router.get("/validate-token", tokenLimiter, validateToken);

router.use(errorHandler);

module.exports = router;
