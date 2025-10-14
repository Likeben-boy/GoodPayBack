import { Request, Response, NextFunction } from 'express';
import logger, { businessLogger, securityLogger } from '../utils/logger';
import { ApiResponse, ValidationError } from '../types';

// 自定义错误类
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * 全局错误处理中间件
 * 统一处理所有错误并返回标准化响应
 */
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // 增强的错误日志记录
  const errorContext = {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    username: (req as any).user?.username,
    timestamp: new Date().toISOString(),
    errorCode: (err as any).code || 'UNKNOWN_ERROR',
    statusCode: (err as any).statusCode || 500
  };

  // 根据错误类型使用不同的日志记录器
  if (errorContext.statusCode === 401 || errorContext.statusCode === 403) {
    securityLogger.error('Security related error', errorContext);
  } else if (errorContext.statusCode >= 500) {
    logger.error('Server error', errorContext);
  } else {
    businessLogger.warn('Business logic error', errorContext);
  }

  // 数据库错误处理
  if ((err as any).code === 'ER_DUP_ENTRY') {
    const response: ApiResponse = {
      status: 'error',
      message: '数据已存在',
      code: 'DUPLICATE_ENTRY',
      timestamp: new Date().toISOString()
    };
    res.status(409).json(response);
    return;
  }

  if ((err as any).code === 'ER_NO_REFERENCED_ROW_2') {
    const response: ApiResponse = {
      status: 'error',
      message: '关联数据不存在',
      code: 'FOREIGN_KEY_CONSTRAINT',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      status: 'error',
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      status: 'error',
      message: '访问令牌已过期',
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    };
    res.status(401).json(response);
    return;
  }

  // 验证错误处理
  if (err.name === 'ValidationError') {
    const response: ApiResponse = {
      status: 'error',
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      errors: (err as any).details,
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  // 文件上传错误
  if ((err as any).code === 'LIMIT_FILE_SIZE') {
    const response: ApiResponse = {
      status: 'error',
      message: '文件大小超出限制',
      code: 'FILE_TOO_LARGE',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  if ((err as any).code === 'LIMIT_UNEXPECTED_FILE') {
    const response: ApiResponse = {
      status: 'error',
      message: '不支持的文件类型',
      code: 'INVALID_FILE_TYPE',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  // 自定义应用错误
  if (err instanceof AppError) {
    const response: ApiResponse = {
      status: 'error',
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: new Date().toISOString()
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // 404错误处理
  if ((err as any).statusCode === 404) {
    const response: ApiResponse = {
      status: 'error',
      message: err.message || '资源不存在',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    };
    res.status(404).json(response);
    return;
  }

  // 权限错误处理
  if ((err as any).statusCode === 403) {
    const response: ApiResponse = {
      status: 'error',
      message: err.message || '权限不足',
      code: 'FORBIDDEN',
      timestamp: new Date().toISOString()
    };
    res.status(403).json(response);
    return;
  }

  // 默认错误响应
  const statusCode = (err as any).statusCode || 500;
  const message = err.message || '服务器内部错误';

  const response: ApiResponse = {
    status: 'error',
    message: statusCode === 500 ? '服务器内部错误' : message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  // 开发环境下添加错误堆栈
  if (process.env.NODE_ENV === 'development') {
    (response as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404错误处理中间件
 */
const notFoundHandler = (req: Request, res: Response): void => {
  // 记录404错误日志
  businessLogger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    timestamp: new Date().toISOString()
  });

  const response: ApiResponse = {
    status: 'error',
    message: '路由不存在',
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  };
  res.status(404).json(response);
};

/**
 * 异步错误捕获中间件
 * 用于捕获async函数中的错误
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export {
  errorHandler,
  notFoundHandler,
  asyncHandler
};