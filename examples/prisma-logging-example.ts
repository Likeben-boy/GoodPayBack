import { prisma, testConnection, executeRaw, executeTransaction } from '../src/database/prisma';

/**
 * Prisma Winston 日志集成示例
 * 演示如何使用新的日志系统来监控数据库操作
 */
async function demonstratePrismaLogging() {
  console.log('=== Prisma Winston 日志集成演示 ===\n');

  try {
    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...');
    await testConnection();

    // 2. 执行一个简单查询（会触发 query 日志）
    console.log('\n2. 执行简单查询...');
    const userCount = await prisma.user.count();
    console.log(`用户总数: ${userCount}`);

    // 3. 执行原生 SQL 查询（会触发 raw query 日志）
    console.log('\n3. 执行原生 SQL 查询...');
    const result = await executeRaw('SELECT COUNT(*) as count FROM restaurants');
    console.log('餐厅数量:', result);

    // 4. 执行事务（会触发事务日志）
    console.log('\n4. 执行数据库事务...');
    await executeTransaction(async (tx) => {
      // 在事务中执行操作
      const users = await tx.user.findMany({ take: 1 });
      console.log('事务中的查询结果:', users.length ? '找到用户' : '无用户');
      return users;
    });

    console.log('\n✅ 演示完成！请检查日志文件：');
    console.log('- logs/database.log - 数据库相关日志');
    console.log('- logs/app.log - 通用日志（包含错误）');
    console.log('- logs/error.log - 错误日志');

  } catch (error) {
    console.error('演示过程中发生错误:', error);
  } finally {
    // 关闭连接
    await prisma.$disconnect();
  }
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  demonstratePrismaLogging().catch(console.error);
}

export { demonstratePrismaLogging };