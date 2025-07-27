require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sequelize = require("../config/database.js");
const authRoutes = require("./routes/auth.routes.js");
const { errorHandler } = require("./middleware/error.middleware");
const logger = require("./utils/logger");
const { verifyTransporter } = require('./utils/nodemailer/nodemailer');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
  });
  next();
});

app.use("/api/v1/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Connection has been established successfully.");

    // Verify email transporter
    try {
      await verifyTransporter();
    } catch (emailError) {
      logger.warn("Email transporter verification failed, emails may not work:", emailError.message);
    }

    app.listen(process.env.PORT || 5000, () => {
      logger.info(`Server is running on port ${process.env.PORT || 5000}`);
      logger.info('Environment variables check:', {
        hasUserServiceUrl: !!process.env.USER_SERVICE_URL,
        hasInterServiceKey: !!process.env.INTER_SERVICE_API_KEY,
        userServiceUrl: process.env.USER_SERVICE_URL,
        interServiceKeyLength: process.env.INTER_SERVICE_API_KEY?.length || 0,
        emailConfig: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          hasPassword: !!process.env.EMAIL_PASS,
          frontendUrl: process.env.FRONTEND_URL
        }
      });
    });
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
