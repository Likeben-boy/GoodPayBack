import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types/index';
import { JwtPayload } from '@/types/index';
import logger, { securityLogger } from '@/utils/logger';
import { verifyAccessToken } from "@/utils/jwt";


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

      const decoded = verifyAccessToken(token);
      let code = 'INVALID_TOKEN';
      let message = '访问令牌无效';
      if(!decoded.jwtPayload){
              if(decoded.isValid){
        securityLogger.warn('非法的jwt令牌', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          error: message
        });
      }

      if(decoded.isExpired){
        securityLogger.warn('JWT token expired', {
          url: req.url,
          method: req.method,
          ip: req.ip,
          error: message
        });
      }
      }else{
        req.user = decoded.jwtPayload;
              securityLogger.info('JWT authentication successful', {
        userId: decoded.jwtPayload.userId,
        url: req.url,
        ip: req.ip
      });
      next();
      }
      const response: ApiResponse = {
        status: 'error',
        message,
        code,
        timestamp: new Date().toISOString()
      };
      res.status(401).json(response);
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

        const decoded = verifyAccessToken(token);
        if(decoded.jwtPayload){
req.user = decoded.jwtPayload;
        }else{
          securityLogger.warn('Optional auth token invalid:');
        }
    }
    next();
  } catch (error) {
      logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
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

export {
  authMiddleware,
  optionalAuth,
  roleAuth
};