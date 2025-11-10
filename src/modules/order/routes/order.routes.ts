import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { validate } from '../../../middleware/validation';
import { orderValidation } from '../../../middleware/validation/schemas';
import { orderLimiter } from '../../../middleware/rateLimiter';

// 创建路由器
const router: Router = Router();

/**
 * 订单路由模块
 * 包含下单、订单支付、订单查询、订单管理等所有订单相关接口
 */

// 1. 下订单
router.post('/create',
  orderLimiter,
  validate(orderValidation.createOrder),
  orderController.createOrder
);

// 2. 订单支付
router.post('/pay',
  orderLimiter,
  validate(orderValidation.payOrder),
  orderController.payOrder
);

// 3. 订单退款
router.post('/refund',
  validate(orderValidation.refundOrder),
  orderController.refundOrder
);

// 4. 取消订单
router.post('/cancel',
  validate(orderValidation.cancelOrder),
  orderController.cancelOrder
);

// 5. 确认收货
router.post('/confirm',
  orderController.confirmOrder
);

// 6. 获取订单列表（支持分页和状态筛选）
router.get('/',
  validate(orderValidation.getOrderList),
  orderController.getOrderList
);

// 7. 获取订单详情
router.get('/detail',
  orderController.getOrderDetail
);

// 8. 获取用户订单统计信息
router.get('/statistics/overview',
  orderController.getOrderStatistics
);

// 9. 获取订单状态数量统计
router.get('/statistics/status-count',
  orderController.getOrderStatusCount
);

// 10. 获取用户订单历史（按时间统计）
router.get('/statistics/history',
  validate(orderValidation.getOrderHistory),
  orderController.getOrderHistory
);

// 11. 评价订单
router.post('/review',
  validate(orderValidation.createReview),
  orderController.createOrderReview
);

// 12. 获取订单评价列表
router.get('/reviews',
  orderController.getOrderReviews
);

// 13. 重新下单（复制历史订单）
router.post('/reorder',
  orderController.reorder
);

// 14. 获取订单配送信息
router.get('/delivery',
  orderController.getDeliveryInfo
);

export default router;