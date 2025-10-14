import winston from 'winston';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// 先直接读取环境变量，避免循环依赖
dotenv.config();

// 日志配置
const LOG_CONFIG = {
  file: process.env.LOG_FILE || 'logs/app.log',
  level: process.env.LOG_LEVEL || 'info',
  maxSize: 5242880, // 5MB
  maxFiles: 5,
  nodeEnv: process.env.NODE_ENV || 'development'
};

// 确保日志目录存在
const logDir = path.dirname(LOG_CONFIG.file);
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
  level: LOG_CONFIG.level,
  format: logFormat,
  defaultMeta: { service: 'goodpayback-api' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: LOG_CONFIG.maxSize,
      maxFiles: LOG_CONFIG.maxFiles
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: LOG_CONFIG.file,
      maxsize: LOG_CONFIG.maxSize,
      maxFiles: LOG_CONFIG.maxFiles
    })
  ]
});

// 开发环境下同时输出到控制台
if (LOG_CONFIG.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: devFormat
  }));
}

/**
 * 格式化持续时间为可读格式
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
};

/**
 * 获取客户端真实IP
 */
const getClientIP = (req: any): string => {
  return req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
    '0.0.0.0';
};

/**
 * HTTP请求中间件
 */
const requestLogger = (req: Request, res: any, next: any): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: formatDuration(duration),
      durationMs: duration,
      ip: getClientIP(req),
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    };

    // 根据状态码和响应时间选择日志级别
    if (res.statusCode >= 500 || duration > 5000) {
      logger.error('HTTP Request Slow/Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Error', logData);
    } else if (duration > 1000) {
      httpLogger.warn('HTTP Request Slow', logData);
    } else {
      httpLogger.info('HTTP Request', logData);
    }
  });

  next();
};

/**
 * 创建日志记录器的工厂函数
 */
const createLogger = (service: string, filename: string, level: string = 'info') => {
  const instance = winston.createLogger({
    level,
    format: logFormat,
    defaultMeta: { service },
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, filename),
        maxsize: LOG_CONFIG.maxSize,
        maxFiles: LOG_CONFIG.maxFiles
      })
    ]
  });

  // 开发环境下输出到控制台
  if (LOG_CONFIG.nodeEnv !== 'production') {
    instance.add(new winston.transports.Console({
      format: devFormat
    }));
  }

  return instance;
};

/**
 * 数据库查询日志记录器
 */
const dbLogger = createLogger('goodpayback-db', 'database.log');

/**
 * 业务逻辑日志记录器
 */
const businessLogger = createLogger('goodpayback-business', 'business.log');

/**
 * 安全日志记录器
 */
const securityLogger = createLogger('goodpayback-security', 'security.log', 'warn');

/**
 * 支付日志记录器
 */
const paymentLogger = createLogger('goodpayback-payment', 'payment.log');

/**
 * 性能计时器工具
 */
class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
  }

  /**
   * 结束计时并记录日志
   */
  end(loggerInstance: any = logger, level: string = 'info'): number {
    const duration = Date.now() - this.startTime;
    loggerInstance[level](`Performance [${this.label}]: ${formatDuration(duration)}`, {
      label: this.label,
      duration,
      durationFormatted: formatDuration(duration),
      timestamp: new Date().toISOString()
    });
    return duration;
  }
}

/**
 * 创建性能计时器
 */
const createTimer = (label: string): PerformanceTimer => {
  return new PerformanceTimer(label);
};

/**
 * 脱敏工具函数，用于隐藏敏感信息
 */
const sanitizeData = (data: any, sensitiveFields: string[] = ['password', 'token', 'secret']): any => {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });

  return sanitized;
};

/**
 * 记录用户操作日志
 */
const logUserAction = (userId: string, action: string, details?: any): void => {
  businessLogger.info('User Action', {
    userId,
    action,
    details: details ? sanitizeData(details) : undefined,
    timestamp: new Date().toISOString()
  });
};

/**
 * 记录安全事件
 */
const logSecurityEvent = (event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium'): void => {
  const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  securityLogger[level](`Security Event: ${event}`, {
    event,
    severity,
    details: sanitizeData(details),
    timestamp: new Date().toISOString()
  });
};

export {
  logger,
  httpLogger,
  requestLogger,
  dbLogger,
  businessLogger,
  securityLogger,
  paymentLogger,
  createLogger,
  createTimer,
  PerformanceTimer,
  sanitizeData,
  logUserAction,
  logSecurityEvent,
  formatDuration,
  getClientIP
};