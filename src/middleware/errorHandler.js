const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 * 统一处理所有错误并返回标准化响应
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 数据库错误处理
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      status: 'error',
      message: '数据已存在',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      status: 'error',
      message: '关联数据不存在',
      code: 'FOREIGN_KEY_CONSTRAINT'
    });
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: '访问令牌已过期',
      code: 'TOKEN_EXPIRED'
    });
  }

  // 验证错误处理
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      details: err.details
    });
  }

  // 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'error',
      message: '文件大小超出限制',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: 'error',
      message: '不支持的文件类型',
      code: 'INVALID_FILE_TYPE'
    });
  }

  // 404错误处理
  if (err.statusCode === 404) {
    return res.status(404).json({
      status: 'error',
      message: err.message || '资源不存在',
      code: 'NOT_FOUND'
    });
  }

  // 权限错误处理
  if (err.statusCode === 403) {
    return res.status(403).json({
      status: 'error',
      message: err.message || '权限不足',
      code: 'FORBIDDEN'
    });
  }

  // 默认错误响应
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? '服务器内部错误' : message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404错误处理中间件
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: '路由不存在',
    code: 'ROUTE_NOT_FOUND'
  });
};

/**
 * 异步错误捕获中间件
 * 用于捕获async函数中的错误
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};