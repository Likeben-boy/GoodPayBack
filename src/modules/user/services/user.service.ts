import bcrypt from "bcryptjs";
import logger, { dbLogger, businessLogger } from "@/utils/logger";
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserLoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
  CreateAddressInput,
  UpdateAddressInput,
  LoginResult,
  TokenPair,
} from "@/modules/user/models/user";
import { generateToken, verifyAccessToken } from "@/utils/jwt";
import userModel from "../models/user.model";
import addressModel from "../models/address.model";

class UserService {
  /**
   * 用户注册
   * @param userData - 用户注册数据
   * @returns 注册结果
   */
  async register(userData: CreateUserInput): Promise<LoginResult> {
    businessLogger.info("开始执行用户注册");
    dbLogger.debug("Database operation: user existence check", {
      operation: "user.checkExists",
      auth: userData.authCode,
      password: userData.password,
      phone: userData.phone,
    });

    // 检查手机号是否已存在
    if (userData.phone) {
      const existingPhone = await userModel.findByPhone(userData.phone);
      if (existingPhone) {
        throw { message: "手机号已存在", code: "PHONE_EXISTS" };
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    dbLogger.info("Database operation: creating user", {
      operation: "user.create",
      phone: userData.phone,
    });

    // 创建用户
    const userId = await userModel.create({
      ...userData,
      password: hashedPassword,
    });

    dbLogger.info("Database operation: user created successfully", {
      operation: "user.created",
      userId,
      phone: userData.phone,
    });

    // 获取用户信息
    const user = await userModel.findById(userId);

    if (!user) {
      throw { message: "用户创建失败", code: "USER_CREATE_FAILED" };
    }

    // 生成JWT令牌
    const tokens = generateToken(user.id);

    // 记录日志
    logger.info(`User registered: ${user.id}`, {
      userId: user.id,
      username: user.username,
    });

    return {
      userId: user.id,
      tokens,
      user,
    };
  }

  /**
   * 用户登录
   * @param loginData - 登录数据
   * @returns 登录结果
   */
  async login(loginData: UserLoginInput): Promise<LoginResult> {
    businessLogger.info("开始执行登陆操作");
    const { password, phone } = loginData;

    dbLogger.debug("Database operation: user lookup for login", {
      operation: "user.lookup",
      phone,
    });

    //判断手机号是否存在
    const user = await userModel.findByPhone(loginData.phone);

    if (!user) {
      businessLogger.info("用户不存在");
      dbLogger.warn("User lookup failed during login", {
        operation: "user.login.failed",
        phone,
        reason: "user_not_found",
      });
      throw { message: "用户不存在", code: "USER_NOT_FOUND" };
    }

    if (!user.status) {
      businessLogger.info("用户已被禁用");
      dbLogger.warn("User login attempt for disabled account", {
        operation: "user.login.disabled",
        userId: user.id,
        username: user.username,
        status: user.status,
      });
      throw { message: "用户已被禁用", code: "USER_DISABLED" };
    }

    // 获取包含密码的用户信息进行验证
    const userWithPassword = await userModel.findByUsername(user.username);

    if (!userWithPassword) {
      throw { message: "用户不存在", code: "USER_NOT_FOUND" };
    }

    // 验证密码
    if (loginData.password && userWithPassword.password) {
      const isPasswordValid = await bcrypt.compare(
        loginData.password,
        userWithPassword.password
      );
      if (!isPasswordValid) {
        businessLogger.warn("密码错误", {
          operation: "user.login.invalid_password",
          userId: user.id,
          phone: user.phone,
          reason: "invalid_password",
        });
        throw { message: "密码错误", code: "INVALID_PASSWORD" };
      }
    }

    //验证验证码
    if (loginData.authCode) {
      const isAuthCodeValid = Number(loginData.authCode) == 1234;
      if (!isAuthCodeValid) {
        businessLogger.warn("验证码错误", {
          operation: "user.login.invalid_authCode",
          userId: user.id,
          phone: user.phone,
          reason: "invalid_authCode",
        });
        throw { message: "验证码错误", code: "INVALID_AUTH_CODE" };
      }
    }

    // 生成JWT令牌
    const tokens = generateToken(user.id);

    // 记录日志
    logger.info(`User logged in: ${user.id}`, {
      userId: user.id,
      phone: user.phone,
    });

    return {
      userId: user.id,
      tokens,
      user,
    };
  }

  /**
   * 用户登出
   * @param userId - 用户ID
   */
  async logout(userId: number): Promise<boolean> {
    // 这里可以添加令牌黑名单等逻辑
    logger.info(`User logged out: ${userId}`, { userId });
    return true;
  }

  /**
   * 刷新令牌
   * @param tokenData - 令牌数据
   * @returns 新的令牌
   */
  async refreshToken(tokenData: { refreshToken: string }): Promise<TokenPair> {
    const { refreshToken } = tokenData;

    const decoded = verifyAccessToken(refreshToken);

    if (decoded.isExpired || decoded.isValid || !decoded.jwtPayload) {
      throw { message: "刷新令牌无效或已过期", code: "INVALID_REFRESH_TOKEN" };
    }
    const user = await userModel.findById(decoded.jwtPayload.userId);

    if (!user || !user.status) {
      throw { message: "用户不存在或已被禁用", code: "USER_NOT_FOUND" };
    }

    const tokens = generateToken(user.id);
    return tokens;
  }

  /**
   * 获取用户信息
   * @param userId - 用户ID
   * @returns 用户信息
   */
  async getUserProfile(
    userId: number
  ): Promise<User & { addressCount: number }> {
    const user = await userModel.findById(userId);

    if (!user) {
      throw { message: "用户不存在", code: "USER_NOT_FOUND" };
    }

    // 获取用户地址数量
    const addressCount = await addressModel.countByUserId(userId);

    return {
      ...user,
      addressCount,
    };
  }

  /**
   * 更新用户信息
   * @param userId - 用户ID
   * @param updateData - 更新数据
   * @returns 更新后的用户信息
   */
  async updateProfile(
    userId: number,
    updateData: UpdateUserInput
  ): Promise<User> {
    // 不允许更新的字段
    const forbiddenFields = [
      "password",
      "username",
      "status",
      "createdAt",
      "updatedAt",
    ];
    const cleanData = { ...updateData };

    forbiddenFields.forEach((field) => {
      delete (cleanData as any)[field];
    });

    const updateResult = await userModel.update(userId, cleanData);

    if (updateResult === 0) {
      throw { message: "用户不存在", code: "USER_NOT_FOUND" };
    }

    const updatedUser = await userModel.findById(userId);

    if (!updatedUser) {
      throw { message: "用户不存在", code: "USER_NOT_FOUND" };
    }

    return updatedUser;
  }

  /**
   * 修改密码
   * @param userId - 用户ID
   * @param passwordData - 密码数据
   */
  async changePassword(
    userId: number,
    passwordData: ChangePasswordInput
  ): Promise<void> {
    const { oldPassword, newPassword } = passwordData;

    const userWithPassword = await userModel.findByUsername(
      (await userModel.findById(userId))?.username || ""
    );

    if (!userWithPassword || !userWithPassword.password) {
      throw { message: "用户不存在", code: "USER_NOT_FOUND" };
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      userWithPassword.password
    );
    if (!isOldPasswordValid) {
      throw { message: "旧密码错误", code: "INVALID_OLD_PASSWORD" };
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await userModel.updatePassword(userId, hashedPassword);

    // 记录日志
    logger.info(`User password changed: ${userId}`, { userId });
  }

  /**
   * 重置密码
   * @param resetData - 重置密码数据
   */
  async resetPassword(resetData: ResetPasswordInput): Promise<void> {
    const { phone, newPassword } = resetData;

    const user = await userModel.findByPhone(phone);

    if (!user) {
      throw { message: "用户不存在", code: "USER_NOT_FOUND" };
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await userModel.updatePassword(user.id, hashedPassword);

    // 记录日志
    logger.info(`User password reset: ${user.id}`, { userId: user.id });
  }

  /**
   * 上传头像
   * @param userId - 用户ID
   * @param file - 文件对象
   * @returns 头像URL
   */
  async uploadAvatar(
    userId: number,
    file: Express.Multer.File
  ): Promise<{ avatarUrl: string }> {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await userModel.updateAvatar(userId, avatarUrl);
    return { avatarUrl };
  }

  /**
   * 获取用户地址列表
   * @param userId - 用户ID
   * @returns 地址列表
   */
  async getUserAddresses(userId: number): Promise<any[]> {
    return await addressModel.getUserAddresses(userId);
  }

  /**
   * 获取用户默认地址
   * @param userId - 用户ID
   * @returns 默认地址
   */
  async getDefaultAddress(userId: number): Promise<any | null> {
    return await addressModel.getDefaultAddress(userId);
  }

  /**
   * 创建用户地址
   * @param userId - 用户ID
   * @param addressData - 地址数据
   * @returns 创建的地址
   */
  async createAddress(
    userId: number,
    addressData: CreateAddressInput
  ): Promise<any> {
    return await addressModel.createAddress(userId, addressData);
  }

  /**
   * 更新用户地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   * @param updateData - 更新数据
   * @returns 更新后的地址
   */
  async updateAddress(
    userId: number,
    addressId: number,
    updateData: UpdateAddressInput
  ): Promise<any> {
    return await addressModel.updateAddress(addressId, userId, updateData);
  }

  /**
   * 设置默认地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   */
  async setDefaultAddress(userId: number, addressId: number): Promise<void> {
    await addressModel.setDefaultAddress(userId, addressId);
  }

  /**
   * 删除用户地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   */
  async deleteAddress(userId: number, addressId: number): Promise<void> {
    await addressModel.deleteAddress(userId, addressId);
  }

  /**
   * 批量删除地址
   * @param userId - 用户ID
   * @param addressIds - 地址ID数组
   */
  async batchDeleteAddresses(
    userId: number,
    addressIds: number[]
  ): Promise<void> {
    await addressModel.batchDeleteAddresses(userId, addressIds);
  }
}

// 导出单例实例
const userService = new UserService();
export default userService;
