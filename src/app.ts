import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 导入路由
import userRoutes from './modules/user/routes/user.routes';
// import restaurantRoutes from './modules/restaurant/routes/restaurant.routes';
// import productRoutes from './modules/product/routes/product.routes';
// import cartRoutes from './modules/cart/routes/cart.routes';
// import orderRoutes from './modules/order/routes/order.routes';
// import paymentRoutes from './modules/payment/routes/payment.routes';

// 导入中间件
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// 导入数据库配置
import { testConnection } from './database/prisma';

// 导入工具
import { ApiResponse } from './types';
import { logger, businessLogger } from './utils/logger';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// 数据库连接
testConnection();

// 请求入口日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  businessLogger.info('API Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: Math.random().toString(36).substring(7)
  });

  next();
});

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 限流中间件
app.use(generalLimiter);

// 日志中间件
app.use(morgan('combined'));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    status: 'success',
    message: 'Server is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString()
  };
  res.status(200).json(response);
});

// API路由
app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/restaurants', restaurantRoutes);
// app.use('/api/v1/products', productRoutes);
// app.use('/api/v1/cart', authMiddleware, cartRoutes);
// app.use('/api/v1/orders', authMiddleware, orderRoutes);
// app.use('/api/v1/payments', authMiddleware, paymentRoutes);

// 404处理
app.use(notFoundHandler);

// 全局错误处理中间件
app.use(errorHandler);

// 服务器启动
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
const gracefulShutdown = (signal: string): void => {
  console.log(`\n${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;