const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { errorHandler } = require("../middleware/error.middleware");
const {
  validateRefreshToken,
  refreshAccessToken,
  validateToken,
} = require("../utils/jwt/jwtGenerate");
const {
  register,
  login,
  // logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post("/register", limiter, register);
router.post("/login", limiter, login);
// router.post("/logout", logout);
router.get("/verify-email", verifyEmail);
router.post("/reset-password", limiter, resetPassword);
router.post("/forgot-password", limiter, forgotPassword);
router.post("/resend-verification", limiter, resendVerificationEmail);
router.get("/refresh-token", validateRefreshToken, refreshAccessToken);
router.get("/validate-token", validateToken);

router.use(errorHandler);

module.exports = router;
