import { prisma } from "../../../database/prisma";
import {
  payment_records_payment_method,
  payment_records_payment_status,
} from "@prisma/client";
import {
  Order,
  PaymentStatus,
  PaymentMethod,
  OrderStatus,
  PaymentRecord,
  RefundRecord,
  OrderPaymentStatus,
  RefundStatus,
} from "./order";
import { HttpCode } from "../../../types/index";

class OrderModel {
  /**
   * 创建订单（事务操作）
   * @param orderData - 订单数据
   * @returns 创建的订单信息
   */
  async create(orderData: Order): Promise<number> {
    // 显式构建数据对象，避免 exactOptionalPropertyTypes 错误
    const createData: any = {
      orderNumber: orderData.orderNumber,
      userId: orderData.userId,
      restaurantId: orderData.restaurantId,
      restaurantName: orderData.restaurantName,
      addressId: orderData.addressId,
      contactName: orderData.contactName,
      contactPhone: orderData.contactPhone,
      deliveryAddress: orderData.deliveryAddress,
      orderStatus: orderData.orderStatus,
      paymentStatus: orderData.paymentStatus,
      paymentMethod: orderData.paymentMethod,
      estimatedDeliveryTime: orderData.estimatedDeliveryTime,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      totalAmount: orderData.totalAmount,
      orderItems: {
        create: orderData.orderItems,
      },
      orderStatusLogs: {
        create: [
          {
            newStatus: orderData.orderStatus,
            operatorId: orderData.userId,
            operatorType: "user",
            remark: "创建订单",
          },
        ],
      },
    };

    if (orderData.orderNote) {
      createData.orderNote = orderData.orderNote;
    }

    const resultOrder = await prisma.orders.create({
      data: createData,
      include: {
        orderItems: true,
        orderStatusLogs: true,
      },
    });

    return resultOrder.id;
  }

  /**
   * 根据ID查询订单
   * @param id - 订单ID
   * @returns 订单信息
   */
  async findById(id: number): Promise<Order | null> {
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        orderItems: true,
        orderStatusLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) return null;

    // 显式转换枚举类型
    return {
      ...order,
      orderStatus: order.orderStatus as OrderStatus,
      paymentStatus: order.paymentStatus as OrderPaymentStatus,
      paymentMethod: order.paymentMethod as PaymentMethod,
    };
  }

  /**
   * 根据用户ID查询订单
   * @param userId - 用户ID
   * @param options - 查询选项
   * @returns 订单列表
   */
  async findByUserId(
    userId: number,
    options: {
      skip?: number;
      take?: number;
      status?: string;
    } = {}
  ): Promise<any[]> {
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
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
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
   * 更新订单状态,支付调用事务
   * @param orderId - 订单ID
   * @param status - 新状态
   * @param operatorId - 操作者ID
   * @param remark - 备注
   */
  async updateStatusWithPay(
    orderId: number,
    payId: number,
    orderStatus: OrderStatus,
    orderpaymentStatus: OrderPaymentStatus,
    payStatus: PaymentStatus,
    operatorId?: number,
    remark?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.orders.update({
        where: { id: orderId },
        data: {
          orderStatus: orderStatus,
          paymentStatus: orderpaymentStatus,
          paidAt: payStatus === PaymentStatus.SUCCESS ? new Date() : null,
        },
      });

      //更新支付状态
      await tx.paymentRecords.update({
        where: { id: payId },
        data: { paymentStatus: payStatus, paymentTime: new Date() },
      });

      // 创建状态变更日志
      await tx.orderStatusLogs.create({
        data: {
          orderId,
          newStatus: orderStatus,
          operatorId: operatorId || null,
          operatorType: operatorId ? "user" : "system",
          remark: remark || `状态变更为: ${orderStatus}`,
        },
      });
    });
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
    status: OrderStatus,
    operatorId?: number,
    remark?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const updateData: any = {
        orderStatus: status,
      };

      switch (status) {
        case OrderStatus.PREPARING:
          break;

        //如果切换为配送状态,则更新商家完成时间
        case OrderStatus.DELIVERING:
          updateData.completedAt = new Date();
          break;

        //如果切换为已完成,则更新实际配送时间
        case OrderStatus.COMPLETED:
          updateData.actualDeliveryTime = new Date();
          break;

        //如果是取消的话,则更新取消时间
        case OrderStatus.CANCELLED:
          updateData.cancelledAt = new Date();
          break;
        default:
          throw { message: "不支持的状态修改", code: HttpCode.FORBIDDEN };
      }

      // 更新订单状态
      await tx.orders.update({
        where: { id: orderId },
        data: updateData,
      });

      // 创建状态变更日志
      await tx.orderStatusLogs.create({
        data: {
          orderId,
          newStatus: status,
          operatorId: operatorId || null,
          operatorType: operatorId ? "user" : "system",
          remark: remark || `状态变更为: ${status}`,
        },
      });
    });
  }

  /**
   * 更新订单状态,与退款有关
   * @param orderId - 订单ID
   * @param status - 新状态
   * @param operatorId - 操作者ID
   * @param remark - 备注
   */
  async updateStatusWithRefund(
    orderId: number,
    refundId: number,
    orderStatus: OrderStatus,
    orderPaymentStatus: OrderPaymentStatus,
    refundStatus: RefundStatus,
    operatorId?: number,
    remark?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.orders.update({
        where: { id: orderId },
        data: { orderStatus: orderStatus, paymentStatus: orderPaymentStatus },
      });

      //更新支付状态
      await tx.refundRecords.update({
        where: { id: refundId },
        data: { refundStatus: refundStatus },
      });

      // 创建状态变更日志
      await tx.orderStatusLogs.create({
        data: {
          orderId,
          newStatus: orderStatus,
          operatorId: operatorId || null,
          operatorType: operatorId ? "user" : "system",
          remark: remark || `状态变更为: ${orderStatus}`,
        },
      });
    });
  }

  /**
   * 创建支付记录
   * @param paymentData - 支付记录数据
   * @returns 支付记录
   */
  async createPaymentRecord(paymentRecord: PaymentRecord): Promise<number> {
    const result = await prisma.paymentRecords.create({
      data: {
        orderId: paymentRecord.orderId,
        userId: paymentRecord.userId,
        paymentMethod: paymentRecord.paymentMethod,
        paymentAmount: paymentRecord.paymentAmount,
        transactionId: paymentRecord.transactionId,
      },
    });
    return result.id;
  }

  /**
   * 根据订单ID和支付状态查询支付记录
   * @param orderId - 订单ID
   * @param paymentStatus - 支付状态
   * @returns 支付记录
   */
  async findPaymentRecord(
    orderId: number,
    paymentStatus: PaymentStatus
  ): Promise<PaymentRecord | null> {
    const result = await prisma.paymentRecords.findFirst({
      where: {
        orderId: orderId,
        paymentStatus: paymentStatus,
      },
    });
    // 显式转换枚举类型
    if (!result) return null;

    return {
      ...result,
      paymentStatus: result.paymentStatus as PaymentStatus,
      paymentMethod: result.paymentMethod as PaymentMethod,
    };
  }

  /**
   * 创建退款记录
   * @param refundData - 退款记录数据
   * @returns 退款记录
   */
  async createRefundRecord(refundData: RefundRecord): Promise<number> {
    const refundRecord = await prisma.refundRecords.create({
      data: {
        orderId: refundData.orderId,
        userId: refundData.userId,
        paymentRecordId: refundData.paymentRecordId,
        refundAmount: refundData.refundAmount,
        refundReason: refundData.refundReason,
        refundType: refundData.refundType,
        refundStatus: refundData.refundStatus,
        processorType: refundData.processorType,
      },
    });

    return refundRecord.id;
  }

  /**
   * 修改退款记录,只做普通更新,不涉及联动其他数据
   * @param refundData - 退款记录数据
   * @returns 退款记录
   */
  async updateRefundRecordStatus(
    refundId: number,
    refundStatus: RefundStatus
  ): Promise<number> {
    const refundRecord = await prisma.refundRecords.update({
      data: {
        refundStatus: refundStatus,
      },
      where: {
        id: refundId,
      },
    });

    return refundRecord.id;
  }

  /**
   * 修改支付记录,只做普通更新,不涉及联动其他数据
   * @param refundData - 退款记录数据
   * @returns 退款记录
   */
  async updatePayRecordStatus(
    paymentId: number,
    paymentStatus: PaymentStatus
  ): Promise<number> {
    const refundRecord = await prisma.paymentRecords.update({
      data: {
        paymentStatus: paymentStatus,
      },
      where: {
        id: paymentId,
      },
    });
    return refundRecord.id;
  }

  /**
   * 获取订单列表（带分页和筛选）
   * @param userId - 用户ID
   * @param options - 查询选项
   * @returns 订单列表和总数
   */
  async getOrderListWithPagination(
    userId: number,
    options: {
      page?: number;
      limit?: number;
      status?: OrderStatus;
    }
  ): Promise<{ orders: any[]; total: number }> {
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
        orderBy: {
          createdAt: "desc",
        },
        skip: skip,
        take: limit,
        include: {
          orderItems: true,
        },
      }),
      prisma.orders.count({ where: where }),
    ]);

    return { orders, total };
  }

  /**
   * 获取订单详情（包含关联数据）
   * @param orderId - 订单ID
   * @param userId - 用户ID
   * @returns 订单详情
   */
  async getOrderDetailWithRelations(
    orderId: number,
    userId: number
  ): Promise<any> {
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        orderItems: true,
        orderReviews: true,
      },
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
  async getOrderStatistics(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalOrders: number;      // 用户所有订单数量
    pendingPaymentOrders: number;  // 用户待支付的订单数量(订单状态为created)
    deliveringOrders: number;  // 正在配送中的订单数量(订单状态为delivering)
    completedOrders: number;   // 用户已经收货的订单数量(订单状态为completed)
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

    const [totalOrders, pendingPaymentOrders, deliveringOrders, completedOrders] =
      await Promise.all([
        prisma.orders.count({ where }),
        prisma.orders.count({
          where: { ...where, orderStatus: OrderStatus.CREATED },
        }),
        prisma.orders.count({
          where: { ...where, orderStatus: OrderStatus.DELIVERING },
        }),
        prisma.orders.count({
          where: { ...where, orderStatus: OrderStatus.COMPLETED },
        }),
      ]);

    return {
      totalOrders,
      pendingPaymentOrders,
      deliveringOrders,
      completedOrders,
    };
  }

  /**
   * 获取订单状态统计
   * @param userId - 用户ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns 状态统计
   */
  async getOrderStatusCount(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
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
      cancelledCount,
    ] = await Promise.all([
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.CREATED },
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.CONFIRMED },
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.PREPARING },
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.DELIVERING },
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.COMPLETED },
      }),
      prisma.orders.count({
        where: { ...baseWhere, orderStatus: OrderStatus.CANCELLED },
      }),
    ]);

    return {
      created: createdCount,
      confirmed: confirmedCount,
      preparing: preparingCount,
      delivering: deliveringCount,
      completed: completedCount,
      cancelled: cancelledCount,
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
  async getOrderHistory(
    userId: number,
    startDate: Date,
    endDate: Date,
    groupByFormat: string
  ): Promise<any[]> {
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
        updatedAt: new Date(),
      },
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
        userId: userId,
      },
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
        orderId: orderId,
      },
      orderBy: {
        createdAt: "desc",
      },
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
        orderId: orderId,
      },
    });
  }

  /**
   * 转换支付方式枚举到Prisma枚举
   * @param method - 支付方式
   * @returns Prisma支付方式枚举
   */
  private convertPaymentMethod(
    method: PaymentMethod
  ): payment_records_payment_method {
    const mapping = {
      [PaymentMethod.WECHAT]: payment_records_payment_method.wechat,
      [PaymentMethod.ALIPAY]: payment_records_payment_method.alipay,
      [PaymentMethod.BALANCE]: payment_records_payment_method.balance,
      [PaymentMethod.APPLE]: payment_records_payment_method.apple,
    };
    return mapping[method];
  }
}

// 导出单例实例
const orderModel = new OrderModel();
export default orderModel;
