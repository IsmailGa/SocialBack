const axios = require('axios');
const logger = require('../logger');

const axiosInstance = axios.create({
  baseURL: process.env.USER_SERVICE_URL,
  timeout: 5000,
});

// Добавляем перехватчик запросов
axiosInstance.interceptors.request.use(
  (config) => {
    logger.info('Making request to user service', {
      method: config.method,
      url: config.url,
      hasData: !!config.data
    });
    return config;
  },
  (error) => {
    logger.error('Request to user service failed', {
      error: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов
axiosInstance.interceptors.response.use(
  (response) => {
    logger.info('Received response from user service', {
      status: response.status,
      url: response.config.url,
      hasData: !!response.data
    });
    return response;
  },
  (error) => {
    logger.error('Error from user service', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    return Promise.reject(error);
  }
);

module.exports = axiosInstance;
