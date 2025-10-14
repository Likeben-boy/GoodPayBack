const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('./logger');

/**
 * 生成JWT令牌
 * @param {number} userId - 用户ID
 * @param {Object} payload - 额外的载荷数据
 * @returns {Object} 包含access_token和refresh_token的对象
 */
const generateToken = (userId, payload = {}) => {
  const tokenPayload = {
    userId,
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  };

  // 生成访问令牌
  const accessToken = jwt.sign(
    tokenPayload,
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  // 生成刷新令牌
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );

  logger.info(`Token generated for user: ${userId}`);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.JWT_EXPIRES_IN
  };
};

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {Object} 解码后的载荷数据
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    throw error;
  }
};

/**
 * 验证访问令牌
 * @param {string} token - 访问令牌
 * @returns {Object} 解码后的载荷数据
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 检查是否是刷新令牌
    if (decoded.type === 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    logger.error('Access token verification failed:', error.message);
    throw error;
  }
};

/**
 * 验证刷新令牌
 * @param {string} token - 刷新令牌
 * @returns {Object} 解码后的载荷数据
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 检查是否是刷新令牌
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed:', error.message);
    throw error;
  }
};

/**
 * 从令牌中解码载荷（不验证签名）
 * @param {string} token - JWT令牌
 * @returns {Object} 解码后的载荷数据
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Token decode failed:', error.message);
    throw error;
  }
};

/**
 * 检查令牌是否过期
 * @param {string} token - JWT令牌
 * @returns {boolean} 是否过期
 */
const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    return decoded.exp < Math.floor(Date.now() / 1000);
  } catch (error) {
    return true;
  }
};

/**
 * 获取令牌剩余时间
 * @param {string} token - JWT令牌
 * @returns {number} 剩余时间（秒）
 */
const getTokenRemainingTime = (token) => {
  try {
    const decoded = decodeToken(token);
    const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
    return Math.max(0, remainingTime);
  } catch (error) {
    return 0;
  }
};

/**
 * 生成临时令牌
 * @param {number} userId - 用户ID
 * @param {string} purpose - 令牌用途
 * @param {number} expiresIn - 过期时间（秒）
 * @returns {string} 临时令牌
 */
const generateTempToken = (userId, purpose, expiresIn = 3600) => {
  const payload = {
    userId,
    purpose,
    type: 'temp'
  };

  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

/**
 * 验证临时令牌
 * @param {string} token - 临时令牌
 * @param {string} purpose - 令牌用途
 * @returns {Object} 解码后的载荷数据
 */
const verifyTempToken = (token, purpose) => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (decoded.type !== 'temp' || decoded.purpose !== purpose) {
      throw new Error('Invalid token type or purpose');
    }

    return decoded;
  } catch (error) {
    logger.error('Temp token verification failed:', error.message);
    throw error;
  }
};

module.exports = {
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