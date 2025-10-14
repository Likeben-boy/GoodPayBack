const userModel = require('../models/user.model');
const addressModel = require('../models/address.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../../config');
const { generateToken, verifyToken } = require('../../../utils/jwt');
const { sendEmail, sendSMS } = require('../../../utils/notification');
const logger = require('../../../utils/logger');

class UserService {
  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    // 检查用户名是否已存在
    const existingUser = await userModel.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    if (userData.email) {
      const existingEmail = await userModel.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('邮箱已存在');
      }
    }

    // 检查手机号是否已存在
    if (userData.phone) {
      const existingPhone = await userModel.findByPhone(userData.phone);
      if (existingPhone) {
        throw new Error('手机号已存在');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, config.BCRYPT_SALT_ROUNDS);

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

    return {
      userId,
      tokens,
      user: await userModel.findById(userId)
    };
  }

  /**
   * 用户登录
   * @param {Object} loginData - 登录数据
   * @returns {Promise<Object>} 登录结果
   */
  async login(loginData) {
    const { username, password, email, phone } = loginData;

    let user;

    // 根据不同的登录方式查找用户
    if (username) {
      user = await userModel.findByUsername(username);
    } else if (email) {
      user = await userModel.findByEmail(email);
    } else if (phone) {
      user = await userModel.findByPhone(phone);
    } else {
      throw new Error('请提供用户名、邮箱或手机号');
    }

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.status !== 'active') {
      throw new Error('用户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('密码错误');
    }

    // 生成JWT令牌
    const tokens = generateToken(user.id);

    // 记录日志
    logger.info(`User logged in: ${user.id}`);

    return {
      userId: user.id,
      tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        status: user.status
      }
    };
  }

  /**
   * 用户登出
   * @param {number} userId - 用户ID
   */
  async logout(userId) {
    // 这里可以添加令牌黑名单等逻辑
    logger.info(`User logged out: ${userId}`);
    return true;
  }

  /**
   * 刷新令牌
   * @param {Object} tokenData - 令牌数据
   * @returns {Promise<Object>} 新的令牌
   */
  async refreshToken(tokenData) {
    const { refreshToken } = tokenData;

    try {
      const decoded = verifyToken(refreshToken);
      const user = await userModel.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        throw new Error('用户不存在或已被禁用');
      }

      const tokens = generateToken(user.id);
      return tokens;
    } catch (error) {
      throw new Error('刷新令牌无效或已过期');
    }
  }

  /**
   * 获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserProfile(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
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
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateProfile(userId, updateData) {
    // 不允许更新的字段
    const forbiddenFields = ['password', 'username', 'status', 'created_at'];
    const cleanData = { ...updateData };

    forbiddenFields.forEach(field => {
      delete cleanData[field];
    });

    const affectedRows = await userModel.update(userId, cleanData);
    if (affectedRows === 0) {
      throw new Error('更新失败');
    }

    return await userModel.findById(userId);
  }

  /**
   * 修改密码
   * @param {number} userId - 用户ID
   * @param {Object} passwordData - 密码数据
   */
  async changePassword(userId, passwordData) {
    const { oldPassword, newPassword } = passwordData;

    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error('旧密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_SALT_ROUNDS);

    // 更新密码
    await userModel.update(userId, { password: hashedPassword });

    // 记录日志
    logger.info(`User password changed: ${userId}`);
  }

  /**
   * 重置密码
   * @param {Object} resetData - 重置密码数据
   */
  async resetPassword(resetData) {
    const { email, code, newPassword } = resetData;

    // 验证邮箱验证码
    // 这里应该调用验证码验证服务

    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_SALT_ROUNDS);

    // 更新密码
    await userModel.update(user.id, { password: hashedPassword });

    // 记录日志
    logger.info(`User password reset: ${user.id}`);
  }

  /**
   * 上传头像
   * @param {number} userId - 用户ID
   * @param {Object} file - 文件对象
   * @returns {Promise<Object>} 头像URL
   */
  async uploadAvatar(userId, file) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await userModel.update(userId, { avatar: avatarUrl });
    return { avatarUrl };
  }

  /**
   * 获取用户地址列表
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 地址列表
   */
  async getUserAddresses(userId) {
    return await addressModel.findByUserId(userId);
  }

  /**
   * 获取用户默认地址
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 默认地址
   */
  async getDefaultAddress(userId) {
    return await addressModel.findDefaultByUserId(userId);
  }

  /**
   * 创建用户地址
   * @param {number} userId - 用户ID
   * @param {Object} addressData - 地址数据
   * @returns {Promise<Object>} 创建的地址
   */
  async createAddress(userId, addressData) {
    const address = await addressModel.create({
      user_id: userId,
      ...addressData
    });

    // 如果设置为默认地址，需要处理其他地址
    if (addressData.is_default) {
      await addressModel.setDefault(userId, address);
    }

    return await addressModel.findById(address);
  }

  /**
   * 更新用户地址
   * @param {number} userId - 用户ID
   * @param {number} addressId - 地址ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的地址
   */
  async updateAddress(userId, addressId, updateData) {
    const address = await addressModel.findById(addressId);
    if (!address || address.user_id !== userId) {
      throw new Error('地址不存在');
    }

    // 如果设置为默认地址，需要处理其他地址
    if (updateData.is_default) {
      await addressModel.setDefault(userId, addressId);
    }

    await addressModel.update(addressId, updateData);
    return await addressModel.findById(addressId);
  }

  /**
   * 设置默认地址
   * @param {number} userId - 用户ID
   * @param {number} addressId - 地址ID
   */
  async setDefaultAddress(userId, addressId) {
    const address = await addressModel.findById(addressId);
    if (!address || address.user_id !== userId) {
      throw new Error('地址不存在');
    }

    await addressModel.setDefault(userId, addressId);
  }

  /**
   * 删除用户地址
   * @param {number} userId - 用户ID
   * @param {number} addressId - 地址ID
   */
  async deleteAddress(userId, addressId) {
    const address = await addressModel.findById(addressId);
    if (!address || address.user_id !== userId) {
      throw new Error('地址不存在');
    }

    await addressModel.delete(addressId);
  }

  /**
   * 批量删除地址
   * @param {number} userId - 用户ID
   * @param {Array} addressIds - 地址ID数组
   */
  async batchDeleteAddresses(userId, addressIds) {
    await addressModel.batchDelete(userId, addressIds);
  }
}

module.exports = new UserService();