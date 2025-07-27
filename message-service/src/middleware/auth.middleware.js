const { AppError } = require("./error.middleware");
const logger = require("../utils/logger");
const { axiosAuth } = require("../utils/api/axios");

const validateServiceAuth = (req, res, next) => {
  const serviceKey = req.headers["x-service-key"];
  const serviceName = req.headers["x-service-name"];

  // Проверяем наличие API ключа
  if (!serviceKey) {
    logger.warn("Missing service key in request", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
    });
    return next(new AppError(401, "Service authentication required"));
  }

  // Проверяем валидность API ключа
  if (serviceKey !== process.env.INTER_SERVICE_API_KEY) {
    logger.warn("Invalid service key", {
      serviceName,
      ip: req.ip,
      path: req.path,
    });
    return next(new AppError(403, "Invalid service key"));
  }

  // Проверяем, что запрос от доверенного сервиса
  const allowedServices = [
    "auth-service",
    "post-service",
    "notification-service",
  ];
  if (!allowedServices.includes(serviceName)) {
    logger.warn("Unauthorized service access attempt", {
      serviceName,
      ip: req.ip,
      path: req.path,
    });
    return next(new AppError(403, "Unauthorized service"));
  }

  logger.info("Service authentication successful", {
    serviceName,
    path: req.path,
  });

  next();
};

// Middleware для валидации пользовательского JWT через внешний auth-service
const validateUserToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, "No token provided"));
  }
  const token = authHeader.split(" ")[1];
  try {
    const response = await axiosAuth.post(
      "/validate-token",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    // Можно добавить userId в req для дальнейшего использования
    req.user = response.data.user;
    next();
  } catch (error) {
    logger.warn("Token validation failed", { error: error.message });
    return next(new AppError(401, "Invalid token"));
  }
};

module.exports = {
  validateServiceAuth,
  validateUserToken,
};
