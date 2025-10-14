const mysql = require('mysql2/promise');
const config = require('../config');

// 数据库连接池配置
const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: config.DB_POOL_MAX,
  queueLimit: 0,
  charset: 'utf8mb4',
  multipleStatements: false,
  timezone: '+08:00'
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// 执行查询
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// 执行单行查询
const queryOne = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// 插入数据并返回ID
const insert = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
};

// 更新数据
const update = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
};

// 删除数据
const remove = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  }
};

// 开始事务
const beginTransaction = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  } catch (error) {
    console.error('Transaction begin error:', error);
    throw error;
  }
};

// 提交事务
const commitTransaction = async (connection) => {
  try {
    await connection.commit();
    connection.release();
  } catch (error) {
    console.error('Transaction commit error:', error);
    throw error;
  }
};

// 回滚事务
const rollbackTransaction = async (connection) => {
  try {
    await connection.rollback();
    connection.release();
  } catch (error) {
    console.error('Transaction rollback error:', error);
    throw error;
  }
};

// 关闭数据库连接池
const closePool = async () => {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
};

module.exports = {
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