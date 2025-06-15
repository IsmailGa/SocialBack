require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Restrict CORS for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Proxy configuration
const services = {
  '/api/v1/auth': process.env.AUTH_SERVICE_URL || 'http://auth-service:5000',
  '/api/v1/users': process.env.USER_SERVICE_URL || 'http://user-service:5001',
  '/api/v1/posts': process.env.POST_SERVICE_URL || 'http://post-service:5002',
  '/api/v1/comments': process.env.COMMENT_SERVICE_URL || 'http://comment-service:5003',
  '/api/v1/likes': process.env.LIKE_SERVICE_URL || 'http://like-service:5004',
  '/api/v1/messages': process.env.MESSAGE_SERVICE_URL || 'http://message-service:5005',
  '/api/v1/notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5006',
};

const addServiceInfo = (req, res, next) => {
  const path = req.path.split('/')[3] || '';
  const serviceUrl = services[`/api/v1/${path}`];
  if (serviceUrl) {
    try {
      const url = new URL(serviceUrl);
      res.setHeader('X-Service-Name', path.toUpperCase());
      res.setHeader('X-Service-Port', url.port || '80');
      res.setHeader('X-Service-URL', serviceUrl);
    } catch (error) {
      console.error(`Invalid URL for ${path}: ${serviceUrl}`, error);
    }
  }
  next();
};

app.use(addServiceInfo);

app.get('/', (req, res) => {
  res.send(
    `<h1>API Gateway</h1><br><p>Available services: ${Object.keys(services).join(', ')}</p>`
  );
});

// Setup proxy for each service
Object.entries(services).forEach(([path, target]) => {
  if (!target) {
    console.warn(`No target URL defined for ${path}`);
    return;
  }
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: '/api/v1/auth', // Adjust for specific service
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${path}:`, err);
        res.status(500).json({
          status: 'error',
          message: `Service ${path} temporarily unavailable`,
          error: err.message,
        });
      },
      onProxyReq: (proxyReq, req) => {
        console.log(`Proxying ${req.method} ${req.originalUrl} to ${target}`);
      },
    })
  );
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Service information endpoint
app.get('/services', (req, res) => {
  const serviceInfo = Object.entries(services).map(([path, url]) => {
    try {
      const parsedUrl = new URL(url);
      return {
        name: path.replace('/api/v1/', '').toUpperCase(),
        path,
        url,
        port: parseInt(parsedUrl.port) || 80,
      };
    } catch (error) {
      return {
        name: path.replace('/api/v1/', '').toUpperCase(),
        path,
        url,
        error: 'Invalid URL',
      };
    }
  });

  res.json({
    gateway: {
      port: PORT,
      url: `http://localhost:${PORT}`,
    },
    services: serviceInfo,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log('\n=== API Gateway Service Information ===');
  console.log(`API Gateway is running on port ${PORT}`);
  console.log('\nAvailable Services:');
  console.log('----------------------------------------');
  Object.entries(services).forEach(([path, url]) => {
    try {
      const serviceName = path.replace('/api/v1/', '').toUpperCase();
      const port = new URL(url).port || '80';
      console.log(`${serviceName} Service:`);
      console.log(`  Path: ${path}`);
      console.log(`  URL: ${url}`);
      console.log(`  Port: ${port}`);
      console.log('----------------------------------------');
    } catch (error) {
      console.log(`Error parsing URL for ${path}: ${url}`);
    }
  });
  console.log('\nEndpoints:');
  console.log(`  Health Check: GET http://localhost:${PORT}/health`);
  console.log(`  Service Info: GET http://localhost:${PORT}/services`);
  console.log('\n======================================\n');
});