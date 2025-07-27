const logger = require('../utils/logger');

class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleSequelizeError = (err) => {
  if (err.name === 'SequelizeValidationError') {
    return new AppError(400, err.errors[0].message);
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return new AppError(409, 'This record already exists');
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new AppError(400, 'Invalid reference');
  }
  return err;
};

const handleJWTError = () => new AppError(401, 'Invalid token. Please log in again!');

const handleJWTExpiredError = () => new AppError(401, 'Your token has expired! Please log in again.');

const sendErrorDev = (err, res) => {
  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      status: err.status,
    },
  });

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.error({
      error: {
        message: err.message,
        statusCode: err.statusCode,
        status: err.status,
      },
    });

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // 1) Log error
    logger.error({
      error: {
        message: 'Something went wrong!',
        statusCode: 500,
        status: 'error',
      },
    });

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (err.name?.startsWith('Sequelize')) error = handleSequelizeError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = {
  AppError,
  errorHandler,
}; 