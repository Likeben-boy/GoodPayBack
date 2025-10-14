const { body, param, query } = require('express-validator');

/**
 * 用户验证规则
 */
const userValidation = {
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
    body('detailed_address')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('详细地址长度必须在5-100个字符之间'),
    body('postal_code')
      .optional()
      .matches(/^\d{6}$/)
      .withMessage('邮政编码必须是6位数字'),
    body('is_default')
      .optional()
      .isBoolean()
      .withMessage('is_default必须是布尔值')
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
    body('detailed_address')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('详细地址长度必须在5-100个字符之间'),
    body('postal_code')
      .optional()
      .matches(/^\d{6}$/)
      .withMessage('邮政编码必须是6位数字'),
    body('is_default')
      .optional()
      .isBoolean()
      .withMessage('is_default必须是布尔值')
  ]
};

/**
 * 餐厅验证规则
 */
const restaurantValidation = {
  getRestaurants: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    query('category')
      .optional()
      .isString()
      .withMessage('分类必须是字符串'),
    query('min_rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('最低评分必须是0-5之间的数字'),
    query('max_rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('最高评分必须是0-5之间的数字'),
    query('is_open')
      .optional()
      .isBoolean()
      .withMessage('is_open必须是布尔值')
  ],

  getRestaurantById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('餐厅ID必须是大于0的整数')
  ],

  searchRestaurants: [
    query('keyword')
      .trim()
      .notEmpty()
      .withMessage('请输入搜索关键词'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数')
  ],

  getNearbyRestaurants: [
    query('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('纬度必须是-90到90之间的数字'),
    query('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('经度必须是-180到180之间的数字'),
    query('radius')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('搜索半径必须大于0')
  ]
};

/**
 * 商品验证规则
 */
const productValidation = {
  getProducts: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    query('category')
      .optional()
      .isString()
      .withMessage('分类必须是字符串'),
    query('restaurant_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('餐厅ID必须是大于0的整数'),
    query('min_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('最低价格必须大于等于0'),
    query('max_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('最高价格必须大于等于0'),
    query('is_available')
      .optional()
      .isBoolean()
      .withMessage('is_available必须是布尔值')
  ],

  getProductById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('商品ID必须是大于0的整数')
  ],

  searchProducts: [
    query('keyword')
      .trim()
      .notEmpty()
      .withMessage('请输入搜索关键词'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数')
  ],

  getProductsByCategory: [
    param('categoryId')
      .isInt({ min: 1 })
      .withMessage('分类ID必须是大于0的整数')
  ],

  getProductsByRestaurant: [
    param('restaurantId')
      .isInt({ min: 1 })
      .withMessage('餐厅ID必须是大于0的整数')
  ]
};

/**
 * 购物车验证规则
 */
const cartValidation = {
  addToCart: [
    body('product_id')
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
    body('item_ids')
      .isArray({ min: 1 })
      .withMessage('item_ids必须是非空数组'),
    body('item_ids.*')
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
  ],

  mergeCart: [
    body('guest_cart_items')
      .isArray()
      .withMessage('guest_cart_items必须是数组'),
    body('guest_cart_items.*.product_id')
      .isInt({ min: 1 })
      .withMessage('商品ID必须是大于0的整数'),
    body('guest_cart_items.*.quantity')
      .isInt({ min: 1, max: 99 })
      .withMessage('数量必须是1-99之间的整数')
  ]
};

/**
 * 订单验证规则
 */
const orderValidation = {
  createOrder: [
    body('address_id')
      .isInt({ min: 1 })
      .withMessage('地址ID必须是大于0的整数'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('订单商品不能为空'),
    body('items.*.product_id')
      .isInt({ min: 1 })
      .withMessage('商品ID必须是大于0的整数'),
    body('items.*.quantity')
      .isInt({ min: 1, max: 99 })
      .withMessage('数量必须是1-99之间的整数'),
    body('items.*.price')
      .isFloat({ min: 0 })
      .withMessage('价格必须大于等于0'),
    body('payment_method')
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

  getOrderById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数')
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
  ],

  confirmOrder: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数')
  ],

  deleteOrder: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数')
  ],

  payOrder: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数'),
    body('payment_method')
      .isIn(['wechat', 'alipay', 'balance'])
      .withMessage('支付方式必须是wechat、alipay或balance')
  ],

  refundOrder: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数'),
    body('reason')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('退款原因长度必须在1-200个字符之间'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('退款金额必须大于等于0')
  ],

  reviewOrder: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('评分必须是1-5之间的整数'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('评论长度不能超过500个字符')
  ],

  reorder: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数')
  ]
};

/**
 * 支付验证规则
 */
const paymentValidation = {
  createPayment: [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数'),
    body('payment_method')
      .isIn(['wechat', 'alipay', 'balance'])
      .withMessage('支付方式必须是wechat、alipay或balance'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('支付金额必须大于0')
  ],

  wechatPay: [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('支付金额必须大于0'),
    body('openid')
      .optional()
      .isString()
      .withMessage('openid必须是字符串')
  ],

  alipayPay: [
    body('order_id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是大于0的整数'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('支付金额必须大于0'),
    body('return_url')
      .optional()
      .isURL()
      .withMessage('return_url必须是有效的URL')
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
  ],

  getRefundStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('支付ID必须是大于0的整数')
  ],

  getPaymentHistory: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
  ],

  getBills: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    query('month')
      .optional()
      .matches(/^\d{4}-\d{2}$/)
      .withMessage('月份格式必须是YYYY-MM')
  ],

  getReconciliation: [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    query('payment_method')
      .optional()
      .isIn(['wechat', 'alipay', 'balance'])
      .withMessage('支付方式必须是wechat、alipay或balance')
  ]
};

module.exports = {
  userValidation,
  restaurantValidation,
  productValidation,
  cartValidation,
  orderValidation,
  paymentValidation
};