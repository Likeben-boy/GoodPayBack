// 通用类型定义
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  code?: string;
  timestamp: string;
  errors?: ValidationError[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

export interface RequestUser {
  id: number;
  username: string;
  email?: string;
  role: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp?: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  poolMin: number;
  poolMax: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  db: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  uploadPath: string;
  maxFileSize: number;
  allowedFileTypes: string;
  logLevel: string;
  logFile: string;
}