import { body, param, query } from 'express-validator';

// 用户验证规则
export const userValidation = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名长度必须在3-20个字符之间')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    body('password')
      .isLength({ min: 6, max: 20 })
      .withMessage('密码长度必须在6-20个字符之间')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密码必须包含大小写字母和数字'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('nickname')
      .optional()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('昵称长度必须在1-20个字符之间')
  ],

  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('请输入用户名、邮箱或手机号'),
    body('password')
      .notEmpty()
      .withMessage('请输入密码')
  ],

  updateProfile: [
    body('nickname')
      .optional()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('昵称长度必须在1-20个字符之间'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('avatar')
      .optional()
      .isURL()
      .withMessage('请输入有效的头像URL')
  ],

  changePassword: [
    body('oldPassword')
      .notEmpty()
      .withMessage('请输入原密码'),
    body('newPassword')
      .isLength({ min: 6, max: 20 })
      .withMessage('新密码长度必须在6-20个字符之间')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('新密码必须包含大小写字母和数字')
  ],

  resetPassword: [
    body('email')
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('验证码必须是6位数字')
      .matches(/^\d{6}$/)
      .withMessage('验证码必须是6位数字'),
    body('newPassword')
      .isLength({ min: 6, max: 20 })
      .withMessage('新密码长度必须在6-20个字符之间')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('新密码必须包含大小写字母和数字')
  ],

  createAddress: [
    body('recipient')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('收件人姓名长度必须在2-20个字符之间'),
    body('phone')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('province')
      .trim()
      .notEmpty()
      .withMessage('请选择省份'),
    body('city')
      .trim()
      .notEmpty()
      .withMessage('请选择城市'),
    body('district')
      .trim()
      .notEmpty()
      .withMessage('请选择区县'),
    body('detailedAddress')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('详细地址长度必须在5-100个字符之间'),
    body('postalCode')
      .optional()
      .matches(/^\d{6}$/)
      .withMessage('邮政编码必须是6位数字'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault必须是布尔值')
  ],

  updateAddress: [
    body('recipient')
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('收件人姓名长度必须在2-20个字符之间'),
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('province')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('请选择省份'),
    body('city')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('请选择城市'),
    body('district')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('请选择区县'),
    body('detailedAddress')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('详细地址长度必须在5-100个字符之间'),
    body('postalCode')
      .optional()
      .matches(/^\d{6}$/)
      .withMessage('邮政编码必须是6位数字'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault必须是布尔值')
  ]
};

// 购物车验证规则
export const cartValidation = {
  addToCart: [
    body('productId')
      .isInt({ min: 1 })
      .withMessage('商品ID必须是大于0的整数'),
    body('quantity')
      .isInt({ min: 1, max: 99 })
      .withMessage('数量必须是1-99之间的整数'),
    body('specs')
      .optional()
      .isObject()
      .withMessage('规格必须是对象'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('备注长度不能超过200个字符')
  ],

  updateCartItem: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('购物车项ID必须是大于0的整数'),
    body('quantity')
      .isInt({ min: 1, max: 99 })
      .withMessage('数量必须是1-99之间的整数')
  ],

  batchRemoveCartItems: [
    body('itemIds')
      .isArray({ min: 1 })
      .withMessage('itemIds必须是非空数组'),
    body('itemIds.*')
      .isInt({ min: 1 })
      .withMessage('购物车项ID必须是大于0的整数')
  ],

  selectCartItem: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('购物车项ID必须是大于0的整数'),
    body('selected')
      .isBoolean()
      .withMessage('selected必须是布尔值')
  ],

  selectAllCartItems: [
    body('selected')
      .isBoolean()
      .withMessage('selected必须是布尔值')
  ]
};

// 订单验证规则
export const orderValidation = {
  createOrder: [
    body('addressId')
      .isInt({ min: 1 })
      .withMessage('地址ID必须是大于0的整数'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('订单商品不能为空'),
    body('items.*.productId')
      .isInt({ min: 1 })
      .withMessage('商品ID必须是大于0的整数'),
    body('items.*.quantity')
      .isInt({ min: 1, max: 99 })
      .withMessage('数量必须是1-99之间的整数'),
    body('items.*.price')
      .isFloat({ min: 0 })
      .withMessage('价格必须大于等于0'),
    body('paymentMethod')
      .isIn(['wechat', 'alipay', 'balance'])
      .withMessage('支付方式必须是wechat、alipay或balance'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('备注长度不能超过500个字符')
  ],

  getOrders: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    query('status')
      .optional()
      .isIn(['pending', 'paid', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'])
      .withMessage('订单状态无效')
  ],

  cancelOrder: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('取消原因长度不能超过200个字符')
  ]
};

// 支付验证规则
export const paymentValidation = {
  createPayment: [
    body('orderId')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数'),
    body('paymentMethod')
      .isIn(['wechat', 'alipay', 'balance'])
      .withMessage('支付方式必须是wechat、alipay或balance'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('支付金额必须大于0')
  ],

  getPaymentStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('支付ID必须是大于0的整数')
  ],

  cancelPayment: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('支付ID必须是大于0的整数')
  ],

  refundPayment: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('支付ID必须是大于0的整数'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('退款金额必须大于0'),
    body('reason')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('退款原因长度必须在1-200个字符之间')
  ]
};