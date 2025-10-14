const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { validate } = require('../../middleware/validate');
const { paymentValidation } = require('../../middleware/validation');

/**
 * 支付路由模块
 * 包含支付、回调、退款等所有支付相关接口
 * 所有接口都需要用户登录
 */

// 创建支付订单
router.post('/create',
  validate(paymentValidation.createPayment),
  paymentController.createPayment
);

// 微信支付
router.post('/wechatpay',
  validate(paymentValidation.wechatPay),
  paymentController.wechatPay
);

// 支付宝支付
router.post('/alipay',
  validate(paymentValidation.alipayPay),
  paymentController.alipayPay
);

// 支付宝支付回调
router.post('/alipay/notify',
  paymentController.alipayNotify
);

// 微信支付回调
router.post('/wechatpay/notify',
  paymentController.wechatPayNotify
);

// 查询支付状态
router.get('/:id/status',
  validate(paymentValidation.getPaymentStatus),
  paymentController.getPaymentStatus
);

// 取消支付
router.put('/:id/cancel',
  validate(paymentValidation.cancelPayment),
  paymentController.cancelPayment
);

// 申请退款
router.post('/:id/refund',
  validate(paymentValidation.refundPayment),
  paymentController.refundPayment
);

// 查询退款状态
router.get('/:id/refund-status',
  validate(paymentValidation.getRefundStatus),
  paymentController.getRefundStatus
);

// 获取支付方式列表
router.get('/methods/list',
  paymentController.getPaymentMethods
);

// 获取支付记录
router.get('/history',
  validate(paymentValidation.getPaymentHistory),
  paymentController.getPaymentHistory
);

// 获取账单信息
router.get('/bills',
  validate(paymentValidation.getBills),
  paymentController.getBills
);

// 获取对账单
router.get('/reconciliation',
  validate(paymentValidation.getReconciliation),
  paymentController.getReconciliation
);

module.exports = router;