const jwt = require('jsonwebtoken');
const config = require('../config');
const { errorResponse } = require('../utils/response');

/**
 * JWT认证中间件
 * 验证请求头中的Authorization令牌
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, '缺少访问令牌', 401);
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return errorResponse(res, '访问令牌已过期', 401);
      } else if (jwtError.name === 'JsonWebTokenError') {
        return errorResponse(res, '访问令牌无效', 401);
      } else {
        return errorResponse(res, '令牌验证失败', 401);
      }
    }
  } catch (error) {
    return errorResponse(res, '认证失败', 500);
  }
};

/**
 * 可选认证中间件
 * 用户可以选择是否提供令牌
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
      } catch (jwtError) {
        // 令牌无效，但不阻止请求继续
        console.warn('Optional auth token invalid:', jwtError.message);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * 角色权限中间件
 * 检查用户是否具有指定角色
 * @param {Array} roles - 允许的角色数组
 */
const roleAuth = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, '需要认证', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, '权限不足', 403);
    }

    next();
  };
};

/**
 * 管理员权限中间件
 */
const adminAuth = roleAuth(['admin', 'superadmin']);

/**
 * 超级管理员权限中间件
 */
const superAdminAuth = roleAuth(['superadmin']);

/**
 * 资源所有权中间件
 * 检查用户是否是资源的所有者
 * @param {Function} getResourceOwnerId - 获取资源所有者ID的函数
 */
const ownershipAuth = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, '需要认证', 401);
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        return next();
      }

      const resourceOwnerId = await getResourceOwnerId(req);

      if (req.user.id !== resourceOwnerId) {
        return errorResponse(res, '权限不足', 403);
      }

      next();
    } catch (error) {
      return errorResponse(res, '权限验证失败', 500);
    }
  };
};

module.exports = {
  authMiddleware,
  optionalAuth,
  roleAuth,
  adminAuth,
  superAdminAuth,
  ownershipAuth
};