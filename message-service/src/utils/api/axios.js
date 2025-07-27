const axios = require("axios");
const logger = require("../logger");

const axiosUser = axios.create({
  baseURL: process.env.USER_SERVICE_URL,
  timeout: 5000,
  headers: {
    "X-Service-Key": process.env.INTER_SERVICE_API_KEY,
    "X-Service-Name": "auth-service",
  },
});

// Добавляем перехватчик запросов
axiosUser.interceptors.request.use(
  (config) => {
    logger.info("Making request to user service", {
      method: config.method,
      url: config.url,
      hasData: !!config.data,
    });
    return config;
  },
  (error) => {
    logger.error("Request to user service failed", {
      error: error.message,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов
axiosUser.interceptors.response.use(
  (response) => {
    logger.info("Received response from user service", {
      status: response.status,
      url: response.config.url,
      hasData: !!response.data,
    });
    return response;
  },
  (error) => {
    logger.error("Error from user service", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

const axiosAuth = axios.create({
  baseURL: process.env.AUTH_SERVICE_URL,
  timeout: 5000,
  headers: {
    "X-Service-Key": process.env.INTER_SERVICE_API_KEY,
    "X-Service-Name": "auth-service",
  },
});

// Добавляем перехватчик запросов
axiosAuth.interceptors.request.use(
  (config) => {
    logger.info("Making request to user service", {
      method: config.method,
      url: config.url,
      hasData: !!config.data,
    });
    return config;
  },
  (error) => {
    logger.error("Request to user service failed", {
      error: error.message,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов
axiosAuth.interceptors.response.use(
  (response) => {
    logger.info("Received response from user service", {
      status: response.status,
      url: response.config.url,
      hasData: !!response.data,
    });
    return response;
  },
  (error) => {
    logger.error("Error from user service", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });
    return Promise.reject(error);
  }
);

module.exports = {
  axiosUser,
  axiosAuth,
};
