import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { ApiResponse } from '@/types/index';
import { JwtPayload } from '@/types/index';
import logger, { securityLogger } from '@/utils/logger';
import {  generateToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenRemainingTime,
  generateTempToken,
  verifyTempToken} from "@/utils/jwt";
// import jwt from 'jsonwebtoken';


// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT认证中间件
 * 验证请求头中的Authorization令牌
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    securityLogger.info('JWT authentication attempt', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      securityLogger.warn('Missing or invalid authorization header', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        authHeader: authHeader ? 'exists' : 'missing'
      });

      const response: ApiResponse = {
        status: 'error',
        message: '缺少访问令牌',
        code: 'MISSING_TOKEN',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    try {
      const decoded = jwt.verify(token);
      req.user = decoded;

      securityLogger.info('JWT authentication successful', {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        url: req.url,
        ip: req.ip
      });

      next();
    } catch (jwtError) {
      let code = 'INVALID_TOKEN';
      let message = '访问令牌无效';

      if (jwtError instanceof jwt.TokenExpiredError) {
        code = 'TOKEN_EXPIRED';
        message = '访问令牌已过期';
        securityLogger.warn('JWT token expired', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          error: jwtError.message
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        code = 'INVALID_TOKEN';
        message = '访问令牌无效';
        securityLogger.warn('Invalid JWT token', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          error: jwtError.message
        });
      }

      const response: ApiResponse = {
        status: 'error',
        message,
        code,
        timestamp: new Date().toISOString()
      };
      res.status(401).json(response);
    }
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    const response: ApiResponse = {
      status: 'error',
      message: '认证失败',
      code: 'AUTH_FAILED',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
};

/**
 * 可选认证中间件
 * 用户可以选择是否提供令牌
 */
const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        req.user = decoded;
      } catch (jwtError) {
        // 令牌无效，但不阻止请求继续
        console.warn('Optional auth token invalid:', jwtError instanceof Error ? jwtError.message : 'Unknown error');
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
 * @param roles - 允许的角色数组
 */
const roleAuth = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        status: 'error',
        message: '需要认证',
        code: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString()
      };
      res.status(401).json(response);
      return;
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
 * @param getResourceOwnerId - 获取资源所有者ID的函数
 */
const ownershipAuth = (getResourceOwnerId: (req: Request) => Promise<number>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          status: 'error',
          message: '需要认证',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        };
        res.status(401).json(response);
        return;
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        next();
        return;
      }

      const resourceOwnerId = await getResourceOwnerId(req);

      if (req.user.userId !== resourceOwnerId) {
        const response: ApiResponse = {
          status: 'error',
          message: '权限不足',
          code: 'PERMISSION_DENIED',
          timestamp: new Date().toISOString()
        };
        res.status(403).json(response);
        return;
      }

      next();
    } catch (error) {
      const response: ApiResponse = {
        status: 'error',
        message: '权限验证失败',
        code: 'PERMISSION_CHECK_FAILED',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  };
};

export {
  authMiddleware,
  optionalAuth,
  roleAuth,
  adminAuth,
  superAdminAuth,
  ownershipAuth
};