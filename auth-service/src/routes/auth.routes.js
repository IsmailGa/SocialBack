const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  verifyEmail,
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify-email", verifyEmail);

module.exports = router;
