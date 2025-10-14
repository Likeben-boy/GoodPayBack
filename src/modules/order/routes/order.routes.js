const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validate } = require('../../middleware/validate');
const { orderValidation } = require('../../middleware/validation');

/**
 * 订单路由模块
 * 包含订单创建、查询、状态管理等所有订单相关接口
 * 所有接口都需要用户登录
 */

// 创建订单
router.post('/create',
  validate(orderValidation.createOrder),
  orderController.createOrder
);

// 获取订单列表
router.get('/',
  validate(orderValidation.getOrders),
  orderController.getOrders
);

// 获取订单详情
router.get('/:id',
  validate(orderValidation.getOrderById),
  orderController.getOrderById
);

// 取消订单
router.put('/:id/cancel',
  validate(orderValidation.cancelOrder),
  orderController.cancelOrder
);

// 确认收货
router.put('/:id/confirm',
  validate(orderValidation.confirmOrder),
  orderController.confirmOrder
);

// 删除订单
router.delete('/:id',
  validate(orderValidation.deleteOrder),
  orderController.deleteOrder
);

// 订单支付
router.post('/:id/pay',
  validate(orderValidation.payOrder),
  orderController.payOrder
);

// 申请退款
router.post('/:id/refund',
  validate(orderValidation.refundOrder),
  orderController.refundOrder
);

// 评价订单
router.post('/:id/review',
  validate(orderValidation.reviewOrder),
  orderController.reviewOrder
);

// 获取订单状态
router.get('/:id/status',
  validate(orderValidation.getOrderById),
  orderController.getOrderStatus
);

// 获取订单支付信息
router.get('/:id/payment-info',
  validate(orderValidation.getOrderById),
  orderController.getPaymentInfo
);

// 获取订单配送信息
router.get('/:id/delivery-info',
  validate(orderValidation.getOrderById),
  orderController.getDeliveryInfo
);

// 重新下单
router.post('/:id/reorder',
  validate(orderValidation.reorder),
  orderController.reorder
);

// 获取订单统计信息
router.get('/statistics',
  orderController.getOrderStatistics
);

module.exports = router;