import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authMiddleware } from '../../../middleware/auth';
import { validate } from '../../../middleware/validation';
import { userValidation } from '../../../middleware/validation/schemas';
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  uploadLimiter
} from '../../../middleware/rateLimiter';
import { businessLogger, securityLogger } from '../../../utils/logger';

// 创建路由器
const router: Router = Router();

/**
 * 用户路由模块
 * 包含用户注册、登录、信息管理等所有用户相关接口
 */

// 用户注册
router.post('/register',
  (req, res, next) => {
    businessLogger.info('User registration attempt', {
      phone: req.body.phone,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  },
  registerLimiter,
  validate(userValidation.register),
  userController.register
);

// 用户登录
router.post('/login',
  (req, res, next) => {
    securityLogger.info('User login attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  },
  loginLimiter,
  validate(userValidation.login),
  userController.login
);

// 用户登出
router.post('/logout', authMiddleware, userController.logout);

// 刷新令牌
router.post('/refresh-token', userController.refreshToken);

// 获取用户信息
router.get('/profile', authMiddleware, userController.getProfile);

// 更新用户信息
router.put('/profile', authMiddleware, validate(userValidation.updateProfile), userController.updateProfile);

// 修改密码
router.put('/password', authMiddleware, validate(userValidation.changePassword), userController.changePassword);

// 重置密码
router.post('/reset-password', passwordResetLimiter, userController.resetPassword);

// 获取用户地址列表
router.get('/addresses', authMiddleware, userController.getAddresses);

// 获取用户默认地址
router.get('/addresses/default', authMiddleware, userController.getDefaultAddress);

// 添加用户地址
router.post('/addresses', authMiddleware, validate(userValidation.createAddress), userController.createAddress);

// 更新用户地址
router.put('/addresses/:id', authMiddleware, validate(userValidation.updateAddress), userController.updateAddress);

// 设置默认地址
router.put('/addresses/:id/default', authMiddleware, userController.setDefaultAddress);

// 删除用户地址
router.delete('/addresses/:id', authMiddleware, userController.deleteAddress);

// 批量删除地址
router.delete('/addresses', authMiddleware, userController.batchDeleteAddresses);

export default router;