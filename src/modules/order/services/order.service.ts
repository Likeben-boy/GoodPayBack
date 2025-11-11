import { payment_records_payment_status } from "@prisma/client";
import { dbLogger, businessLogger } from "@/utils/logger";
import {
  PlaceOrderRequest,
  PlaceOrderResponse,
  PayOrderRequest,
  PayOrderResponse,
  RefundOrderRequest,
  RefundOrderResponse,
  ConfirmOrderRequest,
  ConfirmOrderResponse,
  GetOrderListRequest,
  GetOrderDetailResponse,
  GetOrderStatisticsRequest,
  GetOrderStatisticsResponse,
  GetOrderStatusCountRequest,
  GetOrderStatusCountResponse,
  GetOrderHistoryRequest,
  GetOrderHistoryResponse,
  CreateOrderReviewRequest,
  CreateOrderReviewResponse,
  GetOrderReviewsRequest,
  GetOrderReviewsResponse,
  GetDeliveryInfoRequest,
  GetDeliveryInfoResponse,
  OrderItem,
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  RefundType,
  OrderHistoryItem,
} from "@/modules/order/models/order";
import { PaginatedResponse } from "@/types/index";
import orderModel from "../models/order.model";
import restaurantModel from "@/modules/restaurant/models/restaurant.model";
import addressModel from "@/modules/user/models/address.model";
import { HttpCode } from "@/types/index";

class OrderService {
  /**
   * 生成订单号
   * @returns 订单号
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `ORD${timestamp}${random}`;
  }

  /**
   * 创建订单
   * @param placeOrder - 用户创建订单数据
   * @param userId - 用户ID
   * @returns 创建结果
   */
  async createOrder(
    placeOrder: PlaceOrderRequest,
    userId: number
  ): Promise<PlaceOrderResponse> {
    businessLogger.info("servicee始执行创建订单");
    dbLogger.debug("创建订单service传入参数", { placeOrder, userId });

    // 步骤1: 校验餐厅信息
    // 1.1 查询餐厅是否存在且营业状态正常
    const restaurantResult = await restaurantModel.findById(
      placeOrder.restaurantId
    );
    if (!restaurantResult) {
      throw { message: "传入餐厅id不存在", code: HttpCode.VALIDATION_ERROR };
    }

    // 1.2 校验配送费是否与餐厅设置一致
    if (placeOrder.deliveryFee !== restaurantResult.deliveryFee) {
      businessLogger.warn("配送费不匹配", {
        expected: restaurantResult.deliveryFee,
        received: placeOrder.deliveryFee,
        restaurantId: placeOrder.restaurantId,
      });
      throw {
        message: `配送费不匹配，应为 ${restaurantResult.deliveryFee} 元`,
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤2: 校验收货地址信息
    // 2.1 验证收货地址是否存在且属于当前用户
    const addressResult = await addressModel.findByIdAndUserId(
      placeOrder.addressId,
      userId
    );
    if (!addressResult) {
      throw {
        message: "传入地址id不存在或无权访问",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤3: 校验菜品信息并构建订单项
    const validatedDishes: OrderItem[] = [];
    let calculatedSubtotal = 0;

    for (const item of placeOrder.items) {
      // 3.1 查询菜品是否存在且属于指定餐厅
      const dish = await restaurantModel.findDishByIdAndRestaurant(
        item.id,
        placeOrder.restaurantId
      );

      if (!dish) {
        businessLogger.warn("菜品不存在或不可用", {
          dishId: item.id,
          restaurantId: placeOrder.restaurantId,
        });
        throw {
          message: `菜品ID ${item.id} 不存在或不可用`,
          code: HttpCode.VALIDATION_ERROR,
        };
      }

      // 3.2 校验菜品价格是否与数据库一致
      const dishPrice = Number(dish.price);
      if (item.price !== dishPrice) {
        businessLogger.warn("菜品价格不匹配", {
          dishId: item.id,
          dishName: item.name,
          expected: dishPrice,
          received: item.price,
        });
        throw {
          message: `菜品 "${item.name}" 价格不匹配，应为 ${dishPrice} 元`,
          code: HttpCode.VALIDATION_ERROR,
        };
      }

      // 3.3 校验购买数量是否合法
      if (item.quantity <= 0) {
        throw {
          message: `菜品 "${item.name}" 的购买数量必须大于0`,
          code: HttpCode.VALIDATION_ERROR,
        };
      }

      // 3.4 构建订单项数据（用于存储到 order_items 表）
      const orderItem: OrderItem = {
        dishId: item.id,
        dishName: item.name,
        dishImage: item.image,
        dishPrice: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        createdAt: new Date(),
      };

      validatedDishes.push(orderItem);
      calculatedSubtotal += item.price * item.quantity;
    }

    // 步骤4: 校验订单金额
    // 4.1 校验商品小计金额
    if (placeOrder.subtotal !== calculatedSubtotal) {
      businessLogger.warn("商品小计金额不正确", {
        expected: calculatedSubtotal,
        received: placeOrder.subtotal,
      });
      throw {
        message: `商品小计金额不正确，应为 ${calculatedSubtotal} 元`,
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 4.2 校验订单总金额
    const calculatedTotal = calculatedSubtotal + placeOrder.deliveryFee;
    if (placeOrder.total !== calculatedTotal) {
      businessLogger.warn("订单总金额不正确", {
        expected: calculatedTotal,
        received: placeOrder.total,
        subtotal: calculatedSubtotal,
        deliveryFee: placeOrder.deliveryFee,
      });
      throw {
        message: `订单总金额不正确，应为 ${calculatedTotal} 元`,
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    businessLogger.info("订单数据校验通过", {
      userId,
      restaurantId: placeOrder.restaurantId,
      itemsCount: validatedDishes.length,
      total: placeOrder.total,
    });

    // 步骤5: 计算预计送达时间
    let deliveryTime;
    if (placeOrder.deliveryTime === "立即送达") {
      const now = new Date();
      // 餐厅配送时间（分钟）转换为毫秒并加到当前时间
      deliveryTime = new Date(
        now.getTime() + restaurantResult.deliveryTime * 60 * 1000
      );
    } else {
      const today = new Date();
      const [hours, minutes] = placeOrder.deliveryTime.split(":");
      if (
        !hours ||
        !minutes ||
        isNaN(parseInt(hours)) ||
        isNaN(parseInt(minutes))
      ) {
        throw {
          message: `订单送达时间格式错误: ${placeOrder.deliveryTime}`,
          code: HttpCode.VALIDATION_ERROR,
        };
      }
      deliveryTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(hours),
        parseInt(minutes)
      );
    }

    // 步骤6: 构建订单数据并调用模型创建订单
    const orderData: Order = {
      //生成订单号
      orderNumber: this.generateOrderNumber(),
      userId,
      restaurantId: placeOrder.restaurantId,
      addressId: placeOrder.addressId,
      contactName: addressResult.contactName,
      contactPhone: addressResult.contactPhone,
      deliveryAddress: `${addressResult.province} ${addressResult.city} ${addressResult.district} ${addressResult.detailAddress}`,
      orderStatus: OrderStatus.CREATED,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: placeOrder.paymentMethod,
      subtotal: calculatedSubtotal,
      deliveryFee: placeOrder.deliveryFee,
      totalAmount: calculatedTotal,
      orderNote: placeOrder.note || "",
      //TODO 优惠卷暂时不做
      estimatedDeliveryTime: deliveryTime,
      orderItems: validatedDishes,
    };

    // 步骤7: 创建订单记录（包含事务控制）
    const orderResultId = await orderModel.create(orderData);

    businessLogger.info("订单创建成功", {
      userId,
      orderId: orderResultId,
      orderNumber: orderData.orderNumber,
      restaurantId: placeOrder.restaurantId,
      totalAmount: placeOrder.total,
    });

    // 步骤8: 返回创建结果
    return {
      orderId: orderResultId,
      orderNumber: orderData.orderNumber,
      paymentMethod: placeOrder.paymentMethod,
    };
  }

  /**
   * 支付订单
   * @param payOrder - 支付订单数据
   * @param userId - 用户ID
   * @returns 支付结果
   */
  async payOrder(
    payOrder: PayOrderRequest,
    userId: number
  ): Promise<PayOrderResponse> {
    businessLogger.info("开始执行订单支付", {
      orderId: payOrder.orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    // 1.1 查询订单是否存在且属于当前用户
    const order = await orderModel.findById(payOrder.orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权操作该订单", code: HttpCode.FORBIDDEN };
    }

    // 1.2 校验订单状态是否允许支付
    if (order.orderStatus !== OrderStatus.CREATED) {
      throw { message: "订单状态不允许支付", code: HttpCode.VALIDATION_ERROR };
    }
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw {
        message: "订单已支付或支付状态异常",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤2: 创建支付记录 目前使用balance时为挡板支付
    let paymentResult;

          // 创建支付记录
      const paymentRecord = await orderModel.createPaymentRecord({
        orderId: payOrder.orderId,
        userId,
        paymentMethod: payOrder.paymentMethod,
        paymentAmount: order.total,
        transactionId: paymentData.transactionId,
        paymentStatus: PaymentStatus.SUCCESS,
      });
    if (payOrder.paymentMethod === PaymentMethod.BALANCE) {
          // 2.1 生成第三方交易ID（模拟）
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    // 2.2 调用第三方支付接口（模拟）
    // 这里应该调用实际的支付SDK，如微信支付、支付宝等
    paymentResult = await this.processPayment({
      orderId: payOrder.orderId,
      userId: userId,
      amount: order.totalAmount,
      paymentMethod: payOrder.paymentMethod,
      transactionId: transactionId,
    }); 
    }

    // 步骤3: 更新订单状态和支付记录
    if (paymentResult.success) {
      // 3.1 更新订单支付状态和订单状态
      await orderModel.updateStatus(
        payOrder.orderId,
        OrderStatus.CONFIRMED,
        userId,
        "支付成功"
      );

      // 3.2 记录支付成功日志
      businessLogger.info("订单支付成功", {
        orderId: payOrder.orderId,
        userId: userId,
        transactionId: transactionId,
        amount: order.totalAmount,
        paymentMethod: payOrder.paymentMethod,
      });

      return {
        paymentId: paymentResult.paymentId,
        orderId: payOrder.orderId,
        paymentMethod: payOrder.paymentMethod,
        paymentAmount: order.totalAmount,
        transactionId: transactionId,
        paymentStatus: PaymentStatus.SUCCESS,
      };
    } else {
      // 3.3 记录支付失败日志
      businessLogger.error("订单支付失败", {
        orderId: payOrder.orderId,
        userId: userId,
        error: paymentResult.errorMessage,
      });

      throw {
        message: paymentResult.errorMessage || "支付失败",
        code: HttpCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * 处理支付（模拟第三方支付接口）
   * @param paymentData - 支付数据
   * @returns 支付结果
   */
  private async processPayment(paymentData: {
    orderId: number;
    userId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionId: string;
  }): Promise<{
    success: boolean;
    paymentId: number;
    errorMessage?: string;
  }> {
    // 这里应该调用实际的第三方支付接口
    // 模拟支付处理时间
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟支付成功（实际应用中这里会调用微信支付、支付宝等SDK）
    const success = Math.random() > 0.1; // 90%成功率

    if (success) {


      return {
        success: true,
        paymentId: paymentRecord.id,
      };
    } else {
      return {
        success: false,
        paymentId: 0,
        errorMessage: "支付处理失败，请重试",
      };
    }
  }

  /**
   * 订单退款
   * @param refundOrder - 退款订单数据
   * @param userId - 用户ID
   * @returns 退款结果
   */
  async refundOrder(
    refundOrder: RefundOrderRequest,
    userId: number
  ): Promise<RefundOrderResponse> {
    businessLogger.info("开始执行订单退款", {
      orderId: refundOrder.orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    // 1.1 查询订单是否存在且属于当前用户
    const order = await orderModel.findById(refundOrder.orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权操作该订单", code: HttpCode.FORBIDDEN };
    }

    // 1.2 校验订单状态是否允许退款
    if (order.orderStatus === OrderStatus.CANCELLED) {
      throw {
        message: "订单已取消，无法退款",
        code: HttpCode.VALIDATION_ERROR,
      };
    }
    if (order.paymentStatus !== PaymentStatus.SUCCESS) {
      throw {
        message: "订单未支付成功，无法退款",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤2: 校验退款金额
    const refundAmount = refundOrder.amount || order.totalAmount;
    if (refundAmount <= 0) {
      throw { message: "退款金额必须大于0", code: HttpCode.VALIDATION_ERROR };
    }
    if (refundAmount > order.totalAmount) {
      throw {
        message: "退款金额不能超过订单总金额",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤3: 查询支付记录用于退款
    const paymentRecord = await orderModel.findPaymentRecord(
      refundOrder.orderId,
      payment_records_payment_status.success
    );

    if (!paymentRecord) {
      throw { message: "未找到有效的支付记录", code: HttpCode.NOT_FOUND };
    }

    // 步骤4: 处理退款逻辑
    const refundResult = await this.processRefund({
      orderId: refundOrder.orderId,
      userId: userId,
      paymentRecordId: paymentRecord.id,
      refundAmount: refundAmount,
      refundReason: refundOrder.reason,
      originalAmount: order.totalAmount,
    });

    // 步骤5: 更新订单状态
    if (refundResult.success) {
      // 如果是全额退款，取消订单；部分退款则更新订单状态
      if (refundAmount >= order.totalAmount) {
        await orderModel.updateStatus(
          refundOrder.orderId,
          OrderStatus.CANCELLED,
          userId,
          "全额退款"
        );
      }

      businessLogger.info("订单退款成功", {
        orderId: refundOrder.orderId,
        userId: userId,
        refundAmount: refundAmount,
        refundId: refundResult.refundId,
      });

      return {
        refundId: refundResult.refundId,
        orderId: refundOrder.orderId,
        refundAmount: refundAmount,
        refundStatus: refundResult.refundStatus,
        refundType:
          refundAmount >= order.totalAmount
            ? RefundType.FULL
            : RefundType.PARTIAL,
      };
    } else {
      businessLogger.error("订单退款失败", {
        orderId: refundOrder.orderId,
        userId: userId,
        error: refundResult.errorMessage,
      });

      throw {
        message: refundResult.errorMessage || "退款失败",
        code: HttpCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * 处理退款（模拟第三方退款接口）
   * @param refundData - 退款数据
   * @returns 退款结果
   */
  private async processRefund(refundData: {
    orderId: number;
    userId: number;
    paymentRecordId: number;
    refundAmount: number;
    refundReason: string;
    originalAmount: number;
  }): Promise<{
    success: boolean;
    refundId: number;
    refundStatus: any;
    errorMessage?: string;
  }> {
    // 模拟退款处理时间
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟退款成功（实际应用中这里会调用第三方退款接口）
    const success = Math.random() > 0.1; // 90%成功率

    if (success) {
      // 创建退款记录
      const refundRecord = await orderModel.createRefundRecord({
        orderId: refundData.orderId,
        userId: refundData.userId,
        paymentRecordId: refundData.paymentRecordId,
        refundAmount: refundData.refundAmount,
        refundReason: refundData.refundReason,
        refundType:
          refundData.refundAmount >= refundData.originalAmount
            ? "full"
            : "partial",
      });

      return {
        success: true,
        refundId: refundRecord.id,
        refundStatus: refundRecord.refundStatus,
      };
    } else {
      return {
        success: false,
        refundId: 0,
        refundStatus: null,
        errorMessage: "退款处理失败，请重试",
      };
    }
  }

  /**
   * 确认收货
   * @param confirmOrder - 确认收货数据
   * @param userId - 用户ID
   * @returns 确认结果
   */
  async confirmOrder(
    confirmOrder: ConfirmOrderRequest,
    userId: number
  ): Promise<ConfirmOrderResponse> {
    businessLogger.info("开始执行确认收货", {
      orderId: confirmOrder.orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    const order = await orderModel.findById(confirmOrder.orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权操作该订单", code: HttpCode.FORBIDDEN };
    }

    // 步骤2: 校验订单状态是否允许确认收货
    if (order.orderStatus !== OrderStatus.DELIVERING) {
      throw {
        message: "订单状态不允许确认收货",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤3: 更新订单状态为已完成
    const completedAt = new Date();
    await orderModel.updateStatus(
      confirmOrder.orderId,
      OrderStatus.COMPLETED,
      userId,
      "用户确认收货"
    );

    businessLogger.info("确认收货成功", {
      orderId: confirmOrder.orderId,
      userId: userId,
      completedAt: completedAt,
    });

    return {
      orderId: confirmOrder.orderId,
      orderStatus: OrderStatus.COMPLETED,
      completedAt: completedAt,
    };
  }

  /**
   * 获取订单列表（优化版）
   * @param userId - 用户ID
   * @param params - 查询参数
   * @returns 分页订单列表响应
   */
  async getOrderList(
    userId: number,
    params: GetOrderListRequest
  ): Promise<PaginatedResponse<Order>> {
    businessLogger.info("开始获取订单列表", { userId, params });

    // 步骤1: 解析分页参数
    const page = params.page || 1;
    const limit = params.limit || 10;

    // 步骤2: 使用model查询订单列表和总数
    const { orders, total } = await orderModel.getOrderListWithPagination(
      userId,
      params
    );

    // 步骤3: 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const currentPage = Number(page);

    businessLogger.info("获取订单列表成功", {
      userId: userId,
      page: currentPage,
      limit: limit,
      total: total,
      ordersCount: orders.length,
    });

    // 步骤4: 返回标准分页响应格式
    return {
      data: orders,
      pagination: {
        page: currentPage,
        limit: limit,
        total: total,
        pages: totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    };
  }

  /**
   * 获取订单详情（优化版）
   * @param params - 查询参数
   * @param userId - 用户ID
   * @returns 订单详情
   */
  async getOrderDetail(
    orderId: number,
    userId: number
  ): Promise<GetOrderDetailResponse> {
    businessLogger.info("开始获取订单详情", { orderId, userId });

    // 步骤1: 使用model查询订单详情
    const order = await orderModel.getOrderDetailWithRelations(orderId, userId);

    // 步骤2: 校验订单是否存在
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }

    businessLogger.info("获取订单详情成功", {
      orderId: orderId,
      userId: userId,
    });

    return {
      order: order as any,
    };
  }

  /**
   * 取消订单
   * @param orderId - 订单ID
   * @param userId - 用户ID
   * @returns 取消结果
   */
  async cancelOrder(orderId: number, userId: number): Promise<boolean> {
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权操作该订单", code: HttpCode.FORBIDDEN };
    }
    if (order.orderStatus !== OrderStatus.CREATED) {
      throw { message: "订单状态不允许取消", code: HttpCode.VALIDATION_ERROR };
    }

    await orderModel.updateStatus(
      orderId,
      OrderStatus.CANCELLED,
      userId,
      "用户取消订单"
    );
    return true;
  }

  /**
   * 获取订单统计信息
   * @param userId - 用户ID
   * @param params - 查询参数
   * @returns 订单统计信息
   */
  async getOrderStatistics(
    userId: number,
    params: GetOrderStatisticsRequest = {}
  ): Promise<GetOrderStatisticsResponse> {
    businessLogger.info("开始获取订单统计", { userId, params });

    // 步骤1: 处理日期参数
    const startDate = params.startDate ? new Date(params.startDate) : undefined;
    const endDate = params.endDate ? new Date(params.endDate) : undefined;

    // 步骤2: 使用model查询统计数据
    const statistics = await orderModel.getOrderStatistics(
      userId,
      startDate,
      endDate
    );

    // 步骤3: 计算平均订单金额
    const averageAmount =
      statistics.completedOrders > 0
        ? statistics.totalAmount / statistics.completedOrders
        : 0;

    businessLogger.info("获取订单统计成功", {
      userId: userId,
      totalOrders: statistics.totalOrders,
      completedOrders: statistics.completedOrders,
      totalAmount: statistics.totalAmount,
    });

    return {
      totalOrders: statistics.totalOrders,
      completedOrders: statistics.completedOrders,
      cancelledOrders: statistics.cancelledOrders,
      totalAmount: statistics.totalAmount,
      averageAmount: averageAmount,
    };
  }

  /**
   * 获取订单状态统计
   * @param userId - 用户ID
   * @param params - 查询参数
   * @returns 订单状态统计
   */
  async getOrderStatusCount(
    userId: number,
    params: GetOrderStatusCountRequest = {}
  ): Promise<GetOrderStatusCountResponse> {
    businessLogger.info("开始获取订单状态统计", { userId, params });

    // 步骤1: 处理日期参数
    const startDate = params.startDate ? new Date(params.startDate) : undefined;
    const endDate = params.endDate ? new Date(params.endDate) : undefined;

    // 步骤2: 使用model查询状态统计
    const statusCount = await orderModel.getOrderStatusCount(
      userId,
      startDate,
      endDate
    );

    businessLogger.info("获取订单状态统计成功", {
      userId: userId,
    });

    return statusCount;
  }

  /**
   * 获取订单历史统计
   * @param userId - 用户ID
   * @param params - 查询参数
   * @returns 订单历史统计
   */
  async getOrderHistory(
    userId: number,
    params: GetOrderHistoryRequest = {}
  ): Promise<GetOrderHistoryResponse> {
    businessLogger.info("开始获取订单历史统计", { userId, params });

    // 步骤1: 设置默认参数
    const type = params.type || "daily";
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const startDate = params.startDate
      ? new Date(params.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 默认30天

    // 步骤2: 根据统计类型构建查询
    let groupByFormat: string;

    switch (type) {
      case "daily":
        groupByFormat = "%Y-%m-%d";
        break;
      case "weekly":
        groupByFormat = "%Y-%u"; // 年+周数
        break;
      case "monthly":
        groupByFormat = "%Y-%m";
        break;
      default:
        groupByFormat = "%Y-%m-%d";
    }

    // 步骤3: 使用model查询历史数据
    const historyData = await orderModel.getOrderHistory(
      userId,
      startDate,
      endDate,
      groupByFormat
    );

    // 步骤4: 转换数据格式
    const history: OrderHistoryItem[] = historyData.map((item) => ({
      date: item.date,
      orderCount: Number(item.orderCount),
      orderAmount: Number(item.orderAmount),
    }));

    // 步骤5: 计算总计
    const totalOrders = history.reduce((sum, item) => sum + item.orderCount, 0);
    const totalAmount = history.reduce(
      (sum, item) => sum + item.orderAmount,
      0
    );

    businessLogger.info("获取订单历史统计成功", {
      userId: userId,
      type: type,
      startDate: startDate,
      endDate: endDate,
      dataPoints: history.length,
    });

    return {
      history: history,
      totalOrders: totalOrders,
      totalAmount: totalAmount,
    };
  }

  /**
   * 创建订单评价
   * @param reviewData - 评价数据
   * @param userId - 用户ID
   * @returns 评价结果
   */
  async createOrderReview(
    reviewData: CreateOrderReviewRequest,
    userId: number
  ): Promise<CreateOrderReviewResponse> {
    businessLogger.info("开始创建订单评价", {
      orderId: reviewData.orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    const order = await orderModel.findById(reviewData.orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权操作该订单", code: HttpCode.FORBIDDEN };
    }

    // 步骤2: 校验订单状态是否允许评价
    if (order.orderStatus !== OrderStatus.COMPLETED) {
      throw {
        message: "订单未完成，无法评价",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤3: 检查是否已经评价过
    const existingReview = await orderModel.findOrderReview(
      reviewData.orderId,
      userId
    );

    if (existingReview) {
      throw { message: "该订单已经评价过了", code: HttpCode.VALIDATION_ERROR };
    }

    // 步骤4: 校验评分范围
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw { message: "评分必须在1-5之间", code: HttpCode.VALIDATION_ERROR };
    }

    // 步骤5: 创建评价记录
    const review = await orderModel.createOrderReview({
      orderId: reviewData.orderId,
      userId: userId,
      restaurantId: order.restaurantId,
      rating: reviewData.rating,
      content: reviewData.comment || "",
      images: reviewData.images || [],
    });

    businessLogger.info("创建订单评价成功", {
      orderId: reviewData.orderId,
      userId: userId,
      reviewId: review.id,
      rating: reviewData.rating,
    });

    return {
      reviewId: review.id,
      orderId: reviewData.orderId,
      rating: reviewData.rating,
      createdAt: review.createdAt!,
    };
  }

  /**
   * 获取订单评价列表
   * @param params - 查询参数
   * @param userId - 用户ID
   * @returns 评价列表
   */
  async getOrderReviews(
    params: GetOrderReviewsRequest,
    userId: number
  ): Promise<GetOrderReviewsResponse> {
    businessLogger.info("开始获取订单评价列表", {
      orderId: params.orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    const order = await orderModel.findById(params.orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权访问该订单", code: HttpCode.FORBIDDEN };
    }

    // 步骤2: 查询评价列表
    const reviews = await orderModel.getOrderReviews(params.orderId);

    // 步骤3: 计算统计信息
    const total = reviews.length;
    const averageRating =
      total > 0
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
          total
        : 0;

    businessLogger.info("获取订单评价列表成功", {
      orderId: params.orderId,
      userId: userId,
      total: total,
      averageRating: averageRating,
    });

    return {
      reviews: reviews as any[],
      total: total,
      averageRating: averageRating,
    };
  }

  /**
   * 获取配送信息
   * @param params - 查询参数
   * @param userId - 用户ID
   * @returns 配送信息
   */
  async getDeliveryInfo(
    params: GetDeliveryInfoRequest,
    userId: number
  ): Promise<GetDeliveryInfoResponse> {
    businessLogger.info("开始获取配送信息", {
      orderId: params.orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    const order = await orderModel.findById(params.orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权访问该订单", code: HttpCode.FORBIDDEN };
    }

    // 步骤2: 使用model查询配送信息
    const deliveryInfo = await orderModel.getDeliveryInfo(params.orderId);

    if (!deliveryInfo) {
      throw { message: "配送信息不存在", code: HttpCode.NOT_FOUND };
    }

    // 步骤3: 查询配送员信息（如果已分配）
    let deliveryUser = {
      id: deliveryInfo.deliveryUserId,
      name: "配送员",
      phone: "13800138000",
      avatar: "",
    };
    if (deliveryInfo.deliveryUserId) {
      // 这里应该查询配送员表，暂时返回模拟数据
      deliveryUser = {
        id: deliveryInfo.deliveryUserId,
        name: "配送员",
        phone: "13800138000",
        avatar: "",
      };
    }

    businessLogger.info("获取配送信息成功", {
      orderId: params.orderId,
      userId: userId,
      deliveryStatus: deliveryInfo.deliveryStatus,
    });

    return {
      deliveryInfo: deliveryInfo as any,
      deliveryUser: deliveryUser,
    };
  }
}

// 导出单例实例
const orderService = new OrderService();
export default orderService;
