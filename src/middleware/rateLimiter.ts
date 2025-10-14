import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import Redis from 'redis';
import RedisStore from 'rate-limit-redis';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

// 加载环境变量
dotenv.config();

// Redis客户端配置
let redisClient: Redis.RedisClientType | undefined;
const redisHost = process.env.REDIS_HOST;
if (redisHost) {
  redisClient = Redis.createClient({
    socket: {
      host: redisHost,
      port: parseInt(process.env.REDIS_PORT || '6379', 10)
    },
    password: process.env.REDIS_PASSWORD || '',
    database: parseInt(process.env.REDIS_DB || '0', 10)
  }) as Redis.RedisClientType;

  redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });
}

/**
 * 创建限流响应
 */
const createRateLimitResponse = (message: string, code: string = 'RATE_LIMIT_EXCEEDED'): ApiResponse => ({
  status: 'error',
  message,
  code,
  timestamp: new Date().toISOString()
});

/**
 * 通用API限流中间件
 */
const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: createRateLimitResponse('请求过于频繁，请稍后再试'),
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
const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: createRateLimitResponse('登录尝试过于频繁，请15分钟后再试', 'LOGIN_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'login_limit:'
  }) : undefined,
  skip: (req) => {
    // 跳过已认证的用户
    return !!(req as any).user !== undefined;
  }
});

/**
 * 注册限流中间件
 * 防止恶意注册
 */
const registerLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册
  message: createRateLimitResponse('注册尝试过于频繁，请1小时后再试', 'REGISTER_RATE_LIMIT_EXCEEDED'),
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
const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 2, // 最多2次尝试
  message: createRateLimitResponse('密码重置尝试过于频繁，请15分钟后再试', 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'),
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
const smsLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 最多1条
  message: createRateLimitResponse('短信发送过于频繁，请1分钟后再试', 'SMS_RATE_LIMIT_EXCEEDED'),
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
const emailLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 最多1封
  message: createRateLimitResponse('邮件发送过于频繁，请1分钟后再试', 'EMAIL_RATE_LIMIT_EXCEEDED'),
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
const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次
  message: createRateLimitResponse('文件上传过于频繁，请1分钟后再试', 'UPLOAD_RATE_LIMIT_EXCEEDED'),
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
const paymentLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次
  message: createRateLimitResponse('支付请求过于频繁，请1分钟后再试', 'PAYMENT_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: true,
  store: redisClient ? new RedisStore({
    client: redisClient,
    prefix: 'payment_limit:'
  }) : undefined
});

/**
 * 自定义限流中间件创建器
 */
interface CustomLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  code?: string;
  prefix?: string;
  skip?: (req: any) => boolean;
}

const createLimiter = (options: CustomLimiterOptions): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: options.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    message: createRateLimitResponse(
      options.message || '请求过于频繁，请稍后再试',
      options.code || 'CUSTOM_RATE_LIMIT_EXCEEDED'
    ),
    standardHeaders: true,
    legacyHeaders: true,
    store: redisClient ? new RedisStore({
      client: redisClient,
      prefix: options.prefix || 'custom_limit:'
    }) : undefined,
    skip: options.skip || undefined
  });
};

export {
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