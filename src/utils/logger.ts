import * as winston from 'winston';
import config from '../config/index.js';

// 常量配置
const LOG_CONFIG = {
  LEVEL: config.logLevel,
  LOG_FILE: config.logFile,
  ERROR_FILE: config.errorLogFile,
  SERVICE_NAME: 'user-service',
  TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ss.SSS',
  EXCLUDED_META_FIELDS: ['service', 'label'],
} as const;

// 检查是否为开发环境
const isDevelopment = config.nodeEnv !== 'production';

// 解构 winston 格式
const { combine, timestamp, colorize, printf, align, errors } = winston.format;

// 安全的 JSON 序列化，处理循环引用
const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString() + 'n';
      }
      if (typeof value === 'function') {
        return '[Function]';
      }
      if (typeof value === 'symbol') {
        return value.toString();
      }
      return value;
    });
  } catch (error) {
    return `[Object serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
};

// 创建自定义日志格式化函数
const createLogFormat = (withColor: boolean = false) => {
  const formatters = [
    timestamp({ format: LOG_CONFIG.TIMESTAMP_FORMAT }),
    errors({ stack: true }),
    align(),
  ];

  if (withColor) {
    formatters.push(colorize({ all: true }));
  }

  formatters.push(printf(({ level, message, timestamp, stack, ...metadata }) => {
    // 安全地处理时间戳
    const safeTimestamp = timestamp || new Date().toISOString();

    // 安全地处理消息
    const safeMessage = message != null ? String(message) : '';

    let msg = `${safeTimestamp} [${level}] : ${safeMessage}`;

    // 过滤并处理元数据
    const filteredMetadata = Object.keys(metadata)
      .filter(key => !LOG_CONFIG.EXCLUDED_META_FIELDS.includes(key as any))
      .reduce((obj, key) => {
        obj[key] = metadata[key];
        return obj;
      }, {} as Record<string, any>);

    // 添加元数据
    if (Object.keys(filteredMetadata).length > 0) {
      msg += ` - ${safeStringify(filteredMetadata)}`;
    }

    // 添加错误堆栈
    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  }));

  return combine(...formatters);
};

// 创建 winston logger 实例
const logger = winston.createLogger({
  level: LOG_CONFIG.LEVEL,
  format: createLogFormat(false), // 文件输出不使用颜色
  defaultMeta: { service: LOG_CONFIG.SERVICE_NAME },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: LOG_CONFIG.ERROR_FILE,
      level: 'error'
    }),
    // 应用日志文件
    new winston.transports.File({
      filename: LOG_CONFIG.LOG_FILE
    }),
  ],
});

// 开发环境添加控制台输出
if (isDevelopment) {
  logger.add(new winston.transports.Console({
    format: createLogFormat(true), // 控制台输出使用颜色
  }));
}

// 工具函数：设置日志级别
export const setLogLevel = (level: string): void => {
  logger.level = level;
};

// 工具函数：获取当前日志级别
export const getLogLevel = (): string => {
  return logger.level;
};

// 工具函数：创建子 logger
export const createChildLogger = (defaultMeta: Record<string, any>) => {
  return logger.child(defaultMeta);
};

// 工具函数：检查是否启用某个日志级别
export const isLevelEnabled = (level: string): boolean => {
  return logger.isLevelEnabled(level);
};

// 创建专门的日志器
export const dbLogger = createChildLogger({ component: 'database' });
export const businessLogger = createChildLogger({ component: 'business' });
export const securityLogger = createChildLogger({ component: 'security' });

export default logger;