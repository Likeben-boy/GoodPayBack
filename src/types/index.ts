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
  code: HttpCode;
  /** 响应时间戳（ISO格式） */
  timestamp: string;
  /** 验证错误列表，验证失败时使用 */
  errors?: ValidationError[];
  /** 分页信息，分页数据时使用 */
  pagination?: PaginationInfo;
  /** 错误详情，错误响应时使用 */
  details?: any;
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
}

export enum JwtType {

  //访问令牌
  normal,

  //刷新令牌
  refresh,

  //临时临牌
  temp
}

/**
 * JWT令牌载荷接口
 */
export interface JwtPayload {
  /** 用户ID */
  userId: number;
  /** JWT签发时间戳（Unix时间戳） */
  iat: number;
  /** JWT过期时间戳（Unix时间戳），可选 */
  exp?: number;
  //令牌类型
  type: JwtType;
}

/**
 * JWT令牌载荷接口校验
 */
export interface JwtPayloadOut {

  //JWT令牌载荷接口
  jwtPayload?: JwtPayload;

  //是否过期
  isExpired: boolean;
  //是否是无效令牌
   isValid: boolean;
   //令牌类型验证错误

}

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  /** 数据库连接URL */
  url: string;
}


/**
 * JWT令牌配置接口
 */
export interface JwtConfig {
  /** JWT签名密钥 */
  secret: string;
  /** JWT刷新令牌密钥 */
  refreshSecret: string;
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

//返回错误码枚举
export enum HttpCode{
    SUCCESS = 'SUCCESS',

    //校验错误
    VALIDATION_ERROR ='VALIDATION_ERROR',

    //内部错误
    INTERNAL_ERROR = 'INTERNAL_ERROR',

    //缺少权限头
    MISSING_TOKEN = 'MISSING_TOKEN',

    //无效token
    INVALID_TOKEN = 'INVALID_TOKEN',

    //过期token
    TIME_OUT_TOKEN = 'TIME_OUT_TOKEN',

    //认证失败
    AUTH_FAILED = 'AUTH_FAILED',
}