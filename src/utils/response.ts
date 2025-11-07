import { Response } from 'express';
import { ApiResponse, PaginationInfo, PaginatedResponse,HttpCode } from '../types';
import config from '../config/index.js';

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
    code:HttpCode.SUCCESS,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== undefined) {
    response.data = data;
  }

  // 分页数据支持
  if (data && typeof data === 'object' && (data as any).pagination) {
    const { pagination, ...dataWithoutPagination } = data as any;
    response.pagination = pagination;
    response.data = dataWithoutPagination.data;
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
  code: HttpCode = HttpCode.INTERNAL_ERROR,
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
      code: HttpCode.SUCCESS,
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
    code: HttpCode = HttpCode.INTERNAL_ERROR,
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
      code: HttpCode.VALIDATION_ERROR,
      errors,
      timestamp: new Date().toISOString()
    };
  }
}

export {
  successResponse,
  errorResponse,
  ApiResponseBuilder
};