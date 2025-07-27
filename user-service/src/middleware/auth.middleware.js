const { AppError } = require('./error.middleware');
const logger = require('../utils/logger');

const validateServiceAuth = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  const serviceName = req.headers['x-service-name'];

  // Проверяем наличие API ключа
  if (!serviceKey) {
    logger.warn('Missing service key in request', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return next(new AppError(401, 'Service authentication required'));
  }

  // Проверяем валидность API ключа
  if (serviceKey !== process.env.INTER_SERVICE_API_KEY) {
    logger.warn('Invalid service key', {
      serviceName,
      ip: req.ip,
      path: req.path
    });
    return next(new AppError(403, 'Invalid service key'));
  }

  // Проверяем, что запрос от доверенного сервиса
  const allowedServices = ['auth-service', 'post-service', 'notification-service'];
  if (!allowedServices.includes(serviceName)) {
    logger.warn('Unauthorized service access attempt', {
      serviceName,
      ip: req.ip,
      path: req.path
    });
    return next(new AppError(403, 'Unauthorized service'));
  }

  logger.info('Service authentication successful', {
    serviceName,
    path: req.path
  });

  next();
};

module.exports = {
  validateServiceAuth
};
