// 通用类型定义

/**
 * 标准化API响应接口
 * @template T 响应数据的类型，默认为any
 */
export interface ApiResponse<T = any> {
  /** 响应状态：成功或失败 */
  status: 'success' | 'error';
  /** 响应消息描述 */
  message: string;
  /** 响应数据，可选 */
  data?: T;
  /** 业务错误码，可选 */
  code?: string;
  /** 响应时间戳（ISO格式） */
  timestamp: string;
  /** 验证错误列表，验证失败时使用 */
  errors?: ValidationError[];
}

/**
 * 分页信息接口
 */
export interface PaginationInfo {
  /** 当前页码，从1开始 */
  page: number;
  /** 每页记录数 */
  limit: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  pages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 分页响应数据接口
 * @template T 数据项的类型
 */
export interface PaginatedResponse<T> {
  /** 数据项列表 */
  items: T[];
  /** 分页信息 */
  pagination: PaginationInfo;
}

/**
 * 验证错误信息接口
 */
export interface ValidationError {
  /** 验证失败的字段名 */
  field: string;
  /** 错误消息描述 */
  message: string;
  /** 验证失败的原始值 */
  value: any;
}

/**
 * 请求用户信息接口（认证中间件中使用的用户信息）
 */
export interface RequestUser {
  /** 用户唯一标识 */
  id: number;
  /** 用户名 */
  username: string;
  /** 用户邮箱，可选 */
  email?: string;
  /** 用户角色 */
  role: string;
}

/**
 * JWT令牌载荷接口
 */
export interface JwtPayload {
  /** 用户ID */
  userId: number;
  /** 用户名 */
  username: string;
  /** JWT签发时间戳（Unix时间戳） */
  iat: number;
  /** JWT过期时间戳（Unix时间戳），可选 */
  exp?: number;
}

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  /** 数据库主机地址 */
  host: string;
  /** 数据库端口号 */
  port: number;
  /** 数据库用户名 */
  user: string;
  /** 数据库密码 */
  password: string;
  /** 数据库名称 */
  database: string;
  /** 连接池最小连接数 */
  poolMin: number;
  /** 连接池最大连接数 */
  poolMax: number;
}

/**
 * Redis缓存配置接口
 */
export interface RedisConfig {
  /** Redis服务器主机地址 */
  host: string;
  /** Redis服务器端口号 */
  port: number;
  /** Redis密码，可选（无密码时可不提供） */
  password?: string;
  /** Redis数据库编号（0-15） */
  db: number;
}

/**
 * JWT令牌配置接口
 */
export interface JwtConfig {
  /** JWT签名密钥 */
  secret: string;
  /** 访问令牌过期时间（如：'1h'、'7d'或秒数） */
  expiresIn: string | number;
  /** 刷新令牌过期时间（如：'7d'、'30d'或秒数） */
  refreshExpiresIn: string | number;
}

/**
 * 应用程序总配置接口
 */
export interface AppConfig {
  /** 服务器监听端口号 */
  port: number;
  /** Node.js运行环境（development、production、test） */
  nodeEnv: string;
  /** 前端应用URL（用于CORS等配置） */
  frontendUrl: string;
  /** 数据库配置 */
  db: DatabaseConfig;
  /** Redis配置 */
  redis: RedisConfig;
  /** JWT配置 */
  jwt: JwtConfig;
  /** 文件上传存储路径 */
  uploadPath: string;
  /** 最大文件上传大小（字节） */
  maxFileSize: number;
  /** 允许上传的文件类型（MIME类型） */
  allowedFileTypes: string;
  /** 日志级别（error、warn、info、debug） */
  logLevel: string;
  /** 日志文件路径 */
  logFile: string;
}