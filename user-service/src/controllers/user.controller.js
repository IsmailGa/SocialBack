const { User, Role, AccountStatus } = require("../models");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../utils/logger");
const { Op, where } = require("sequelize");

const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Role,
          attributes: ["role"],
        },
      ],
      attributes: {
        exclude: [
          "passwordHash",
          "verificationToken",
          "verificationTokenExpires",
        ],
      },
    });

    return res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    logger.error("Failed to get users:", error);
    return next(new AppError(500, "Failed to get users"));
  }
};

const getPasswordHash = async (req, res, next) => {
  const { email } = req.query;
  if (!email) {
    logger.warn("Email parameter is missing");
    return next(new AppError(400, "Email is required"));
  }

  const normalizedEmail = email.trim().toLowerCase();
  logger.info("Attempting to get password hash by email", {
    email: normalizedEmail,
  });

  try {
    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      logger.warn("User not found", { email: normalizedEmail });
      return next(new AppError(404, "User not found"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
      },
    });
  } catch (error) {
    logger.error("Failed to get password hash", {
      error: error.message,
      stack: error.stack,
      email: normalizedEmail,
    });
    return next(new AppError(500, "Failed to get password hash"));
  }
};

const getUserByEmail = async (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    logger.warn("Email parameter is missing");
    return next(new AppError(400, "Email is required"));
  }

  const normalizedEmail = email.trim().toLowerCase();
  logger.info("Attempting to get user by email", { email: normalizedEmail });

  try {
    const user = await User.findOne({
      where: { email: normalizedEmail },
      include: [
        {
          model: Role,
          attributes: ["id", "role"],
        },
      ],
    });

    logger.info("User query completed", {
      found: !!user,
      hasRole: !!user?.Role,
      userId: user?.id,
    });

    if (!user) {
      logger.warn("User not found", { email: normalizedEmail });
      return next(new AppError(404, "User not found"));
    }

    // Transform user data to include role name
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      role: user.Role?.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info("Returning user data", {
      userId: user.id,
      hasPasswordHash: !!userData.passwordHash,
      hasRole: !!userData.role,
    });

    return res.status(200).json({
      status: "success",
      data: userData,
    });
  } catch (error) {
    logger.error("Failed to get user by email", {
      error: error.message,
      stack: error.stack,
      email: normalizedEmail,
    });
    return next(new AppError(500, "Failed to get user"));
  }
};

const getUserById = async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    logger.warn("ID parameter is missing");
    return next(new AppError(400, "ID is required"));
  }

  logger.info("Attempting to get user by ID", { id });

  try {
    const user = await User.findOne({
      where: { id },
      include: [
        {
          model: Role,
          attributes: ["id", "role"],
        },
      ],
    });

    logger.info("User query completed", {
      found: !!user,
      hasRole: !!user?.Role,
      userId: user?.id,
    });

    if (!user) {
      logger.warn("User not found", { id });
      return next(new AppError(404, "User not found"));
    }

    // Transform user data to include role name
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      role: user.Role?.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info("Returning user data", {
      userId: user.id,
      hasPasswordHash: !!userData.passwordHash,
      hasRole: !!userData.role,
    });

    return res.status(200).json({
      status: "success",
      data: userData,
    });
  } catch (error) {
    logger.error("Failed to get user by id", {
      error: error.message,
      stack: error.stack,
    });
    return next(new AppError(500, "Failed to get user"));
  }
};

const checkEmail = async (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    return next(new AppError(400, "Email is required"));
  }

  try {
    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    return res.status(200).json({
      status: "success",
      data: {
        exists: !!user,
      },
    });
  } catch (error) {
    logger.error("Failed to check email:", error);
    return next(new AppError(500, "Failed to check email"));
  }
};

const createUser = async (req, res, next) => {
  const {
    username,
    email,
    password,
    fullName,
    roleName = "user",
    // verificationToken,
    // verificationTokenExpires,
    isEmailVerified = false,
    isPrivate = false,
    isDeleted = false,
  } = req.body;

  logger.info("Creating user", {
    username,
    email,
    roleName,
    isEmailVerified,
    isPrivate,
    isDeleted,
  });

  if (!username || !email || !password) {
    return next(
      new AppError(400, "Required fields: username, email, password")
    );
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return next(
        new AppError(409, "User with this email or username already exists")
      );
    }

    // Get role
    const role = await Role.findOne({
      where: { role: roleName.toLowerCase() },
    });

    if (!role) {
      return next(new AppError(400, "Invalid role"));
    }

    const accountStatusId = await AccountStatus.findOne({
      where: { status: "active" },
    });

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: password,
      accountStatusId: accountStatusId.id,
      fullName,
      roleId: role.id,
      // verificationToken,
      // verificationTokenExpires,
      isEmailVerified,
      isPrivate,
      isDeleted,
    });

    logger.info("User created successfully", {
      userId: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
    });

    // Fetch the user with role information
    const userWithRole = await User.findByPk(user.id, {
      include: [{ model: Role }],
    });

    logger.info("User with role fetched", {
      userId: userWithRole.id,
      hasRole: !!userWithRole.Role,
      roleName: userWithRole.Role?.role,
    });

    // Transform user data to include role name
    const userData = {
      id: userWithRole.id,
      username: userWithRole.username,
      email: userWithRole.email,
      fullName: userWithRole.fullName,
      isEmailVerified: userWithRole.isEmailVerified,
      role: userWithRole.Role?.role,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
    };

    return res.status(201).json({
      status: "success",
      data: userData,
    });
  } catch (error) {
    logger.error("Failed to create user:", error);
    return next(new AppError(500, "Failed to create user"));
  }
};

const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;
  logger.info("updated data", updateData);

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return next(new AppError(404, "User not found"));
    }

    // Update user
    await user.update(updateData);

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    logger.error("Failed to update user:", error);
    return next(new AppError(500, "Failed to update user"));
  }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return next(new AppError(404, "User not found"));
    }

    // Soft delete
    await user.update({ isDeleted: true });

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete user:", error);
    return next(new AppError(500, "Failed to delete user"));
  }
};

module.exports = {
  getUsers,
  getUserByEmail,
  checkEmail,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getPasswordHash,
};
