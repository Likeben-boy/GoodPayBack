import { Response } from 'express';
import { ApiResponse, PaginationInfo, PaginatedResponse } from '../types';
import config from '../config';

/**
 * 成功响应工具函数
 * @param res - Express响应对象
 * @param message - 成功消息
 * @param data - 响应数据
 * @param statusCode - HTTP状态码
 */
const successResponse = <T = any>(
  res: Response,
  message: string = 'Success',
  data?: T,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    status: 'success',
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== undefined) {
    response.data = data;
  }

  // 分页数据支持
  if (data && typeof data === 'object' && (data as any).pagination) {
    response.pagination = (data as any).pagination;
    response.data = (data as any).items;
  }

  res.status(statusCode).json(response);
};

/**
 * 错误响应工具函数
 * @param res - Express响应对象
 * @param message - 错误消息
 * @param statusCode - HTTP状态码
 * @param code - 错误代码
 * @param details - 错误详情
 */
const errorResponse = (
  res: Response,
  message: string = 'Internal Server Error',
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): void => {
  const response: ApiResponse = {
    status: 'error',
    message,
    code,
    timestamp: new Date().toISOString()
  };

  if (details !== undefined) {
    response.details = details;
  }

  // 开发环境下添加错误堆栈
  if (config.nodeEnv === 'development' && statusCode === 500) {
    (response as any).stack = new Error().stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 分页数据格式化
 * @param items - 数据项
 * @param page - 当前页码
 * @param limit - 每页数量
 * @param total - 总数
 * @returns 分页数据
 */
const formatPagination = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => {
  const pagination: PaginationInfo = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };

  return {
    items,
    pagination
  };
};

/**
 * API响应包装器类
 * 用于统一包装API响应格式
 */
class ApiResponseBuilder {
  /**
   * 成功响应
   * @param message - 消息
   * @param data - 数据
   * @param statusCode - 状态码
   */
  static success<T = any>(
    message: string = 'Success',
    data?: T,
    statusCode: number = 200
  ): ApiResponse<T> {
    const response: ApiResponse<T> = {
      status: 'success',
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== undefined) {
      response.data = data;
    }

    return response;
  }

  /**
   * 错误响应
   * @param message - 消息
   * @param statusCode - 状态码
   * @param code - 错误代码
   * @param details - 详情
   */
  static error(
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ): ApiResponse {
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
   * @param items - 数据项
   * @param pagination - 分页信息
   * @param message - 消息
   */
  static paginated<T>(
    items: T[],
    pagination: PaginationInfo,
    message: string = 'Success'
  ): ApiResponse<T[]> {
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
   * @param errors - 错误数组
   * @param message - 消息
   */
  static validationError(
    errors: any[],
    message: string = 'Validation Error'
  ): ApiResponse {
    return {
      status: 'error',
      message,
      code: 'VALIDATION_ERROR',
      errors,
      timestamp: new Date().toISOString()
    };
  }
}

export {
  successResponse,
  errorResponse,
  formatPagination,
  ApiResponseBuilder
};