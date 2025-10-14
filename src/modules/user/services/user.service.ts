import userModel from '../models/user.model';
import addressModel from '../models/address.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { generateToken, verifyToken } from '../../../utils/jwt';
import { sendEmail, sendSMS } from '../../../utils/notification';
import logger from '../../../utils/logger';
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
  TokenPair
} from '../../../types/user';

class UserService {
  /**
   * 用户注册
   * @param userData - 用户注册数据
   * @returns 注册结果
   */
  async register(userData: CreateUserInput): Promise<LoginResult> {
    // 检查用户名是否已存在
    const existingUser = await userModel.findByUsername(userData.username);
    if (existingUser) {
      throw { message: '用户名已存在', code: 'USERNAME_EXISTS' };
    }

    // 检查邮箱是否已存在
    if (userData.email) {
      const existingEmail = await userModel.findByEmail(userData.email);
      if (existingEmail) {
        throw { message: '邮箱已存在', code: 'EMAIL_EXISTS' };
      }
    }

    // 检查手机号是否已存在
    if (userData.phone) {
      const existingPhone = await userModel.findByPhone(userData.phone);
      if (existingPhone) {
        throw { message: '手机号已存在', code: 'PHONE_EXISTS' };
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, config.bcryptSaltRounds);

    // 创建用户
    const userId = await userModel.create({
      ...userData,
      password: hashedPassword,
      nickname: userData.nickname || userData.username,
      status: 'active'
    });

    // 生成JWT令牌
    const tokens = generateToken(userId);

    // 记录日志
    logger.info(`User registered: ${userId}`);

    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('用户创建失败');
    }

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user as any;

    return {
      userId,
      tokens,
      user: userWithoutPassword
    };
  }

  /**
   * 用户登录
   * @param loginData - 登录数据
   * @returns 登录结果
   */
  async login(loginData: UserLoginInput): Promise<LoginResult> {
    const { username, password, email, phone } = loginData;

    let user: User | null = null;

    // 根据不同的登录方式查找用户
    if (username) {
      user = await userModel.findByUsername(username);
    } else if (email) {
      user = await userModel.findByEmail(email);
    } else if (phone) {
      user = await userModel.findByPhone(phone);
    } else {
      throw { message: '请提供用户名、邮箱或手机号', code: 'MISSING_CREDENTIALS' };
    }

    if (!user) {
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    if (user.status !== 'active') {
      throw { message: '用户已被禁用', code: 'USER_DISABLED' };
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, (user as any).password);
    if (!isPasswordValid) {
      throw { message: '密码错误', code: 'INVALID_PASSWORD' };
    }

    // 生成JWT令牌
    const tokens = generateToken(user.id);

    // 记录日志
    logger.info(`User logged in: ${user.id}`);

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user as any;

    return {
      userId: user.id,
      tokens,
      user: userWithoutPassword
    };
  }

  /**
   * 用户登出
   * @param userId - 用户ID
   */
  async logout(userId: number): Promise<boolean> {
    // 这里可以添加令牌黑名单等逻辑
    logger.info(`User logged out: ${userId}`);
    return true;
  }

  /**
   * 刷新令牌
   * @param tokenData - 令牌数据
   * @returns 新的令牌
   */
  async refreshToken(tokenData: { refreshToken: string }): Promise<TokenPair> {
    const { refreshToken } = tokenData;

    try {
      const decoded = verifyToken(refreshToken);
      const user = await userModel.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        throw { message: '用户不存在或已被禁用', code: 'USER_NOT_FOUND' };
      }

      const tokens = generateToken(user.id);
      return tokens;
    } catch (error) {
      throw { message: '刷新令牌无效或已过期', code: 'INVALID_REFRESH_TOKEN' };
    }
  }

  /**
   * 获取用户信息
   * @param userId - 用户ID
   * @returns 用户信息
   */
  async getUserProfile(userId: number): Promise<User & { addressCount: number }> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    // 获取用户地址数量
    const addresses = await addressModel.findByUserId(userId);

    return {
      ...user,
      addressCount: addresses.length
    };
  }

  /**
   * 更新用户信息
   * @param userId - 用户ID
   * @param updateData - 更新数据
   * @returns 更新后的用户信息
   */
  async updateProfile(userId: number, updateData: UpdateUserInput): Promise<User> {
    // 不允许更新的字段
    const forbiddenFields = ['password', 'username', 'status', 'created_at'];
    const cleanData = { ...updateData };

    forbiddenFields.forEach(field => {
      delete (cleanData as any)[field];
    });

    const affectedRows = await userModel.update(userId, cleanData);
    if (affectedRows === 0) {
      throw { message: '更新失败', code: 'UPDATE_FAILED' };
    }

    const updatedUser = await userModel.findById(userId);
    if (!updatedUser) {
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    return updatedUser;
  }

  /**
   * 修改密码
   * @param userId - 用户ID
   * @param passwordData - 密码数据
   */
  async changePassword(userId: number, passwordData: ChangePasswordInput): Promise<void> {
    const { oldPassword, newPassword } = passwordData;

    const user = await userModel.findById(userId);
    if (!user) {
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, (user as any).password);
    if (!isOldPasswordValid) {
      throw { message: '旧密码错误', code: 'INVALID_OLD_PASSWORD' };
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds);

    // 更新密码
    await userModel.update(userId, { password: hashedPassword });

    // 记录日志
    logger.info(`User password changed: ${userId}`);
  }

  /**
   * 重置密码
   * @param resetData - 重置密码数据
   */
  async resetPassword(resetData: ResetPasswordInput): Promise<void> {
    const { email, code, newPassword } = resetData;

    // 验证邮箱验证码
    // 这里应该调用验证码验证服务

    const user = await userModel.findByEmail(email);
    if (!user) {
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds);

    // 更新密码
    await userModel.update(user.id, { password: hashedPassword });

    // 记录日志
    logger.info(`User password reset: ${user.id}`);
  }

  /**
   * 上传头像
   * @param userId - 用户ID
   * @param file - 文件对象
   * @returns 头像URL
   */
  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await userModel.update(userId, { avatar: avatarUrl });
    return { avatarUrl };
  }

  /**
   * 获取用户地址列表
   * @param userId - 用户ID
   * @returns 地址列表
   */
  async getUserAddresses(userId: number): Promise<any[]> {
    return await addressModel.findByUserId(userId);
  }

  /**
   * 获取用户默认地址
   * @param userId - 用户ID
   * @returns 默认地址
   */
  async getDefaultAddress(userId: number): Promise<any | null> {
    return await addressModel.findDefaultByUserId(userId);
  }

  /**
   * 创建用户地址
   * @param userId - 用户ID
   * @param addressData - 地址数据
   * @returns 创建的地址
   */
  async createAddress(userId: number, addressData: CreateAddressInput): Promise<any> {
    const addressId = await addressModel.create({
      userId,
      ...addressData
    });

    // 如果设置为默认地址，需要处理其他地址
    if (addressData.isDefault) {
      await addressModel.setDefault(userId, addressId);
    }

    return await addressModel.findById(addressId);
  }

  /**
   * 更新用户地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   * @param updateData - 更新数据
   * @returns 更新后的地址
   */
  async updateAddress(userId: number, addressId: number, updateData: UpdateAddressInput): Promise<any> {
    const address = await addressModel.findById(addressId);
    if (!address || address.userId !== userId) {
      throw { message: '地址不存在', code: 'ADDRESS_NOT_FOUND' };
    }

    // 如果设置为默认地址，需要处理其他地址
    if (updateData.isDefault) {
      await addressModel.setDefault(userId, addressId);
    }

    await addressModel.update(addressId, updateData);
    return await addressModel.findById(addressId);
  }

  /**
   * 设置默认地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   */
  async setDefaultAddress(userId: number, addressId: number): Promise<void> {
    const address = await addressModel.findById(addressId);
    if (!address || address.userId !== userId) {
      throw { message: '地址不存在', code: 'ADDRESS_NOT_FOUND' };
    }

    await addressModel.setDefault(userId, addressId);
  }

  /**
   * 删除用户地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   */
  async deleteAddress(userId: number, addressId: number): Promise<void> {
    const address = await addressModel.findById(addressId);
    if (!address || address.userId !== userId) {
      throw { message: '地址不存在', code: 'ADDRESS_NOT_FOUND' };
    }

    await addressModel.delete(addressId);
  }

  /**
   * 批量删除地址
   * @param userId - 用户ID
   * @param addressIds - 地址ID数组
   */
  async batchDeleteAddresses(userId: number, addressIds: number[]): Promise<void> {
    await addressModel.batchDelete(userId, addressIds);
  }
}

// 导出单例实例
const userService = new UserService();
export default userService;