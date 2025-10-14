import winston from 'winston';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// 先直接读取环境变量，避免循环依赖
dotenv.config();

const logFile = process.env.LOG_FILE || 'logs/app.log';
console.log('logFile:', logFile);

// 确保日志目录存在
const logDir = path.dirname(logFile);
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
const logLevel = process.env.LOG_LEVEL || 'info';
const logger = winston.createLogger({
  level: logLevel,
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
      filename: logFile,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境下同时输出到控制台
const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: devFormat
  }));
}

/**
 * HTTP请求日志记录器
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
if (nodeEnv !== 'production') {
  httpLogger.add(new winston.transports.Console({
    format: devFormat
  }));
}

/**
 * HTTP请求中间件
 */
const requestLogger = (req: any, res: any, next: any): void => {
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
 * 数据库查询日志记录器
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
 * 业务逻辑日志记录器
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
 * 安全日志记录器
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
 * 支付日志记录器
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

export {
  logger,
  httpLogger,
  requestLogger,
  dbLogger,
  businessLogger,
  securityLogger,
  paymentLogger
};