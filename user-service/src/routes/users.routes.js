const express = require("express");
const router = express.Router();
const { validateServiceAuth } = require("../middleware/auth.middleware");
const {
  getUsers,
  getUserById,
  getUserByEmail,
  checkEmail,
  createUser,
  updateUser,
  deleteUser,
  getPasswordHash,
} = require("../controllers/user.controller");

// Применяем middleware аутентификации ко всем маршрутам
router.use(validateServiceAuth);

// Get all users
router.get("/", getUsers);

// Get user by email
router.get("/get-by-email", getUserByEmail);

// Get user password hash (for authentication only)
router.get("/get-password-hash", getPasswordHash);

// Check if email exists
router.get("/check-email", checkEmail);

// Create user
router.post("/", createUser);

// Update user
router.patch("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

// Get user by ID
router.get("/:id", getUserById);

module.exports = router;
