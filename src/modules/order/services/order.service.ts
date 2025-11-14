import { dbLogger, businessLogger } from "../../../utils/logger";
import Decimal from "decimal.js";
import {
  PlaceOrderRequest,
  PlaceOrderResponse,
  PayOrderResponse,
  RefundOrderRequest,
  RefundOrderResponse,
  ConfirmOrderResponse,
  GetOrderListRequest,
  GetOrderDetailResponse,
  GetOrderStatisticsRequest,
  GetOrderStatusCountRequest,
  GetOrderStatusCountResponse,
  GetOrderHistoryRequest,
  GetOrderHistoryResponse,
  CreateOrderReviewRequest,
  CreateOrderReviewResponse,
  GetOrderReviewsResponse,
  GetDeliveryInfoResponse,
  OrderItem,
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  RefundType,
  OrderHistoryItem,
  OrderPaymentStatus,
  RefundRecord,
  RefundStatus,
  ProcessorType,
} from "../../../modules/order/models/order";
import { PaginatedResponse } from "../../../types/index";
import orderModel from "../models/order.model";
import restaurantModel from "../../..//modules/restaurant/models/restaurant.model";
import addressModel from "../../..//modules/user/models/address.model";
import { HttpCode } from "../../..//types/index";
import { log } from "console";

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
    const expectedDeliveryFee = new Decimal(restaurantResult.deliveryFee);
    const receivedDeliveryFee = new Decimal(placeOrder.deliveryFee);
    if (!receivedDeliveryFee.equals(expectedDeliveryFee)) {
      businessLogger.warn("配送费不匹配", {
        expected: expectedDeliveryFee.toNumber(),
        received: placeOrder.deliveryFee,
        restaurantId: placeOrder.restaurantId,
      });
      throw {
        message: `配送费不匹配，应为 ${expectedDeliveryFee.toNumber()} 元`,
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
    let calculatedSubtotal = new Decimal(0);

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
      const dishPrice = dish.price;
      const itemPrice = new Decimal(item.price);
      if (!itemPrice.equals(dishPrice)) {
        businessLogger.warn("菜品价格不匹配", {
          dishId: item.id,
          dishName: item.name,
          expected: dishPrice.toNumber(),
          received: item.price,
        });
        throw {
          message: `菜品 "${
            item.name
          }" 价格不匹配，应为 ${dishPrice.toNumber()} 元`,
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
      const itemSubtotal = dishPrice.times(item.quantity);
      const orderItem: OrderItem = {
        dishId: item.id,
        dishName: item.name,
        dishImage: item.image,
        dishPrice: dishPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        createdAt: new Date(),
      };

      validatedDishes.push(orderItem);
      calculatedSubtotal = calculatedSubtotal.plus(itemSubtotal);
    }

    // 步骤4: 校验订单金额
    // 4.1 校验商品小计金额
    const calculatedSubtotalNumber = calculatedSubtotal.toNumber();
    if (placeOrder.subtotal !== calculatedSubtotalNumber) {
      businessLogger.warn("商品小计金额不正确", {
        expected: calculatedSubtotalNumber,
        received: placeOrder.subtotal,
      });
      throw {
        message: `商品小计金额不正确，应为 ${calculatedSubtotalNumber} 元`,
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 4.2 校验订单总金额
    const calculatedTotal = calculatedSubtotal.plus(placeOrder.deliveryFee);
    if (placeOrder.total !== calculatedTotal.toNumber()) {
      businessLogger.warn("订单总金额不正确", {
        expected: calculatedTotal.toNumber(),
        received: placeOrder.total,
        subtotal: calculatedSubtotalNumber,
        deliveryFee: placeOrder.deliveryFee,
      });
      throw {
        message: `订单总金额不正确，应为 ${calculatedTotal.toNumber()} 元`,
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
      restaurantName: restaurantResult.name,
      addressId: placeOrder.addressId,
      contactName: addressResult.contactName,
      contactPhone: addressResult.contactPhone,
      deliveryAddress: `${addressResult.province} ${addressResult.city} ${addressResult.district} ${addressResult.detailAddress}`,
      orderStatus: OrderStatus.CREATED,
      paymentStatus: OrderPaymentStatus.PENDING,
      paymentMethod: placeOrder.paymentMethod,
      subtotal: calculatedSubtotal,
      deliveryFee: new Decimal(placeOrder.deliveryFee),
      totalAmount: calculatedSubtotal.plus(placeOrder.deliveryFee),
      orderNote: placeOrder.note ?? null,
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
  async payOrder(orderId: number, userId: number): Promise<PayOrderResponse> {
    businessLogger.info("开始执行订单支付", {
      orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    // 1.1 查询订单是否存在且属于当前用户
    const order = await orderModel.findById(orderId);
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
    if (order.paymentStatus !== OrderPaymentStatus.PENDING) {
      throw {
        message: "订单已支付或支付状态异常",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤2: 创建支付记录 目前使用balance时为挡板支付
    let paymentResult = {
      status: "pending",
      message: "",
    };

    // 2.1 生成第三方交易ID（模拟）
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    // 创建支付记录
    const paymentRecordId: number = await orderModel.createPaymentRecord({
      //主要是为了填充id
      id: 0,
      orderId: orderId,
      userId,
      paymentMethod: order.paymentMethod,
      paymentAmount: order.totalAmount,
      transactionId: transactionId,
      paymentStatus: PaymentStatus.PENDING,
    });
    if (order.paymentMethod === PaymentMethod.BALANCE) {
      // 2.2 调用第三方支付接口（模拟）
      // 这里应该调用实际的支付SDK，如微信支付、支付宝等
      paymentResult = await this.processPaymentBalance({
        orderId,
        userId: userId,
        amount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        transactionId: transactionId,
      });
    } else {
      //TODO 暂时没对接第三方
      throw {
        message: "不支持的支付方式",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤3: 更新订单状态和支付记录
    if (paymentResult.status === "success") {
      // 3.1 更新订单支付状态和订单状态
      await orderModel.updateStatusWithPay(
        orderId,
        paymentRecordId,
        OrderStatus.CONFIRMED,
        OrderPaymentStatus.SUCCESS,
        PaymentStatus.SUCCESS,
        userId,
        "支付成功"
      );

      // 3.2 记录支付成功日志
      businessLogger.info("订单支付成功", {
        orderId: orderId,
        userId: userId,
        transactionId: transactionId,
        amount: order.totalAmount,
        paymentMethod: order.paymentMethod,
      });

      return {
        paymentId: paymentRecordId,
        orderId,
        paymentMethod: order.paymentMethod,
        paymentAmount: new Decimal(order.totalAmount),
        transactionId: transactionId,
        paymentStatus: PaymentStatus.SUCCESS,
      };
    } else {
      // 3.3 记录支付失败日志
      businessLogger.error("订单支付失败", {
        orderId,
        userId: userId,
        error: paymentResult.message,
      });

      throw {
        message: paymentResult.message || "支付失败",
        code: HttpCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * 处理支付（模拟第三方支付接口）
   * @param paymentData - 支付数据
   * @returns 支付结果
   */
  private async processPaymentBalance(paymentData: {
    orderId: number;
    userId: number;
    amount: Decimal;
    paymentMethod: PaymentMethod;
    transactionId: string;
  }): Promise<{
    status: string;
    message: string;
  }> {
    // 这里应该调用实际的第三方支付接口
    // 模拟支付处理时间
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟支付成功（实际应用中这里会调用微信支付、支付宝等SDK）
    const success = Math.random() > 0.1; // 90%成功率

    if (success) {
      return {
        status: "success",
        message: "支付成功",
      };
    } else {
      businessLogger.error('挡板系统模拟失败')
      return {
        status: "fail",
        message: "支付处理失败，请重试",
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
    if (order.paymentStatus !== OrderPaymentStatus.SUCCESS) {
      throw {
        message: "订单未支付成功，无法退款",
        code: HttpCode.VALIDATION_ERROR,
      };
    }

    // 步骤2: 查询支付记录用于退款
    const paymentRecord = await orderModel.findPaymentRecord(
      refundOrder.orderId,
      PaymentStatus.SUCCESS
    );

    if (!paymentRecord) {
      throw { message: "未找到有效的支付记录", code: HttpCode.NOT_FOUND };
    }

    // 步骤3: 处理退款逻辑,构建退款逻辑对象
    // 创建退款记录
    let refundResult = {
      status: "pending",
      message: "",
    };

    const refundRecord: RefundRecord = {
      orderId: refundOrder.orderId,
      userId,
      paymentRecordId: paymentRecord.id,
      refundAmount: paymentRecord.paymentAmount,
      refundReason: refundOrder.reason,
      refundType: RefundType.FULL,
      id: 0,
      refundStatus: RefundStatus.PENDING,
      processorType: ProcessorType.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const refundId = await orderModel.createRefundRecord(refundRecord);
    // 步骤3: 处理退款逻辑,构建退款逻辑对象
    if (paymentRecord.paymentMethod === PaymentMethod.BALANCE) {
      refundResult = await this.processRefundBalance();
    } else {
      //TODO 还没对接第三方退款接口
      throw { message: "不支持的退款类型", code: HttpCode.NOT_FOUND };
    }

    // 步骤5: 更新订单状态
    if (refundResult.status === "success") {
      await orderModel.updateStatusWithRefund(
        refundOrder.orderId,
        refundId,
        OrderStatus.CANCELLED,
        OrderPaymentStatus.REFUNDED,
        RefundStatus.COMPLETED,
        userId,
        refundOrder.reason
      );

      businessLogger.info("订单退款成功", {
        orderId: refundOrder.orderId,
        userId: userId,
        refundAmount: refundRecord.refundAmount,
        refundId: refundId,
      });
      return {
        refundId,
        orderId: refundOrder.orderId,
        refundAmount: refundRecord.refundAmount,
        refundStatus: RefundStatus.COMPLETED,
        refundType: RefundType.FULL,
      };
    } else {
      await orderModel.updateRefundRecordStatus(
        refundId,
        RefundStatus.COMPLETED
      );

      businessLogger.error("订单退款失败", {
        orderId: refundOrder.orderId,
        userId: userId,
        error: refundResult.message,
      });

      throw {
        message: refundResult.message || "退款失败",
        code: HttpCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * 处理退款（模拟第三方退款接口）
   * @param refundData - 退款数据
   * @returns 退款结果
   */
  private async processRefundBalance(): Promise<{
    status: string;
    refundTxnNo?: string;
    message: string;
  }> {
    // 模拟退款处理时间
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟退款成功（实际应用中这里会调用第三方退款接口）
    const success = Math.random() > 0.1; // 90%成功率

    //模拟的第三方退款id
    const transactionId = `REFUND${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    if (success) {
      return {
        status: "success",
        refundTxnNo: transactionId,
        message: "chenggong",
      };
    } else {
            businessLogger.error('挡板系统模拟失败')
      return {
        status: "fail",
        message: "退款处理失败，请重试",
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
    orderId: number,
    userId: number
  ): Promise<ConfirmOrderResponse> {
    businessLogger.info("开始执行确认收货", {
      orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    const order = await orderModel.findById(orderId);
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
      orderId,
      OrderStatus.COMPLETED,
      userId,
      "用户确认收货"
    );

    businessLogger.info("确认收货成功", {
      orderId,
      userId: userId,
      completedAt: completedAt,
    });

    return {
      orderId,
      orderStatus: OrderStatus.COMPLETED,
      completedAt: completedAt,
    };
  }

  /**
   * 切换状态
   * @param userId - 用户ID
   * @returns 确认结果
   */
  async changeStatus(
    orderId: number,
    orderStatus: OrderStatus,
    userId: number
  ): Promise<ConfirmOrderResponse> {
    businessLogger.info("开始执行状态切换", {
      orderId,
      orderStatus,
      userId,
    });

    // 步骤1: 校验订单信息
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权操作该订单", code: HttpCode.FORBIDDEN };
    }

    let remark;

    switch (orderStatus) {
      case OrderStatus.PREPARING:
        remark = "商家接单";

        //如果前置状态不是created,则报错
        if (order.orderStatus !== OrderStatus.CONFIRMED) {
          throw { message: "前置状态不对", code: HttpCode.FORBIDDEN };
        }
        break;
      case OrderStatus.DELIVERING:
        remark = "骑手接单";
        //如果前置状态不是PREPARING,则报错
        if (order.orderStatus !== OrderStatus.PREPARING) {
          throw { message: "前置状态不对", code: HttpCode.FORBIDDEN };
        }
        break;
      default:
        throw { message: "不支持的状态修改", code: HttpCode.FORBIDDEN };
    }

    // 步骤3: 更新订单状态
    const completedAt = new Date();
    await orderModel.updateStatus(orderId, orderStatus, userId, remark);

    businessLogger.info("确认修改状态成功", {
      orderId,
      userId: userId,
      completedAt: completedAt,
    });

    return {
      orderId,
      orderStatus,
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
        hasPrev: currentPage > 1,
      },
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
  ): Promise<{
    totalOrders: number;      // 用户所有订单数量
    pendingPaymentOrders: number;  // 用户待支付的订单数量(订单状态为created)
    deliveringOrders: number;  // 正在配送中的订单数量(订单状态为delivering)
    completedOrders: number;   // 用户已经收货的订单数量(订单状态为completed)
  }> {
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

    businessLogger.info("获取订单统计成功", {
      userId: userId,
      totalOrders: statistics.totalOrders,
      pendingPaymentOrders: statistics.pendingPaymentOrders,
      deliveringOrders: statistics.deliveringOrders,
      completedOrders: statistics.completedOrders,
    });

    return {
      totalOrders: statistics.totalOrders,
      pendingPaymentOrders: statistics.pendingPaymentOrders,
      deliveringOrders: statistics.deliveringOrders,
      completedOrders: statistics.completedOrders,
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
    orderId: number,
    userId: number
  ): Promise<GetOrderReviewsResponse> {
    businessLogger.info("开始获取订单评价列表", {
      orderId: orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权访问该订单", code: HttpCode.FORBIDDEN };
    }

    // 步骤2: 查询评价列表
    const reviews = await orderModel.getOrderReviews(orderId);

    // 步骤3: 计算统计信息
    const total = reviews.length;
    const averageRating =
      total > 0
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
          total
        : 0;

    businessLogger.info("获取订单评价列表成功", {
      orderId: orderId,
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
    orderId: number,
    userId: number
  ): Promise<GetDeliveryInfoResponse> {
    businessLogger.info("开始获取配送信息", {
      orderId: orderId,
      userId,
    });

    // 步骤1: 校验订单信息
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw { message: "订单不存在", code: HttpCode.NOT_FOUND };
    }
    if (order.userId !== userId) {
      throw { message: "无权访问该订单", code: HttpCode.FORBIDDEN };
    }

    // 步骤2: 使用model查询配送信息
    const deliveryInfo = await orderModel.getDeliveryInfo(orderId);

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
      orderId: orderId,
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
