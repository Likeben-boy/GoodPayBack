const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// 导入路由
const userRoutes = require('./modules/user/routes/user.routes');
const restaurantRoutes = require('./modules/restaurant/routes/restaurant.routes');
const productRoutes = require('./modules/product/routes/product.routes');
const cartRoutes = require('./modules/cart/routes/cart.routes');
const orderRoutes = require('./modules/order/routes/order.routes');
const paymentRoutes = require('./modules/payment/routes/payment.routes');

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');

// 导入数据库配置
const connectDB = require('./database/connection');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 数据库连接
connectDB();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 限流中间件
app.use(rateLimiter);

// 日志中间件
app.use(morgan('combined'));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', authMiddleware, cartRoutes);
app.use('/api/v1/orders', authMiddleware, orderRoutes);
app.use('/api/v1/payments', authMiddleware, paymentRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// 全局错误处理中间件
app.use(errorHandler);

// 服务器启动
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;