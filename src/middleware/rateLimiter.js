const rateLimit = require('express-rate-limit');
const Redis = require('redis');
const RedisStore = require('rate-limit-redis');
const config = require('../config');
const logger = require('../utils/logger');

// Redis客户端配置
let redisClient;
if (config.REDIS_HOST) {
  redisClient = Redis.createClient({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB
  });

  redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });
}

/**
 * 通用API限流中间件
 */
const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    status: 'error',
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:'
  }) : undefined
});

/**
 * 登录限流中间件
 * 防止暴力破解
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    status: 'error',
    message: '登录尝试过于频繁，请15分钟后再试',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'login_limit:'
  }) : undefined,
  skip: (req) => {
    // 跳过已认证的用户
    return req.user !== undefined;
  }
});

/**
 * 注册限流中间件
 * 防止恶意注册
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册
  message: {
    status: 'error',
    message: '注册尝试过于频繁，请1小时后再试',
    code: 'REGISTER_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'register_limit:'
  }) : undefined
});

/**
 * 密码重置限流中间件
 */
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 2, // 最多2次尝试
  message: {
    status: 'error',
    message: '密码重置尝试过于频繁，请15分钟后再试',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'password_reset_limit:'
  }) : undefined
});

/**
 * 短信验证码限流中间件
 */
const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 最多1条
  message: {
    status: 'error',
    message: '短信发送过于频繁，请1分钟后再试',
    code: 'SMS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'sms_limit:'
  }) : undefined
});

/**
 * 邮件验证码限流中间件
 */
const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 最多1封
  message: {
    status: 'error',
    message: '邮件发送过于频繁，请1分钟后再试',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'email_limit:'
  }) : undefined
});

/**
 * 文件上传限流中间件
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次
  message: {
    status: 'error',
    message: '文件上传过于频繁，请1分钟后再试',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'upload_limit:'
  }) : undefined
});

/**
 * 支付请求限流中间件
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次
  message: {
    status: 'error',
    message: '支付请求过于频繁，请1分钟后再试',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'payment_limit:'
  }) : undefined
});

/**
 * 自定义限流中间件创建器
 * @param {Object} options - 限流配置
 */
const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || config.RATE_LIMIT_WINDOW_MS,
    max: options.max || config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      status: 'error',
      message: options.message || '请求过于频繁，请稍后再试',
      code: options.code || 'CUSTOM_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: true,
    store: redisClient ? new RedisStore({
      client: redisClient,
      prefix: options.prefix || 'custom_limit:'
    }) : undefined,
    skip: options.skip || undefined
  });
};

module.exports = {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  smsLimiter,
  emailLimiter,
  uploadLimiter,
  paymentLimiter,
  createLimiter
};