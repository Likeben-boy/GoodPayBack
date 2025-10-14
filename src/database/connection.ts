import mysql from 'mysql2/promise';
import config from '../config';
import { logger } from '../utils/logger';

// 数据库连接池配置
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.poolMax,
  queueLimit: 0,
  charset: 'utf8mb4',
  multipleStatements: false,
  timezone: '+08:00'
});

// 测试数据库连接
const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// 执行查询
const query = async (sql: string, params: any[] = []): Promise<any[]> => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as any[];
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

// 执行单行查询
const queryOne = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const [rows] = await pool.execute(sql, params);
    const result = rows as any[];
    return result[0] || null;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

// 插入数据并返回ID
const insert = async (sql: string, params: any[] = []): Promise<number> => {
  try {
    const [result] = await pool.execute(sql, params);
    const insertResult = result as mysql.ResultSetHeader;
    return insertResult.insertId;
  } catch (error) {
    logger.error('Database insert error:', error);
    throw error;
  }
};

// 更新数据
const update = async (sql: string, params: any[] = []): Promise<number> => {
  try {
    const [result] = await pool.execute(sql, params);
    const updateResult = result as mysql.ResultSetHeader;
    return updateResult.affectedRows;
  } catch (error) {
    logger.error('Database update error:', error);
    throw error;
  }
};

// 删除数据
const remove = async (sql: string, params: any[] = []): Promise<number> => {
  try {
    const [result] = await pool.execute(sql, params);
    const deleteResult = result as mysql.ResultSetHeader;
    return deleteResult.affectedRows;
  } catch (error) {
    logger.error('Database delete error:', error);
    throw error;
  }
};

// 开始事务
const beginTransaction = async (): Promise<mysql.Connection> => {
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  } catch (error) {
    logger.error('Transaction begin error:', error);
    throw error;
  }
};

// 提交事务
const commitTransaction = async (connection: mysql.Connection): Promise<void> => {
  try {
    await connection.commit();
    connection.release();
  } catch (error) {
    logger.error('Transaction commit error:', error);
    throw error;
  }
};

// 回滚事务
const rollbackTransaction = async (connection: mysql.Connection): Promise<void> => {
  try {
    await connection.rollback();
    connection.release();
  } catch (error) {
    logger.error('Transaction rollback error:', error);
    throw error;
  }
};

// 关闭数据库连接池
const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
};

export {
  pool,
  testConnection,
  query,
  queryOne,
  insert,
  update,
  remove,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  closePool
};