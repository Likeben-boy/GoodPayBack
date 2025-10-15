// import { prisma } from '../../../database/prisma';
import { prisma } from '@/database/prisma';
import bcrypt from 'bcryptjs';
import logger, { dbLogger, businessLogger } from '@/utils/logger';
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
} from '@/types/user';
import {
  generateToken,
  verifyToken,
} from '@/utils/jwt'
import { log } from 'console';

class UserService {
  /**
   * 用户注册
   * @param userData - 用户注册数据
   * @returns 注册结果
   */
  async register(userData: CreateUserInput): Promise<LoginResult> {
    businessLogger.info('开始执行用户注册');
    dbLogger.debug('Database operation: user existence check', {
      operation: 'user.checkExists',
      username: userData.username,
      email: userData.email,
      phone: userData.phone
    });

    // 检查用户名是否已存在
    const existingUser = await prisma.users.findUnique({
      where: { username: userData.username }
    });
    if (existingUser) {
      dbLogger.warn('Username already exists', {
        username: userData.username,
        existingUserId: existingUser.id
      });
      throw { message: '用户名已存在', code: 'USERNAME_EXISTS' };
    }

    // 检查邮箱是否已存在
    if (userData.email) {
      const existingEmail = await prisma.users.findUnique({
        where: { email: userData.email }
      });
      if (existingEmail) {
        throw { message: '邮箱已存在', code: 'EMAIL_EXISTS' };
      }
    }

    // 检查手机号是否已存在
    if (userData.phone) {
      const existingPhone = await prisma.users.findUnique({
        where: { phone: userData.phone }
      });
      if (existingPhone) {
        throw { message: '手机号已存在', code: 'PHONE_EXISTS' };
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    dbLogger.info('Database operation: creating user', {
      operation: 'user.create',
      username: userData.username,
      email: userData.email,
      phone: userData.phone
    });

    // 创建用户
    const user = await prisma.users.create({
      data: {
        username: userData.username,
        email: userData.email || '',
        phone: userData.phone || null,
        password: hashedPassword,
        nickname: userData.nickname || userData.username,
        avatar: userData.avatar || null,
        status: 'active'
      }
    });

    dbLogger.info('Database operation: user created successfully', {
      operation: 'user.created',
      userId: user.id,
      username: user.username,
      email: user.email
    });

    // 生成JWT令牌
    const tokens = generateToken(user.id);

    // 记录日志
    logger.info(`User registered: ${user.id}`, {
      userId: user.id,
      username: user.username,
      email: user.email,
      ip: 'unknown' // 可以从请求中获取
    });

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    return {
      userId: user.id,
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
    businessLogger.info('开始执行登陆操作');
    const { username, password, email, phone,loginIp } = loginData;

    dbLogger.debug('Database operation: user lookup for login', {
      operation: 'user.lookup',
      username,
      email,
      phone
    });

    let user: any = null;

    // 根据不同的登录方式查找用户
    if (username) {
      user = await prisma.users.findUnique({
        where: { username }
      });
    } else if (email) {
      user = await prisma.users.findUnique({
        where: { email }
      });
    } else if (phone) {
      user = await prisma.users.findUnique({
        where: { phone }
      });
    } else {
      throw { message: '请提供用户名、邮箱或手机号', code: 'MISSING_CREDENTIALS' };
    }

    if (!user) {
      businessLogger.info('用户不存在');
      dbLogger.warn('User lookup failed during login', {
        operation: 'user.login.failed',
        username,
        email,
        phone,
        reason: 'user_not_found'
      });
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    if (user.status !== 'active') {
      businessLogger.info('用户已被禁用');
      dbLogger.warn('User login attempt for disabled account', {
        operation: 'user.login.disabled',
        userId: user.id,
        username: user.username,
        status: user.status
      });
      throw { message: '用户已被禁用', code: 'USER_DISABLED' };
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      dbLogger.warn('Password validation failed during login', {
        operation: 'user.login.invalid_password',
        userId: user.id,
        username: user.username,
        reason: 'invalid_password'
      });
      businessLogger.info('密码错误');
      throw { message: '密码错误', code: 'INVALID_PASSWORD' };
    }

    // 更新最后登录时间和IP
    await prisma.users.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: loginIp || "unknown"
      }
    });

    // 生成JWT令牌
    const tokens = generateToken(user.id);

    // 记录日志
    logger.info(`User logged in: ${user.id}`, {
      userId: user.id,
      username: user.username,
      ip: loginIp || "unknown"
    });

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

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

    try {
      const decoded = verifyToken(refreshToken);
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId }
      });

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
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    // 获取用户地址数量
    const addressCount = await prisma.addresses.count({
      where: { userId }
    });

    return {
      ...user,
      addressCount
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
    const forbiddenFields = ['password', 'username', 'status', 'createdAt', 'updatedAt'];
    const cleanData = { ...updateData };

    forbiddenFields.forEach(field => {
      delete (cleanData as any)[field];
    });

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: cleanData
    });

    return updatedUser;
  }

  /**
   * 修改密码
   * @param userId - 用户ID
   * @param passwordData - 密码数据
   */
  async changePassword(userId: number, passwordData: ChangePasswordInput): Promise<void> {
    const { oldPassword, newPassword } = passwordData;

    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw { message: '旧密码错误', code: 'INVALID_OLD_PASSWORD' };
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // 记录日志
    logger.info(`User password changed: ${userId}`, { userId });
  }

  /**
   * 重置密码
   * @param resetData - 重置密码数据
   */
  async resetPassword(resetData: ResetPasswordInput): Promise<void> {
    const { email, newPassword } = resetData;

    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      throw { message: '用户不存在', code: 'USER_NOT_FOUND' };
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // 记录日志
    logger.info(`User password reset: ${user.id}`, { userId: user.id });
  }

  /**
   * 上传头像
   * @param userId - 用户ID
   * @param file - 文件对象
   * @returns 头像URL
   */
  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await prisma.users.update({
      where: { id: userId },
      data: { avatar: avatarUrl }
    });
    return { avatarUrl };
  }

  /**
   * 获取用户地址列表
   * @param userId - 用户ID
   * @returns 地址列表
   */
  async getUserAddresses(userId: number): Promise<any[]> {
    return await prisma.addresses.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }
    });
  }

  /**
   * 获取用户默认地址
   * @param userId - 用户ID
   * @returns 默认地址
   */
  async getDefaultAddress(userId: number): Promise<any | null> {
    return await prisma.addresses.findFirst({
      where: {
        userId,
        isDefault: true
      }
    });
  }

  /**
   * 创建用户地址
   * @param userId - 用户ID
   * @param addressData - 地址数据
   * @returns 创建的地址
   */
  async createAddress(userId: number, addressData: CreateAddressInput): Promise<any> {
    // 如果设置为默认地址，需要先取消其他默认地址
    if (addressData.isDefault) {
      await prisma.addresses.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const address = await prisma.addresses.create({
      data: {
        userId,
        recipient: addressData.recipient,
        phone: addressData.phone,
        province: addressData.province,
        city: addressData.city,
        district: addressData.district,
        detailedAddress: addressData.detailedAddress,
        postalCode: addressData.postalCode || null,
        isDefault: addressData.isDefault || false
      }
    });

    return address;
  }

  /**
   * 更新用户地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   * @param updateData - 更新数据
   * @returns 更新后的地址
   */
  async updateAddress(userId: number, addressId: number, updateData: UpdateAddressInput): Promise<any> {
    const address = await prisma.addresses.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw { message: '地址不存在', code: 'ADDRESS_NOT_FOUND' };
    }

    // 如果设置为默认地址，需要先取消其他默认地址
    if (updateData.isDefault) {
      await prisma.addresses.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.addresses.update({
      where: { id: addressId },
      data: updateData
    });

    return updatedAddress;
  }

  /**
   * 设置默认地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   */
  async setDefaultAddress(userId: number, addressId: number): Promise<void> {
    const address = await prisma.addresses.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw { message: '地址不存在', code: 'ADDRESS_NOT_FOUND' };
    }

    // 使用事务来确保数据一致性
    await prisma.$transaction([
      // 取消所有默认地址
      prisma.addresses.updateMany({
        where: { userId },
        data: { isDefault: false }
      }),
      // 设置新的默认地址
      prisma.addresses.update({
        where: { id: addressId },
        data: { isDefault: true }
      })
    ]);
  }

  /**
   * 删除用户地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   */
  async deleteAddress(userId: number, addressId: number): Promise<void> {
    const address = await prisma.addresses.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw { message: '地址不存在', code: 'ADDRESS_NOT_FOUND' };
    }

    await prisma.addresses.delete({
      where: { id: addressId }
    });
  }

  /**
   * 批量删除地址
   * @param userId - 用户ID
   * @param addressIds - 地址ID数组
   */
  async batchDeleteAddresses(userId: number, addressIds: number[]): Promise<void> {
    await prisma.addresses.deleteMany({
      where: {
        id: { in: addressIds },
        userId
      }
    });
  }

}

// 导出单例实例
const userService = new UserService();
export default userService;