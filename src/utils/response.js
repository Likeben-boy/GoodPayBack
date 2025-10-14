/**
 * 成功响应工具函数
 * @param {Object} res - Express响应对象
 * @param {string} message - 成功消息
 * @param {Object} data - 响应数据
 * @param {number} statusCode - HTTP状态码
 */
const successResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  const response = {
    status: 'success',
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  // 分页数据支持
  if (data && data.pagination) {
    response.pagination = data.pagination;
    response.data = data.items;
  }

  res.status(statusCode).json(response);
};

/**
 * 错误响应工具函数
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {string} code - 错误代码
 * @param {Object} details - 错误详情
 */
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
  const response = {
    status: 'error',
    message,
    code,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  // 开发环境下添加错误堆栈
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = new Error().stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 分页数据格式化
 * @param {Array} items - 数据项
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @param {number} total - 总数
 * @returns {Object} 分页数据
 */
const formatPagination = (items, page, limit, total) => {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

/**
 * API响应包装器
 * 用于统一包装API响应格式
 */
class ApiResponse {
  /**
   * 成功响应
   * @param {string} message - 消息
   * @param {*} data - 数据
   * @param {number} statusCode - 状态码
   */
  static success(message = 'Success', data = null, statusCode = 200) {
    return {
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 错误响应
   * @param {string} message - 消息
   * @param {number} statusCode - 状态码
   * @param {string} code - 错误代码
   * @param {*} details - 详情
   */
  static error(message = 'Internal Server Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    return {
      status: 'error',
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 分页响应
   * @param {Array} items - 数据项
   * @param {Object} pagination - 分页信息
   * @param {string} message - 消息
   */
  static paginated(items, pagination, message = 'Success') {
    return {
      status: 'success',
      message,
      data: items,
      pagination,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 验证错误响应
   * @param {Array} errors - 错误数组
   * @param {string} message - 消息
   */
  static validationError(errors, message = 'Validation Error') {
    return {
      status: 'error',
      message,
      code: 'VALIDATION_ERROR',
      errors,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  successResponse,
  errorResponse,
  formatPagination,
  ApiResponse
};