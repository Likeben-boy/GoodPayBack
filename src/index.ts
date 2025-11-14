import dotenv from 'dotenv';
import config from './config/index.js';
import app from './app';
import { testConnection } from './database/prisma';
import logger from './utils/logger';

// 加载环境变量
dotenv.config();

// 启动应用
const PORT: number = config.port;

// 开发环境下启动服务器
const startServer = async (): Promise<void> => {
  try {
    // 测试数据库连接
    await testConnection();

    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log(`🚀 GoodPayBack API Server is running on port ${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`Server started successfully on port ${PORT}`);
    });

    // 优雅关闭处理
    const gracefulShutdown = (signal: string): void => {
      logger.info(`${signal} received, shutting down gracefully`);
      console.log(`\n${signal} received, shutting down gracefully`);

      server.close(() => {
        logger.info('HTTP server closed');
        console.log('HTTP server closed');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 开发环境下启动服务器
if (config.nodeEnv !== 'test') {
  startServer();
}

export default app;