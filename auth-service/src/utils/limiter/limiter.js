const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many email requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many password reset attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many token requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many logout attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  emailLimiter,
  passwordLimiter,
  tokenLimiter,
  logoutLimiter,
};