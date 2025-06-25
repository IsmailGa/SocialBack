const express = require("express");
const router = express.Router();
const {
  getUsers,
  // getUserById,
  getUserByEmail,
  checkEmail,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

// Get all users
router.get("/", getUsers);

// Get user by ID
// router.get("/:id", getUserById);

// Get user by email
router.get("/get-by-email", getUserByEmail);

// Check if email exists
router.get("/check-email", checkEmail);

// Create user
router.post("/", createUser);

// Update user
router.patch("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

module.exports = router;
