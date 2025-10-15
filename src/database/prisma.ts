import { PrismaClient } from '@prisma/client';
import logger, { dbLogger } from '../utils/logger';
import config from '../config';

// 扩展全局类型以包含Prisma客户端
declare global {
  var __prisma: PrismaClient | undefined;
}

// 创建Prisma客户端实例
const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'info', emit: 'event' }
    ]
  });

  // 设置 Prisma 事件监听器来集成 Winston 日志
  client.$on('query', (e) => {
    dbLogger.debug('Database Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      timestamp: e.timestamp
    });
  });

  client.$on('error', (e) => {
    dbLogger.error('Database Error', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    });
  });

  client.$on('warn', (e) => {
    dbLogger.warn('Database Warning', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    });
  });

  client.$on('info', (e) => {
    dbLogger.info('Database Info', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    });
  });

  return client;
};

// 单例模式确保只有一个Prisma客户端实例
const prisma: PrismaClient = globalThis.__prisma || createPrismaClient();

// 在开发环境中避免热重载时创建多个实例
if (config.nodeEnv === 'development') {
  globalThis.__prisma = prisma;
}

// 测试数据库连接
const testConnection = async (): Promise<void> => {
  try {
    await prisma.$connect();
    dbLogger.info('Prisma 数据库启动成功', {
      service: 'prisma',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    dbLogger.error('Prisma 数据库启动失败', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'prisma',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 执行原生SQL查询
const executeRaw = async <T = any>(
  query: string,
  ...params: any[]
): Promise<T[]> => {
  try {
    dbLogger.debug('Executing raw query', {
      query: query.trim(),
      params: params.length > 0 ? params : undefined,
      timestamp: new Date().toISOString()
    });

    return await prisma.$queryRawUnsafe<T[]>(query, ...params);
  } catch (error) {
    dbLogger.error('Execute raw query error', {
      query: query.trim(),
      params: params.length > 0 ? params : undefined,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 执行事务
const executeTransaction = async <T>(
  callback: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">) => Promise<T>
): Promise<T> => {
  try {
    dbLogger.debug('Starting database transaction', {
      timestamp: new Date().toISOString()
    });

    const result = await prisma.$transaction(callback);

    dbLogger.debug('Database transaction completed successfully', {
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    logger.error('Transaction error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 批量操作
const batchOperations = async <T>(
  operations: ((tx: PrismaClient) => Promise<T>)[]
): Promise<T[]> => {
  try {
    dbLogger.debug('Starting batch operations', {
      operationCount: operations.length,
      timestamp: new Date().toISOString()
    });

    const result = await prisma.$transaction(operations as any);

    dbLogger.debug('Batch operations completed successfully', {
      operationCount: operations.length,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    logger.error('Batch operations error', {
      operationCount: operations.length,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 获取数据库统计信息
const getDatabaseStats = async () => {
  try {
    dbLogger.debug('Fetching database statistics', {
      timestamp: new Date().toISOString()
    });

    const [
      userCount,
      // restaurantCount,
      // productCount,
      // orderCount
    ] = await Promise.all([
      prisma.users.count(),
      // prisma.restaurant.count(),
      // prisma.product.count(),
      // prisma.order.count()
    ]);

    const stats = {
      users: userCount,
      // restaurants: restaurantCount,
      // products: productCount,
      // orders: orderCount,
      timestamp: new Date().toISOString()
    };

    dbLogger.info('Database statistics retrieved', stats);

    return stats;
  } catch (error) {
    logger.error('Get database stats error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 健康检查
const healthCheck = async (): Promise<{
  connected: boolean;
  error?: string;
  stats?: any;
}> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const stats = await getDatabaseStats();
    return {
      connected: true,
      stats
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// 优雅关闭数据库连接
const disconnect = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    dbLogger.info('Prisma database disconnected successfully', {
      service: 'prisma',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    dbLogger.error('Prisma database disconnect error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'prisma',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 软删除帮助函数
const softDelete = async <M extends { id: number; deletedAt?: Date | null }>(
  model: {
    update: (args: { where: { id: number }; data: { deletedAt: Date } }) => Promise<M>;
  },
  id: number
): Promise<M> => {
  return model.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
};

// 恢复软删除
const restoreSoftDelete = async <M extends { id: number; deletedAt?: Date | null }>(
  model: {
    update: (args: { where: { id: number }; data: { deletedAt: null } }) => Promise<M>;
  },
  id: number
): Promise<M> => {
  return model.update({
    where: { id },
    data: { deletedAt: null }
  });
};

// 分页查询帮助函数
const paginate = <T, K>(
  model: {
    findMany: (args: any) => Promise<T[]>;
    count: (args?: any) => Promise<number>;
  },
  options: {
    page?: number;
    limit?: number;
    where?: K;
    orderBy?: any;
    include?: any;
    select?: any;
  } = {}
) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  return {
    items: model.findMany({
      where: options.where,
      orderBy: options.orderBy,
      include: options.include,
      select: options.select,
      skip,
      take: limit
    }),
    pagination: {
      page,
      limit,
      total: model.count({ where: options.where }),
      pages: 0, // 将在查询后计算
      hasNext: false,
      hasPrev: false
    }
  };
};

export {
  prisma,
  testConnection,
  executeRaw,
  executeTransaction,
  batchOperations,
  getDatabaseStats,
  healthCheck,
  disconnect,
  softDelete,
  restoreSoftDelete,
  paginate
};