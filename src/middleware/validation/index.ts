import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiResponse, ValidationError } from '../../types';

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
    const formattedErrors: ValidationError[] = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    const response: ApiResponse = {
      status: 'error',
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    };

    res.status(400).json(response);
  };
};

export {
  validate
};