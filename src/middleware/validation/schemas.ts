import { body, param, query } from "express-validator";

// 用户验证规则
export const userValidation = {
  register: [
    body("password")
      .optional()
      .isLength({ min: 6, max: 20 })
      .withMessage("密码长度必须在6-20个字符之间")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("密码必须包含大小写字母和数字"),
    body("phone")
      .notEmpty()
      .withMessage("请输入手机号码")
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    body("authCode")
      .optional()
      .trim()
      .isLength({ min: 4, max: 4 })
      .withMessage("验证码长度必须是4个字符"),
  ],

  login: [
    body("password")
      .optional()
      .isLength({ min: 6, max: 20 })
      .withMessage("密码长度必须在6-20个字符之间")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("密码必须包含大小写字母和数字"),
    body("phone")
      .notEmpty()
      .withMessage("请输入手机号码")
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
  ],

  updateProfile: [
    body("username")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("用户名长度必须在1-50个字符之间"),
    body("phone")
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    body("avatar").optional().isURL().withMessage("请输入有效的头像URL"),
  ],

  changePassword: [
    body("oldPassword").notEmpty().withMessage("请输入原密码"),
    body("newPassword")
      .isLength({ min: 6, max: 20 })
      .withMessage("新密码长度必须在6-20个字符之间")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("新密码必须包含大小写字母和数字"),
  ],

  resetPassword: [
    body("email").isEmail().withMessage("请输入有效的邮箱地址"),
    body("code")
      .isLength({ min: 6, max: 6 })
      .withMessage("验证码必须是6位数字")
      .matches(/^\d{6}$/)
      .withMessage("验证码必须是6位数字"),
    body("newPassword")
      .isLength({ min: 6, max: 20 })
      .withMessage("新密码长度必须在6-20个字符之间")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("新密码必须包含大小写字母和数字"),
  ],

  createAddress: [
    body("contactName")
      .trim()
      .notEmpty()
      .isLength({ min: 2, max: 20 })
      .withMessage("收件人姓名长度必须在2-20个字符之间"),
    body("contactPhone")
      .trim()
      .notEmpty()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    body("province").trim().notEmpty().withMessage("请选择省份"),
    body("city").trim().notEmpty().withMessage("请选择城市"),
    body("district").trim().notEmpty().withMessage("请选择区县"),
    body("detailAddress")
      .trim()
      .notEmpty()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("详细地址长度必须在5-100个字符之间"),
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage("isDefault必须是布尔值"),
  ],

  updateAddress: [
    body("contactName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage("收件人姓名长度必须在2-20个字符之间"),
    body("contactPhone")
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    body("province").optional().trim().notEmpty().withMessage("请选择省份"),
    body("city").optional().trim().notEmpty().withMessage("请选择城市"),
    body("district").optional().trim().notEmpty().withMessage("请选择区县"),
    body("detailAddress")
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("详细地址长度必须在5-100个字符之间"),
    body("isDefault")
      .optional()
      .isBoolean()
      .withMessage("isDefault必须是布尔值"),
  ],
};

// 订单验证规则
export const orderValidation = {
  createOrder: [
    // 餐厅ID验证
    body("restaurantId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("餐厅ID必须是大于0的整数"),

    // 收货地址ID验证
    body("addressId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("地址ID必须是大于0的整数"),

    // 订单商品列表验证
    body("items")
      .notEmpty()
      .isArray({ min: 1 })
      .withMessage("订单商品不能为空"),

    // 商品项验证 - 基础字段
    body("items.*.id")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("菜品ID必须是大于0的整数"),
    body("items.*.name")
          .trim()
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("菜品名称长度必须在1-100个字符之间"),
    body("items.*.price")
      .notEmpty()
      .isFloat({ min: 0, max: 9999 })
      .withMessage("价格必须在0-9999之间"),
    body("items.*.restaurantId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("商品餐厅ID必须是大于0的整数"),
    body("items.*.restaurantName")
          .trim()
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("餐厅名称长度必须在1-100个字符之间"),
    body("items.*.categoryId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("分类ID必须是大于0的整数"),
    body("items.*.quantity")
      .notEmpty()
      .isInt({ min: 1, max: 99 })
      .withMessage("数量必须是1-99之间的整数"),

    // 支付方式验证
    body("paymentMethod")
          .trim()
      .notEmpty()
      .isIn(["wechat", "alipay", "balance", "apple"])
      .withMessage("支付方式必须是wechat、alipay、balance或apple"),

    // 送达时间验证
    body("deliveryTime")
      .notEmpty()
      .isLength({ min: 1, max: 50 })
      .withMessage("送达时间长度必须在1-50个字符之间"),

    // 订单备注验证
    body("note")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("备注长度不能超过500个字符"),

    // 金额验证
    body("subtotal")
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("小计金额必须大于等于0"),
    body("deliveryFee")
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("配送费必须大于等于0"),
    body("total")
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage("总金额必须大于等于0"),

    // 金额逻辑验证 - 自定义验证器
    body().custom((_value, { req }) => {
      const { subtotal, deliveryFee, total } = req.body;
      const calculatedTotal = subtotal + deliveryFee;
      if (Math.abs(total - calculatedTotal) > 0.01) {
        throw new Error("总金额计算错误");
      }
      return true;
    }).withMessage("总金额必须等于小计金额加配送费"),
  ],

  getOrders: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("页码必须是大于0的整数"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每页数量必须是1-100之间的整数"),
    query("status")
      .optional()
      .isIn([
        "pending",
        "paid",
        "confirmed",
        "preparing",
        "delivering",
        "completed",
        "cancelled",
      ])
      .withMessage("订单状态无效"),
  ],

  cancelOrder: [
    // 取消订单使用body参数，符合我们的路由设计
    body("orderId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("订单ID必须是大于0的整数"),
    body("reason")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("取消原因长度不能超过200个字符"),
  ],

  // 订单支付验证 - 用于处理订单支付请求
  payOrder: [
    // 订单ID - 必填，标识要支付的订单
    body("orderId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("订单ID必须是大于0的整数"),
    // 支付方式 - 必填，支持微信、支付宝、余额支付、苹果支付
    body("paymentMethod")
      .trim()
      .notEmpty()
      .isIn(["wechat", "alipay", "balance", "apple"])
      .withMessage("支付方式必须是wechat、alipay、balance或apple"),
    // 支付金额 - 必填，用于二次校验金额准确性
    body("amount")
      .notEmpty()
      .isFloat({ min: 0.01, max: 99999 })
      .withMessage("支付金额必须在0.01-99999之间"),
    // 支付密码 - 可选，余额支付时需要
    body("payPassword")
      .optional()
      .isLength({ min: 6, max: 6 })
      .withMessage("支付密码必须是6位数字"),
    // 优惠券ID - 可选，使用优惠券时传递
    body("couponId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("优惠券ID必须是大于0的整数"),
  ],

  // 订单退款验证 - 用于处理订单退款申请
  refundOrder: [
    // 订单ID - 必填，标识要退款的订单
    body("orderId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("订单ID必须是大于0的整数"),
    // 退款原因 - 必填，说明退款理由
    body("reason")
      .trim()
      .notEmpty()
      .isLength({ min: 5, max: 500 })
      .withMessage("退款原因长度必须在5-500个字符之间"),
    // 退款金额 - 必填，支持部分退款
    body("refundAmount")
      .notEmpty()
      .isFloat({ min: 0.01, max: 99999 })
      .withMessage("退款金额必须在0.01-99999之间"),
    // 退款类型 - 可选，全额退款或部分退款
    body("refundType")
      .optional()
      .isIn(["full", "partial"])
      .withMessage("退款类型必须是full或partial"),
    // 退款说明 - 可选，补充说明退款详情
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("退款说明长度不能超过1000个字符"),
  ],

  // 获取订单列表验证 - 支持分页和状态筛选
  getOrderList: [
    // 页码 - 可选，默认为1
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("页码必须是大于0的整数"),
    // 每页数量 - 可选，默认为10，最大100
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每页数量必须是1-100之间的整数"),
    // 订单状态 - 可选，筛选特定状态的订单
    query("status")
      .optional()
      .isIn([
        "created",    // 已创建
        "paid",       // 已支付
        "confirmed",  // 已确认
        "preparing",  // 制作中
        "delivering", // 配送中
        "completed",  // 已完成
        "cancelled",  // 已取消
        "refunded"    // 已退款
      ])
      .withMessage("订单状态无效"),
    // 开始日期 - 可选，按时间筛选开始时间
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("开始日期格式不正确，请使用YYYY-MM-DD格式"),
    // 结束日期 - 可选，按时间筛选结束时间
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("结束日期格式不正确，请使用YYYY-MM-DD格式"),
    // 搜索关键词 - 可选，按订单号或餐厅名称搜索
    query("keyword")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("搜索关键词长度必须在1-100个字符之间"),
  ],

  // 创建订单评价验证 - 用于用户评价已完成的订单
  createReview: [
    // 订单ID - 必填，标识要评价的订单
    body("orderId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("订单ID必须是大于0的整数"),
    // 评分 - 必填，1-5星评分
    body("rating")
      .notEmpty()
      .isInt({ min: 1, max: 5 })
      .withMessage("评分必须是1-5之间的整数"),
    // 评价内容 - 必填，用户对订单的评价文字
    body("content")
      .trim()
      .notEmpty()
      .isLength({ min: 10, max: 1000 })
      .withMessage("评价内容长度必须在10-1000个字符之间"),
    // 评价标签 - 可选，快速评价标签（如：味道好、配送快等）
    body("tags")
      .optional()
      .isArray({ max: 5 })
      .withMessage("评价标签最多5个"),
    // 图片 - 可选，评价时上传的图片URL数组
    body("images")
      .optional()
      .isArray({ max: 9 })
      .withMessage("评价图片最多9张"),
    // 匿名评价 - 可选，是否匿名评价
    body("isAnonymous")
      .optional()
      .isBoolean()
      .withMessage("匿名评价标识必须是布尔值"),
  ],

  // 获取订单历史统计验证 - 用于按时间维度统计订单数据
  getOrderHistory: [
    // 开始日期 - 可选，统计开始日期
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("开始日期格式不正确，请使用YYYY-MM-DD格式"),
    // 结束日期 - 可选，统计结束日期
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("结束日期格式不正确，请使用YYYY-MM-DD格式"),
    // 统计类型 - 可选，按日、周、月、年统计
    query("type")
      .optional()
      .isIn(["daily", "weekly", "monthly", "yearly"])
      .withMessage("统计类型必须是daily、weekly、monthly或yearly"),
    // 餐厅ID - 可选，筛选特定餐厅的订单
    query("restaurantId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("餐厅ID必须是大于0的整数"),
  ],

  // 申请发票验证 - 用于用户申请订单发票
  requestInvoice: [
    // 订单ID - 必填，标识要申请发票的订单
    body("orderId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("订单ID必须是大于0的整数"),
    // 发票类型 - 必填，个人或企业发票
    body("invoiceType")
      .trim()
      .notEmpty()
      .isIn(["personal", "company"])
      .withMessage("发票类型必须是personal或company"),
    // 发票抬头 - 必填，发票抬头名称
    body("invoiceTitle")
      .trim()
      .notEmpty()
      .isLength({ min: 2, max: 100 })
      .withMessage("发票抬头长度必须在2-100个字符之间"),
    // 纳税人识别号 - 企业发票必填
    body("taxNumber")
      .optional()
      .trim()
      .matches(/^[A-Z0-9]{15}$|^[A-Z0-9]{18}$/)
      .withMessage("纳税人识别号格式不正确"),
    // 发票内容 - 必填，发票开具内容
    body("invoiceContent")
      .trim()
      .notEmpty()
      .isLength({ min: 5, max: 200 })
      .withMessage("发票内容长度必须在5-200个字符之间"),
    // 收票邮箱 - 必填，发票接收邮箱
    body("email")
      .trim()
      .notEmpty()
      .isEmail()
      .withMessage("请输入有效的邮箱地址"),
    // 联系电话 - 可选，备用联系方式
    body("phone")
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage("请输入有效的手机号码"),
    // 备注 - 可选，发票申请备注
    body("remark")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("备注长度不能超过500个字符"),
  ],
};

// 支付验证规则
export const paymentValidation = {
  createPayment: [
    body("orderId").isInt({ min: 1 }).withMessage("订单ID必须是大于0的整数"),
    body("paymentMethod")
      .isIn(["wechat", "alipay", "balance"])
      .withMessage("支付方式必须是wechat、alipay或balance"),
    body("amount").isFloat({ min: 0.01 }).withMessage("支付金额必须大于0"),
  ],

  getPaymentStatus: [
    param("id").isInt({ min: 1 }).withMessage("支付ID必须是大于0的整数"),
  ],

  cancelPayment: [
    param("id").isInt({ min: 1 }).withMessage("支付ID必须是大于0的整数"),
  ],

  refundPayment: [
    param("id").isInt({ min: 1 }).withMessage("支付ID必须是大于0的整数"),
    body("amount").isFloat({ min: 0.01 }).withMessage("退款金额必须大于0"),
    body("reason")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("退款原因长度必须在1-200个字符之间"),
  ],
};

// 餐厅验证规则
export const restaurantValidation = {
  // 获取餐厅列表（支持搜索功能）
  getRestaurants: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("页码必须是大于0的整数"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每页数量必须是1-100之间的整数"),
    query("keyword")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("搜索关键词长度必须在1-50个字符之间"),
    query("sortBy")
      .optional()
      .isIn(["createdAt", "rating", "distance", "deliveryTime"])
      .withMessage("排序字段无效"),
    query("sortOrder")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("排序方式必须是asc或desc"),
    query("minRating")
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage("最低评分必须是0-5之间的数字"),
    query("tags")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("标签不能为空"),
  ],

  
  // 获取热门餐厅
  getPopularRestaurants: [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("数量限制必须是1-50之间的整数"),
  ],

  // 获取餐厅标签
  getRestaurantTags: [
    query("tagType")
      .optional()
      .isIn(["cuisine", "feature", "price_range", "service"])
      .withMessage("标签类型必须是cuisine、feature、price_range或service"),
  ],

  // 获取餐厅详情
  getRestaurantDetail: [
    query("id").notEmpty()
  ],

  // 获取餐厅菜单
  getRestaurantMenu: [
    query("id").notEmpty()
  ],

  // 获取指定分类的菜品 (使用查询参数，符合 RESTful GET 请求设计)
  getDishesByCategory: [
    query("restaurantId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("餐厅ID必须是大于0的整数"),
    query("categoryId")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("分类ID必须是大于0的整数"),
  ],

  };
