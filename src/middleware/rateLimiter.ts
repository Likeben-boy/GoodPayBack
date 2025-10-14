import rateLimit, { RateLimitRequestHandler, MemoryStore } from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { ApiResponse } from '../types';

// 加载环境变量
dotenv.config();

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
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  code?: string;
  prefix?: string;
  skipSuccessfulRequests?: boolean;
}): RateLimitRequestHandler => {
  const rateLimitOptions: any = {
    windowMs: options.windowMs,
    max: options.max,
    message: createRateLimitResponse(options.message, options.code),
    standardHeaders: true,
    legacyHeaders: true,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    // 使用内置内存存储
    store: new MemoryStore()
  };

  return rateLimit(rateLimitOptions);
};

const generalLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: '请求过于频繁，请稍后再试',
  code: 'RATE_LIMIT_EXCEEDED',
  prefix: 'rate_limit:'
});

/**
 * 登录限流中间件
 * 防止暴力破解
 */
const loginLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: '登录尝试过于频繁，请15分钟后再试',
  code: 'LOGIN_RATE_LIMIT_EXCEEDED',
  prefix: 'login_limit:'
});

/**
 * 注册限流中间件
 * 防止恶意注册
 */
const registerLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册
  message: '注册尝试过于频繁，请1小时后再试',
  code: 'REGISTER_RATE_LIMIT_EXCEEDED',
  prefix: 'register_limit:'
});

/**
 * 密码重置限流中间件
 */
const passwordResetLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 2, // 最多2次尝试
  message: '密码重置尝试过于频繁，请15分钟后再试',
  code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  prefix: 'password_reset_limit:'
});

/**
 * 短信验证码限流中间件
 */
const smsLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 最多1条
  message: '短信发送过于频繁，请1分钟后再试',
  code: 'SMS_RATE_LIMIT_EXCEEDED',
  prefix: 'sms_limit:'
});

/**
 * 邮件验证码限流中间件
 */
const emailLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 最多1封
  message: '邮件发送过于频繁，请1分钟后再试',
  code: 'EMAIL_RATE_LIMIT_EXCEEDED',
  prefix: 'email_limit:'
});

/**
 * 文件上传限流中间件
 */
const uploadLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次
  message: '文件上传过于频繁，请1分钟后再试',
  code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  prefix: 'upload_limit:'
});

/**
 * 支付请求限流中间件
 */
const paymentLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 最多5次
  message: '支付请求过于频繁，请1分钟后再试',
  code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
  prefix: 'payment_limit:'
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
  skipSuccessfulRequests?: boolean;
}

const createLimiter = (options: CustomLimiterOptions): RateLimitRequestHandler => {
  const limiterOptions: any = {
    windowMs: options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: options.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    message: options.message || '请求过于频繁，请稍后再试',
    code: options.code || 'CUSTOM_RATE_LIMIT_EXCEEDED',
    prefix: options.prefix || 'custom_limit:'
  };

  if (options.skipSuccessfulRequests !== undefined) {
    limiterOptions.skipSuccessfulRequests = options.skipSuccessfulRequests;
  }

  return createRateLimiter(limiterOptions);
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