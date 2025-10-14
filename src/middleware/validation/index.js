const { validationResult } = require('express-validator');

/**
 * 验证中间件
 * 检查请求验证结果，如果有错误则返回错误响应
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // 执行所有验证规则
    await Promise.all(validations.map(validation => validation.run(req)));

    // 检查验证结果
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // 格式化错误信息
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    res.status(400).json({
      status: 'error',
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  };
};

module.exports = {
  validate
};