const { User, Role, Session, AccountStatus } = require("../models");
const bcrypt = require("bcrypt");
const { generateTokens } = require("../utils/jwt/jwtGenerate");
const { sendVerificationEmail } = require("../utils/nodemailer/nodemailer");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const {
    username,
    email,
    password,
    fullName = null,
    roleName = "user", // Default role is 'user'
  } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Required fields: username, email, password",
    });
  }

  email.trim().toLowerCase();

  // Check for existing user
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      status: "error",
      message: "User with this email already exists",
    });
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    return res.status(409).json({
      status: "error",
      message: "Username already exists, please choose another one",
    });
  }

  // Validate password length
  if (password.length < 8 && RegExp(/^[a-zA-Z0-9]+$/).test(password)) {
    return res.status(400).json({
      status: "error",
      message:
        "Password must be at least 8 characters long and contain at least one special character",
    });
  }

  // Validate role
  const validRoles = ["admin", "moderator", "user"];
  const normalizedRoleName = roleName.trim().toLowerCase();
  const role = await Role.findOne({ where: { name: normalizedRoleName } });
  if (!role || !validRoles.includes(normalizedRoleName)) {
    return res.status(400).json({
      status: "error",
      message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    });
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Find default account status
    const accountStatus = await AccountStatus.findOne({
      where: { name: "active" },
    });
    if (!accountStatus) {
      return res.status(500).json({
        status: "error",
        message: 'Account status "active" not found',
      });
    }

    const verificationToken = jwt.sign(
      { email, username },
      process.env.EMAIL_VERIFICATION_SECRET,
      { expiresIn: "1h" }
    );

    const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Create user
    const newUser = await User.create({
      username,
      email,
      passwordHash,
      fullName,
      accountStatusId: accountStatus.id,
      roleId: role.id,
      verificationToken: verificationToken,
      verificationTokenExpires: verificationTokenExpires,
      isEmailVerified: false,
      isPrivate: false,
      isDeleted: false,
    });

    await sendVerificationEmail(
      newUser.email,
      newUser.username,
      newUser.verificationToken
    );

    // Create session with refresh token
    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: role.name,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create user",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "Required fields: email, password",
    });
  }

  email.trim().toLowerCase();

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const userRole = await Role.findByPk(user.roleId);
    if (!userRole) {
      return res.status(500).json({
        status: "error",
        message: "User role not found",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }
  
    // Generate tokens
    const tokens = await generateTokens(user.id);
    if (!tokens.success) {
      return res.status(500).json({
        status: "error",
        message: "Failed to generate tokens",
      });
    }

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "Strict", // Adjust as needed
    });

    const refreshExpiresAt = new Date(Date.now() + parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000);

    Session.create({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: refreshExpiresAt,
    });

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: {
            id: userRole.id,
            name: userRole.name,
          },
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(204).send({
        status: "success",
        message: "No content to delete",
      }); // No content to delete
    }

    // Clear the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Optionally, you can also invalidate the token in your database if needed

    return res.status(204).send(); // Successfully logged out
  } catch (error) {
    console.error("Error logging out:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      status: "error",
      message: "Verification token is required",
    });
  }

  try {
    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationTokenExpires: { [require("sequelize").Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification token",
      });
    }

    await user.update({
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    });

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Failed to verify email:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to verify email",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  logout
};
