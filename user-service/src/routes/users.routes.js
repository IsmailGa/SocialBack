const express = require("express");
const router = express.Router();
const { User } = require("../models");
const {
  getUsers,
  // getUserById,
  getUserByEmail,
  checkEmail,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const logger = require("../utils/logger");

// Get all users
router.get("/", getUsers);

// Get user by email
router.get("/get-by-email", getUserByEmail);

// Check if email exists
router.get("/check-email", checkEmail);

// Get user by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findOne({ where: { id: id } });

    if (!user) {
      res.status(404).json({
        message: "There is no such user",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user,
      },
    });
  } catch (error) {
    logger.error("You have got an error", error.message);
  }
});

// Create user
router.post("/", createUser);

// Update user
router.patch("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

module.exports = router;
