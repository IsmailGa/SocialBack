require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sequelize = require("../config/database.js");
const authRoutes = require("./routes/auth.routes.js");
const { errorHandler } = require("./middleware/error.middleware");
const logger = require("./utils/logger");

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

app.get("/", (req, res) => {
  res.send("Auth service is running");
});

// Error handling middleware
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");

    app.listen(process.env.PORT || 5000, () => {
      logger.info(`Server is running on port ${process.env.PORT || 5000}`);
    });
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
