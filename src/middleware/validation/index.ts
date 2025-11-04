import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiResponse, ValidationError,HttpCode } from '../../types';
import logger, {  businessLogger } from '@/utils/logger';

/**
 * 验证中间件
 * 检查请求验证结果，如果有错误则返回错误响应
 */
const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 执行所有验证规则
    await Promise.all(validations.map(validation => validation.run(req)));

    // 检查验证结果
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    // 格式化错误信息
    const formattedErrors: ValidationError[] = errors.array().map(error => {
      businessLogger.error(`校验字段${error.type}错误:${error.msg}`);
      // 处理字段验证错误
      if (error.type === 'field') {
        return {
          field: error.path,
          message: error.msg,
          value: error.value
        };
      }

      // 处理其他类型的验证错误（unknown_fields, alternative等）
      return {
        field: error.type,
        message: error.msg,
        value: undefined
      };
    });

    const response: ApiResponse = {
      status: 'error',
      message: '数据验证失败',
      code: HttpCode.VALIDATION_ERROR,
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    };

    res.status(400).json(response);
  };
};

export {
  validate
};