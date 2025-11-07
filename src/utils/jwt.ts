import jwt from "jsonwebtoken";
import config from "../config";
import logger from "./logger";
import { JwtPayload, JwtPayloadOut, JwtType } from "../types";
import { TokenPair } from "../modules/user/models/user";

/**
 * 生成JWT令牌
 * @param userId - 用户ID
 * @param payload - 额外的载荷数据
 * @returns 包含access_token和refresh_token的对象
 */
const generateToken = (userId: number): TokenPair => {
  //生成访问令牌对象
  const normalTokenPayload: JwtPayload = {
    userId,
    type: JwtType.normal,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(addTime(new Date(), config.jwt.expiresIn) / 1000),
  };

  //生成刷新令牌
  const refreshTokenPayload: JwtPayload = {
    userId,
    type: JwtType.refresh,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(addTime(new Date(), config.jwt.refreshExpiresIn) / 1000),
  };

  logger.info("打印两个", normalTokenPayload, refreshTokenPayload);

  // 生成访问令牌
  const accessToken = jwt.sign(normalTokenPayload, config.jwt.secret);

  // 生成刷新令牌
  const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.secret);

  logger.info(`Token generated for user: ${userId}`);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
    refreshExpiresIn: config.jwt.refreshExpiresIn,
  };
};

//增加时间的工具方法 参数中接收jwt参数中的5d或者其他格式的数字。
const addTime = (date: Date, amount: String): number => {
  const result = new Date(date);
  const addNum: number = Number(amount.substring(0, 1));
  const unit: String = amount.substring(1, 2);
  switch (unit) {
    case "d":
      result.setDate(result.getDate() + addNum);
      break;
    case "m":
      result.setMinutes(result.getMinutes() + addNum);
      break;
    case "s":
      result.setSeconds(result.getSeconds() + addNum);
      break;
    default:
      new Error("不支持的类型参数");
  }
  return result.getTime();
};

/**
 * 验证JWT令牌
 * @param token - JWT令牌
 * @returns 解码后的载荷数据
 */
const verifyToken = (token: string): JwtPayloadOut => {
  const out: JwtPayloadOut = {
    isExpired: false,
    isValid: false,
  };
  try {
    out.jwtPayload = jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch (jwtError) {
    logger.error(
      "令牌验证失败:",
      jwtError instanceof Error ? jwtError.message : "Unknown error"
    );

    //判断是过期还是无效
    if (jwtError instanceof jwt.TokenExpiredError) {
      out.isExpired = true;
      logger.error("令牌过期:", jwtError.message);
    } else if (jwtError instanceof jwt.JsonWebTokenError) {
      out.isValid = true;
      logger.error("令牌无效:", jwtError.message);
    }
  }
  return out;
};

/**
 * 验证访问令牌
 * @param token - 访问令牌
 * @returns 解码后的载荷数据
 */
const verifyAccessToken = (token: string): JwtPayloadOut => {
  return verifyToken(token);
};

/**
 * 验证刷新令牌
 * @param token - 刷新令牌
 * @returns 解码后的载荷数据
 */
const verifyRefreshToken = (token: string): JwtPayloadOut => {
  try {
    const decoded = verifyToken(token);

    // 检查是否是刷新令牌
    if ((decoded as any).type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    logger.error(
      "Refresh token verification failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
};

/**
 * 从令牌中解码载荷（不验证签名）
 * @param token - JWT令牌
 * @returns 解码后的载荷数据
 */
const decodeToken = (token: string): JwtPayloadOut => {
  const out: JwtPayloadOut = {
    isExpired: false,
    isValid: false,
  };
  try {
    out.jwtPayload = jwt.decode(token) as JwtPayload;
  } catch (jwtError) {
    logger.error(
      "令牌验证失败:",
      jwtError instanceof Error ? jwtError.message : "Unknown error"
    );

    //判断是过期还是无效
    if (jwtError instanceof jwt.TokenExpiredError) {
      out.isExpired = true;
    } else if (jwtError instanceof jwt.JsonWebTokenError) {
      out.isValid = true;
    }
  }
  return out;
};

/**
 * 获取令牌剩余时间
 * @param token - JWT令牌
 * @returns 剩余时间（秒）
 */
const getTokenRemainingTime = (token: string): number => {
  try {
    const decoded = decodeToken(token);
    if (!decoded.jwtPayload || !decoded.jwtPayload.exp) {
      return 0;
    }
    const remainingTime =
      decoded.jwtPayload.exp - Math.floor(Date.now() / 1000);
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
const generateTempToken = (
  userId: number,
  purpose: string,
  expiresIn: number = 3600
): string => {
  const payload = {
    userId,
    purpose,
    type: JwtType.temp,
  };

  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

/**
 * 验证临时令牌
 * @param token - 临时令牌
 * @param purpose - 令牌用途
 * @returns 解码后的载荷数据
 */
const verifyTempToken = (token: string, purpose: string): JwtPayloadOut => {
  const decoded = verifyToken(token);

  if (
    (decoded as any).type !== "temp" ||
    (decoded as any).purpose !== purpose
  ) {
    throw new Error("Invalid token type or purpose");
  }

  return decoded;
};

export {
  generateToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenRemainingTime,
  generateTempToken,
  verifyTempToken,
};
