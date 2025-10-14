import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authMiddleware } from '../../../middleware/auth';
import { uploadSingle, imageOnly } from '../../../middleware/upload';
import { validate } from '../../../middleware/validation';

// 创建路由器
const router = Router();

/**
 * 用户路由模块
 * 包含用户注册、登录、信息管理等所有用户相关接口
 */

// 用户注册
router.post('/register', userController.register);

// 用户登录
router.post('/login', userController.login);

// 用户登出
router.post('/logout', authMiddleware, userController.logout);

// 刷新令牌
router.post('/refresh-token', userController.refreshToken);

// 获取用户信息
router.get('/profile', authMiddleware, userController.getProfile);

// 更新用户信息
router.put('/profile', authMiddleware, userController.updateProfile);

// 修改密码
router.put('/password', authMiddleware, userController.changePassword);

// 重置密码
router.post('/reset-password', userController.resetPassword);

// 上传头像
router.post('/avatar',
  authMiddleware,
  uploadSingle('avatar'),
  imageOnly,
  userController.uploadAvatar
);

// 获取用户地址列表
router.get('/addresses', authMiddleware, userController.getAddresses);

// 获取用户默认地址
router.get('/addresses/default', authMiddleware, userController.getDefaultAddress);

// 添加用户地址
router.post('/addresses', authMiddleware, userController.createAddress);

// 更新用户地址
router.put('/addresses/:id', authMiddleware, userController.updateAddress);

// 设置默认地址
router.put('/addresses/:id/default', authMiddleware, userController.setDefaultAddress);

// 删除用户地址
router.delete('/addresses/:id', authMiddleware, userController.deleteAddress);

// 批量删除地址
router.delete('/addresses', authMiddleware, userController.batchDeleteAddresses);

export default router;