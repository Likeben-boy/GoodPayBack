import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 数据库配置接口
interface DatabaseConfig {
  url: string;
}


// JWT配置接口
interface JwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

// 应用配置接口
interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  db: DatabaseConfig;
  jwt: JwtConfig;
  uploadPath: string;
  maxFileSize: number;
  allowedFileTypes: string;
  wechatAppId: string;
  wechatMchId: string;
  wechatApiKey: string;
  alipayAppId: string;
  alipayPrivateKey: string;
  alipayPublicKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smsAccessKey: string;
  smsAccessSecret: string;
  smsSignName: string;
  logLevel: string;
  logFile: string;
  errorLogFile:string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  bcryptSaltRounds: number;
}

// 导出配置对象
const config: AppConfig = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // 数据库配置
  db: {
    url: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/goodpayback'
  } as DatabaseConfig,

  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  } as JwtConfig,

  // 文件上传配置
  uploadPath: process.env.UPLOAD_PATH || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif',

  // 微信支付配置
  wechatAppId: process.env.WECHAT_APP_ID || '',
  wechatMchId: process.env.WECHAT_MCH_ID || '',
  wechatApiKey: process.env.WECHAT_API_KEY || '',

  // 支付宝配置
  alipayAppId: process.env.ALIPAY_APP_ID || '',
  alipayPrivateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',

  // 邮件配置
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',

  // 短信配置
  smsAccessKey: process.env.SMS_ACCESS_KEY || '',
  smsAccessSecret: process.env.SMS_ACCESS_SECRET || '',
  smsSignName: process.env.SMS_SIGN_NAME || '',

  // 日志配置
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/app.log',
  errorLogFile: process.env.ERROR_LOG_FILE || 'logs/error.log',

  // 限流配置
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分钟
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // 加密配置
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
};

export default config;