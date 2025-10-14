import { PrismaClient } from '@prisma/client';

// 扩展全局类型以包含Prisma客户端
declare global {
  var __prisma: PrismaClient | undefined;
}

// 创建Prisma客户端实例
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' }
    ]
  });
};

// 单例模式确保只有一个Prisma客户端实例
const prisma: PrismaClient = globalThis.__prisma || createPrismaClient();

// 在开发环境中避免热重载时创建多个实例
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// 测试数据库连接
const testConnection = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma database connected successfully');
  } catch (error) {
    console.error('❌ Prisma database connection failed:', error);
    throw error;
  }
};

// 执行原生SQL查询
const executeRaw = async <T = any>(
  query: string,
  ...params: any[]
): Promise<T[]> => {
  try {
    return await prisma.$queryRawUnsafe<T[]>(query, ...params);
  } catch (error) {
    console.error('Execute raw query error:', error);
    throw error;
  }
};

// 执行事务
const executeTransaction = async <T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> => {
  try {
    return await prisma.$transaction(callback);
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
};

// 批量操作
const batchOperations = async <T>(
  operations: ((tx: PrismaClient) => Promise<T>)[]
): Promise<T[]> => {
  try {
    return await prisma.$transaction(operations);
  } catch (error) {
    console.error('Batch operations error:', error);
    throw error;
  }
};

// 获取数据库统计信息
const getDatabaseStats = async () => {
  try {
    const [
      userCount,
      restaurantCount,
      productCount,
      orderCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.product.count(),
      prisma.order.count()
    ]);

    return {
      users: userCount,
      restaurants: restaurantCount,
      products: productCount,
      orders: orderCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Get database stats error:', error);
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
    console.log('Prisma database disconnected successfully');
  } catch (error) {
    console.error('Prisma database disconnect error:', error);
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