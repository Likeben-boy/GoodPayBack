import { prisma } from "@/database/prisma";
import { payment_records_payment_method, payment_records_payment_status } from "@prisma/client";
import { Order, PaymentStatus, PaymentMethod, OrderStatus } from "./order";

interface CreateOrderData {
  userId: number;
  restaurantId: number;
  addressId: number;
  items: any[];
  paymentMethod: string;
  deliveryTime?: string;
  note?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

class OrderModel {
  /**
   * 创建订单（事务操作）
   * @param orderData - 订单数据
   * @returns 创建的订单信息
   */
  async create(orderData: Order): Promise<number> {
      const resultOrder = await prisma.orders.create({
        data: {...orderData,
          orderItems:{
            create: orderData.orderItems
          },
          orderStatusLogs:{
            create: [{
              newStatus:'创建订单',
              operatorId:orderData.userId,
              operatorType:'user'
            }]
          }
        },
        include:{
          orderItems:true,
          orderStatusLogs:true
        }
      });

    return resultOrder.id;
  }

  /**
   * 根据ID查询订单
   * @param id - 订单ID
   * @returns 订单信息
   */
  async findById(id: number): Promise<any | null> {
    const order = await (prisma as any).orders.findFirst({
      where: { id },
      include: {
        orderItems: true,
        orderStatusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) return null;

    return order;
  }

  /**
   * 根据用户ID查询订单
   * @param userId - 用户ID
   * @param options - 查询选项
   * @returns 订单列表
   */
  async findByUserId(userId: number, options: {
    skip?: number;
    take?: number;
    status?: string;
  } = {}): Promise<any[]> {
    const { skip = 0, take = 10, status } = options;

    const where: any = { userId };
    if (status) {
      where.orderStatus = status;
    }

    const orders = await (prisma as any).orders.findMany({
      where,
      include: {
        orderItems: true,
        orderStatusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });

    return orders;
  }

  /**
   * 统计用户订单数量
   * @param userId - 用户ID
   * @param status - 订单状态（可选）
   * @returns 订单数量
   */
  async countByUserId(userId: number, status?: string): Promise<number> {
    const where: any = { userId };
    if (status) {
      where.orderStatus = status;
    }

    return await (prisma as any).orders.count({ where });
  }

  /**
   * 更新订单状态
   * @param orderId - 订单ID
   * @param status - 新状态
   * @param operatorId - 操作者ID
   * @param remark - 备注
   */
  async updateStatus(
    orderId: number,
    status: string,
    operatorId?: number,
    remark?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 获取当前订单状态
      const order = await (tx as any).orders.findFirst({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error("订单不存在");
      }

      // 更新订单状态
      await (tx as any).orders.update({
        where: { id: orderId },
        data: { orderStatus: status }
      });

      // 创建状态变更日志
      await (tx as any).orderStatusLogs.create({
        data: {
          orderId,
          oldStatus: order.orderStatus,
          newStatus: status,
          operatorId: operatorId || null,
          operatorType: operatorId ? "user" : "system",
          remark: remark || `状态变更为: ${status}`,
        }
      });
    });
  }

  /**
   * 创建支付记录
   * @param paymentData - 支付记录数据
   * @returns 支付记录
   */
  async createPaymentRecord(paymentData: {
    orderId: number;
    userId: number;
    paymentMethod: PaymentMethod;
    paymentAmount: number;
    transactionId: string;
    paymentStatus: PaymentStatus;
  }): Promise<any> {
    // 转换枚举类型到Prisma枚举
    const prismaPaymentMethod = this.convertPaymentMethod(paymentData.paymentMethod);
    const prismaPaymentStatus = this.convertPaymentStatus(paymentData.paymentStatus);

    const paymentRecord = await prisma.paymentRecords.create({
      data: {
        orderId: paymentData.orderId,
        userId: paymentData.userId,
        paymentMethod: prismaPaymentMethod,
        paymentAmount: paymentData.paymentAmount,
        transactionId: paymentData.transactionId,
        paymentStatus: prismaPaymentStatus,
        paymentTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return paymentRecord;
  }

  /**
   * 根据订单ID和支付状态查询支付记录
   * @param orderId - 订单ID
   * @param paymentStatus - 支付状态
   * @returns 支付记录
   */
  async findPaymentRecord(orderId: number, paymentStatus: payment_records_payment_status): Promise<any> {
    return await prisma.paymentRecords.findFirst({
      where: {
        orderId: orderId,
        paymentStatus: paymentStatus
      }
    });
  }

  /**
   * 创建退款记录
   * @param refundData - 退款记录数据
   * @returns 退款记录
   */
  async createRefundRecord(refundData: {
    orderId: number;
    userId: number;
    paymentRecordId: number;
    refundAmount: number;
    refundReason: string;
    refundType: string;
  }): Promise<any> {
    const refundRecord = await prisma.refundRecords.create({
      data: {
        orderId: refundData.orderId,
        userId: refundData.userId,
        paymentRecordId: refundData.paymentRecordId,
        refundAmount: refundData.refundAmount,
        refundReason: refundData.refundReason,
        refundType: refundData.refundType === 'full' ? 'full' : 'partial',
        refundStatus: 'pending',
        processorType: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return refundRecord;
  }

  /**
   * 获取订单列表（带分页和筛选）
   * @param userId - 用户ID
   * @param options - 查询选项
   * @returns 订单列表和总数
   */
  async getOrderListWithPagination(userId: number, options: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  }): Promise<{ orders: any[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId: userId };
    if (options.status) {
      where.orderStatus = options.status;
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where: where,
        include: {
          orderItems: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: skip,
        take: limit
      }),
      prisma.orders.count({ where: where })
    ]);

    return { orders, total };
  }

  /**
   * 获取订单详情（包含关联数据）
   * @param orderId - 订单ID
   * @param userId - 用户ID
   * @returns 订单详情
   */
  async getOrderDetailWithRelations(orderId: number, userId: number): Promise<any> {
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId: userId
      },
      include: {
        orderItems: true,
        orderReviews: true
      }
    });

    return order;
  }

  /**
   * 获取订单统计信息
   * @param userId - 用户ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns 统计信息
   */
  async getOrderStatistics(userId: number, startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalAmount: number;
  }> {
    const where: any = { userId: userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalAmountResult
    ] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.count({
        where: { ...where, orderStatus: OrderStatus.COMPLETED }
      }),
      prisma.orders.count({
        where: { ...where, orderStatus: OrderStatus.CANCELLED }
      }),
      prisma.orders.aggregate({
        where: { ...where, orderStatus: OrderStatus.COMPLETED },
        _sum: { totalAmount: true }
      })
    ]);

    const totalAmount = Number(totalAmountResult._sum.totalAmount || 0);

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalAmount
    };
  }

  /**
   * 获取订单状态统计
   * @param userId - 用户ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns 状态统计
   */
  async getOrderStatusCount(userId: number, startDate?: Date, endDate?: Date): Promise<{
    created: number;
    confirmed: number;
    preparing: number;
    delivering: number;
    completed: number;
    cancelled: number;
  }> {
    const baseWhere: any = { userId: userId };

    if (startDate || endDate) {
      baseWhere.createdAt = {};
      if (startDate) {
        baseWhere.createdAt.gte = startDate;
      }
      if (endDate) {
        baseWhere.createdAt.lte = endDate;
      }
    }

    const [
      createdCount,
      confirmedCount,
      preparingCount,
      deliveringCount,
      completedCount,
      cancelledCount
    ] = await Promise.all([
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.CREATED }
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.CONFIRMED }
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.PREPARING }
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.DELIVERING }
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.COMPLETED }
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.CANCELLED }
      })
    ]);

    return {
      created: createdCount,
      confirmed: confirmedCount,
      preparing: preparingCount,
      delivering: deliveringCount,
      completed: completedCount,
      cancelled: cancelledCount
    };
  }

  /**
   * 获取订单历史统计
   * @param userId - 用户ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @param groupByFormat - 分组格式
   * @returns 历史统计
   */
  async getOrderHistory(userId: number, startDate: Date, endDate: Date, groupByFormat: string): Promise<any[]> {
    const historyQuery = `
      SELECT
        DATE_FORMAT(createdAt, '${groupByFormat}') as date,
        COUNT(*) as orderCount,
        COALESCE(SUM(totalAmount), 0) as orderAmount
      FROM orders
      WHERE userId = ?
        AND createdAt >= ?
        AND createdAt <= ?
      GROUP BY DATE_FORMAT(createdAt, '${groupByFormat}')
      ORDER BY date ASC
    `;

    const historyData = await prisma.$queryRawUnsafe<any[]>(
      historyQuery,
      userId,
      startDate,
      endDate
    );

    return historyData;
  }

  /**
   * 创建订单评价
   * @param reviewData - 评价数据
   * @returns 评价记录
   */
  async createOrderReview(reviewData: {
    orderId: number;
    userId: number;
    restaurantId: number;
    rating: number;
    content: string;
    images: string[];
  }): Promise<any> {
    const review = await prisma.orderReviews.create({
      data: {
        orderId: reviewData.orderId,
        userId: reviewData.userId,
        restaurantId: reviewData.restaurantId,
        rating: reviewData.rating,
        content: reviewData.content,
        images: reviewData.images,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return review;
  }

  /**
   * 检查订单是否已评价
   * @param orderId - 订单ID
   * @param userId - 用户ID
   * @returns 评价记录
   */
  async findOrderReview(orderId: number, userId: number): Promise<any> {
    return await prisma.orderReviews.findFirst({
      where: {
        orderId: orderId,
        userId: userId
      }
    });
  }

  /**
   * 获取订单评价列表
   * @param orderId - 订单ID
   * @returns 评价列表
   */
  async getOrderReviews(orderId: number): Promise<any[]> {
    const reviews = await prisma.orderReviews.findMany({
      where: {
        orderId: orderId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return reviews;
  }

  /**
   * 获取配送信息
   * @param orderId - 订单ID
   * @returns 配送信息
   */
  async getDeliveryInfo(orderId: number): Promise<any> {
    return await prisma.deliveryInfo.findUnique({
      where: {
        orderId: orderId
      }
    });
  }

  /**
   * 转换支付方式枚举到Prisma枚举
   * @param method - 支付方式
   * @returns Prisma支付方式枚举
   */
  private convertPaymentMethod(method: PaymentMethod): payment_records_payment_method {
    const mapping = {
      [PaymentMethod.WECHAT]: payment_records_payment_method.wechat,
      [PaymentMethod.ALIPAY]: payment_records_payment_method.alipay,
      [PaymentMethod.BALANCE]: payment_records_payment_method.balance,
      [PaymentMethod.APPLE]: payment_records_payment_method.apple
    };
    return mapping[method];
  }

  /**
   * 转换支付状态枚举到Prisma枚举
   * @param status - 支付状态
   * @returns Prisma支付状态枚举
   */
  private convertPaymentStatus(status: PaymentStatus): payment_records_payment_status {
    const mapping = {
      [PaymentStatus.PENDING]: payment_records_payment_status.pending,
      [PaymentStatus.PROCESSING]: payment_records_payment_status.processing,
      [PaymentStatus.SUCCESS]: payment_records_payment_status.success,
      [PaymentStatus.FAILED]: payment_records_payment_status.failed,
      [PaymentStatus.REFUNDING]: payment_records_payment_status.pending,
      [PaymentStatus.REFUNDED]: payment_records_payment_status.success
    };
    return mapping[status];
  }
}

// 导出单例实例
const orderModel = new OrderModel();
export default orderModel;