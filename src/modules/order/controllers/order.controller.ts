import { Request, Response } from 'express';
import orderService from '../services/order.service';
import { successResponse, errorResponse } from '../../../utils/response';
import logger, { businessLogger, securityLogger } from '../../../utils/logger';
import { HttpCode } from '@/types/index';
import { OrderStatus } from '../models/order';

class OrderController {
  /**
   * 创建订单
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      businessLogger.info('用户开始创建订单', {
        userId: req.user?.userId,
        restaurantId: req.body.restaurantId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const result = await orderService.createOrder(req.body, req.user!.userId);

      businessLogger.info('下单成功', {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        restaurantId: req.body.restaurantId,
        userId: req.user!.userId,
        ip: req.ip
      });

      successResponse(res, '下单成功', result, 200);
    } catch (error: any) {
      logger.error('下单失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 订单支付
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async payOrder(req: Request, res: Response): Promise<void> {
    try {
      securityLogger.info('用户发起订单支付', {
        userId: req.user?.userId,
        orderId: req.body.orderId,
        paymentMethod: req.body.paymentMethod,
        ip: req.ip
      });

      const result = await orderService.payOrder(req.body.orderId, req.user!.userId);

      businessLogger.info('订单支付成功', {
        userId: req.user?.userId,
        orderId: req.body.orderId,
        ip: req.ip
      });

      successResponse(res, '支付成功', result);
    } catch (error: any) {
      logger.error('订单支付失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.body.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 订单退款
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async refundOrder(req: Request, res: Response): Promise<void> {
    try {
      businessLogger.info('用户申请订单退款', {
        userId: req.user?.userId,
        orderId: req.body.orderId,
        reason: req.body.reason,
        ip: req.ip
      });

      const result = await orderService.refundOrder(req.body, req.user!.userId);

      successResponse(res, '退款申请提交成功', result);
    } catch (error: any) {
      logger.error('订单退款申请失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.body.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 取消订单
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      businessLogger.info('用户取消订单', {
        userId: req.user?.userId,
        orderId: req.body.orderId,
        reason: req.body.reason,
        ip: req.ip
      });

      const result = await orderService.cancelOrder(req.body.orderId, req.user!.userId);

      successResponse(res, '订单取消成功', result);
    } catch (error: any) {
      logger.error('取消订单失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.body.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

    /**
   * 修改订单状态,模拟商家发货和骑手送到
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, status } = req.body;

      // 将字符串转换为 OrderStatus 枚举
      const orderStatus = status as OrderStatus;

      const result = await orderService.changeStatus(orderId, orderStatus, req.user!.userId);
      successResponse(res, '修改订单状态成功', result);
    } catch (error: any) {
      logger.error('修改订单状态失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.query.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 确认收货
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async confirmOrder(req: Request, res: Response): Promise<void> {
    try {
      businessLogger.info('用户确认收货', {
        userId: req.user?.userId,
        orderId: req.body.orderId,
        ip: req.ip
      });

      const result = await orderService.confirmOrder(req.body.orderId, req.user!.userId);

      successResponse(res, '确认收货成功', result);
    } catch (error: any) {
      logger.error('确认收货失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.body.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 获取订单列表
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getOrderList(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const options = {
        page: Number(page),
        limit: Number(limit),
        status: status as OrderStatus
      };

      const result = await orderService.getOrderList(req.user!.userId, options);

      successResponse(res, '获取订单列表成功', result);
    } catch (error: any) {
      logger.error('获取订单列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 获取订单详情
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getOrderDetail(req: Request, res: Response): Promise<void> {
    try {

      const { orderId } = req.query;
      if (!orderId || orderId == null) {
        console.log('Debug - orderId is null or undefined');
        throw new Error('订单ID不能为空');
      }

      const result = await orderService.getOrderDetail(Number(orderId), req.user!.userId);

      successResponse(res, '获取订单详情成功', result);
    } catch (error: any) {
      logger.error('获取订单详情失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.query.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 获取用户订单统计信息
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getOrderStatistics(req: Request, res: Response): Promise<void> {
    try {
      const result = await orderService.getOrderStatistics(req.user!.userId);

      successResponse(res, '获取订单统计成功', result);
    } catch (error: any) {
      logger.error('获取订单统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 获取订单状态数量统计
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getOrderStatusCount(req: Request, res: Response): Promise<void> {
    try {
      const result = await orderService.getOrderStatusCount(req.user!.userId);

      successResponse(res, '获取订单状态统计成功', result);
    } catch (error: any) {
      logger.error('获取订单状态统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 获取用户订单历史统计
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getOrderHistory(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, type } = req.query;
      const options = {
        startDate: startDate as string,
        endDate: endDate as string,
        type: type
      };

      const result = await orderService.getOrderHistory(req.user!.userId, options);

      successResponse(res, '获取订单历史统计成功', result);
    } catch (error: any) {
      logger.error('获取订单历史统计失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 创建订单评价
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async createOrderReview(req: Request, res: Response): Promise<void> {
    try {
      businessLogger.info('用户评价订单', {
        userId: req.user?.userId,
        orderId: req.body.orderId,
        rating: req.body.rating,
        ip: req.ip
      });

      const result = await orderService.createOrderReview(req.body, req.user!.userId);

      successResponse(res, '订单评价成功', result, 200);
    } catch (error: any) {
      logger.error('订单评价失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.body.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 获取订单评价列表
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getOrderReviews(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.query;
      if (!orderId) {
        throw new Error('订单ID不能为空');
      }

      const result = await orderService.getOrderReviews(Number(orderId), req.user!.userId);

      successResponse(res, '获取订单评价列表成功', result);
    } catch (error: any) {
      logger.error('获取订单评价列表失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.query.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 获取订单配送信息
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getDeliveryInfo(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.query;
      if (!orderId) {
        throw new Error('订单ID不能为空');
      }

      const result = await orderService.getDeliveryInfo(Number(orderId), req.user!.userId);

      successResponse(res, '获取配送信息成功', result);
    } catch (error: any) {
      logger.error('获取配送信息失败', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        orderId: req.query.orderId,
        ip: req.ip,
        code: error.code || HttpCode.INTERNAL_ERROR
      });
      errorResponse(res, error.message, 400, error.code || HttpCode.INTERNAL_ERROR);
    }
  }
}

// 导出单例实例
const orderController = new OrderController();
export default orderController;