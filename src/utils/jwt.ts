import jwt from 'jsonwebtoken';
import config from '../config';
import logger from './logger';
import { JwtPayload, TokenPair } from '../types';

/**
 * 生成JWT令牌
 * @param userId - 用户ID
 * @param payload - 额外的载荷数据
 * @returns 包含access_token和refresh_token的对象
 */
const generateToken = (userId: number, payload: Partial<JwtPayload> = {}): TokenPair => {
  const tokenPayload: JwtPayload = {
    userId,
    username: payload.username || '',
    role: payload.role || 'user',
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  };

  // 生成访问令牌
  const accessToken = jwt.sign(
    tokenPayload,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // 生成刷新令牌
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  logger.info(`Token generated for user: ${userId}`);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn
  };
};

/**
 * 验证JWT令牌
 * @param token - JWT令牌
 * @returns 解码后的载荷数据
 */
const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * 验证访问令牌
 * @param token - 访问令牌
 * @returns 解码后的载荷数据
 */
const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 检查是否是刷新令牌
    if ((decoded as any).type === 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    logger.error('Access token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * 验证刷新令牌
 * @param token - 刷新令牌
 * @returns 解码后的载荷数据
 */
const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 检查是否是刷新令牌
    if ((decoded as any).type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

/**
 * 从令牌中解码载荷（不验证签名）
 * @param token - JWT令牌
 * @returns 解码后的载荷数据
 */
const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    logger.error('Token decode failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * 检查令牌是否过期
 * @param token - JWT令牌
 * @returns 是否过期
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return decoded.exp < Math.floor(Date.now() / 1000);
  } catch (error) {
    return true;
  }
};

/**
 * 获取令牌剩余时间
 * @param token - JWT令牌
 * @returns 剩余时间（秒）
 */
const getTokenRemainingTime = (token: string): number => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }
    const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
    return Math.max(0, remainingTime);
  } catch (error) {
    return 0;
  }
};

/**
 * 生成临时令牌
 * @param userId - 用户ID
 * @param purpose - 令牌用途
 * @param expiresIn - 过期时间（秒）
 * @returns 临时令牌
 */
const generateTempToken = (userId: number, purpose: string, expiresIn: number = 3600): string => {
  const payload = {
    userId,
    purpose,
    type: 'temp'
  };

  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

/**
 * 验证临时令牌
 * @param token - 临时令牌
 * @param purpose - 令牌用途
 * @returns 解码后的载荷数据
 */
const verifyTempToken = (token: string, purpose: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    if ((decoded as any).type !== 'temp' || (decoded as any).purpose !== purpose) {
      throw new Error('Invalid token type or purpose');
    }

    return decoded;
  } catch (error) {
    logger.error('Temp token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export {
  generateToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenRemainingTime,
  generateTempToken,
  verifyTempToken
};