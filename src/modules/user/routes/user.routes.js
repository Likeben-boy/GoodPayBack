const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validate } = require('../../middleware/validate');
const { userValidation } = require('../../middleware/validation');

/**
 * 用户路由模块
 * 包含用户注册、登录、信息管理等所有用户相关接口
 */

// 用户注册
router.post('/register',
  validate(userValidation.register),
  userController.register
);

// 用户登录
router.post('/login',
  validate(userValidation.login),
  userController.login
);

// 用户登出
router.post('/logout',
  require('../../middleware/auth').authMiddleware,
  userController.logout
);

// 刷新令牌
router.post('/refresh-token',
  userController.refreshToken
);

// 获取用户信息
router.get('/profile',
  require('../../middleware/auth').authMiddleware,
  userController.getProfile
);

// 更新用户信息
router.put('/profile',
  require('../../middleware/auth').authMiddleware,
  validate(userValidation.updateProfile),
  userController.updateProfile
);

// 修改密码
router.put('/password',
  require('../../middleware/auth').authMiddleware,
  validate(userValidation.changePassword),
  userController.changePassword
);

// 重置密码
router.post('/reset-password',
  validate(userValidation.resetPassword),
  userController.resetPassword
);

// 上传头像
router.post('/avatar',
  require('../../middleware/auth').authMiddleware,
  require('../../middleware/upload').uploadSingle('avatar'),
  userController.uploadAvatar
);

// 获取用户地址列表
router.get('/addresses',
  require('../../middleware/auth').authMiddleware,
  userController.getAddresses
);

// 获取用户默认地址
router.get('/addresses/default',
  require('../../middleware/auth').authMiddleware,
  userController.getDefaultAddress
);

// 添加用户地址
router.post('/addresses',
  require('../../middleware/auth').authMiddleware,
  validate(userValidation.createAddress),
  userController.createAddress
);

// 更新用户地址
router.put('/addresses/:id',
  require('../../middleware/auth').authMiddleware,
  validate(userValidation.updateAddress),
  userController.updateAddress
);

// 设置默认地址
router.put('/addresses/:id/default',
  require('../../middleware/auth').authMiddleware,
  userController.setDefaultAddress
);

// 删除用户地址
router.delete('/addresses/:id',
  require('../../middleware/auth').authMiddleware,
  userController.deleteAddress
);

// 批量删除地址
router.delete('/addresses',
  require('../../middleware/auth').authMiddleware,
  userController.batchDeleteAddresses
);

module.exports = router;