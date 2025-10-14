const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 确保日志目录存在
const logDir = path.dirname(config.LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 开发环境格式
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'goodpayback-api' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: config.LOG_FILE,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境下同时输出到控制台
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: devFormat
  }));
}

/**
 * 记录HTTP请求日志
 */
const httpLogger = winston.createLogger({
  level: 'http',
  format: logFormat,
  defaultMeta: { service: 'goodpayback-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境下HTTP日志输出到控制台
if (config.NODE_ENV !== 'production') {
  httpLogger.add(new winston.transports.Console({
    format: devFormat
  }));
}

/**
 * HTTP请求中间件
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      httpLogger.info('HTTP Request', logData);
    }
  });

  next();
};

/**
 * 数据库查询日志
 */
const dbLogger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  defaultMeta: { service: 'goodpayback-db' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'database.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ]
});

/**
 * 业务逻辑日志
 */
const businessLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'goodpayback-business' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'business.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * 安全日志
 */
const securityLogger = winston.createLogger({
  level: 'warn',
  format: logFormat,
  defaultMeta: { service: 'goodpayback-security' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * 支付日志
 */
const paymentLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'goodpayback-payment' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'payment.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

module.exports = {
  logger,
  httpLogger,
  requestLogger,
  dbLogger,
  businessLogger,
  securityLogger,
  paymentLogger
};