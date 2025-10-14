const { query, insert, update, remove, queryOne } = require('../../../database/connection');

class UserModel {
  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<number>} 用户ID
   */
  async create(userData) {
    const sql = `
      INSERT INTO users (
        username, email, phone, password, nickname, avatar, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      userData.username,
      userData.email,
      userData.phone,
      userData.password,
      userData.nickname,
      userData.avatar,
      userData.status || 'active'
    ];
    return await insert(sql, params);
  }

  /**
   * 根据ID查询用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} 用户信息
   */
  async findById(id) {
    const sql = `
      SELECT id, username, email, phone, nickname, avatar, status,
             created_at, updated_at
      FROM users
      WHERE id = ? AND deleted_at IS NULL
    `;
    return await queryOne(sql, [id]);
  }

  /**
   * 根据用户名查询用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户信息
   */
  async findByUsername(username) {
    const sql = `
      SELECT id, username, email, phone, password, nickname, avatar, status
      FROM users
      WHERE username = ? AND deleted_at IS NULL
    `;
    return await queryOne(sql, [username]);
  }

  /**
   * 根据邮箱查询用户
   * @param {string} email - 邮箱
   * @returns {Promise<Object|null>} 用户信息
   */
  async findByEmail(email) {
    const sql = `
      SELECT id, username, email, phone, password, nickname, avatar, status
      FROM users
      WHERE email = ? AND deleted_at IS NULL
    `;
    return await queryOne(sql, [email]);
  }

  /**
   * 根据手机号查询用户
   * @param {string} phone - 手机号
   * @returns {Promise<Object|null>} 用户信息
   */
  async findByPhone(phone) {
    const sql = `
      SELECT id, username, email, phone, password, nickname, avatar, status
      FROM users
      WHERE phone = ? AND deleted_at IS NULL
    `;
    return await queryOne(sql, [phone]);
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} userData - 更新数据
   * @returns {Promise<number>} 影响行数
   */
  async update(id, userData) {
    const fields = [];
    const params = [];

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(userData[key]);
      }
    });

    if (fields.length === 0) return 0;

    const sql = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;
    params.push(id);

    return await update(sql, params);
  }

  /**
   * 删除用户（软删除）
   * @param {number} id - 用户ID
   * @returns {Promise<number>} 影响行数
   */
  async delete(id) {
    const sql = `
      UPDATE users
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;
    return await update(sql, [id]);
  }

  /**
   * 获取用户列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 用户列表
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, status, keyword } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (keyword) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR nickname LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    const sql = `
      SELECT id, username, email, phone, nickname, avatar, status,
             created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    return await query(sql, params);
  }

  /**
   * 获取用户总数
   * @param {Object} options - 查询选项
   * @returns {Promise<number>} 用户总数
   */
  async count(options = {}) {
    const { status, keyword } = options;

    let whereClause = 'WHERE deleted_at IS NULL';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (keyword) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR nickname LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    const sql = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    const result = await queryOne(sql, params);
    return result ? result.total : 0;
  }
}

module.exports = new UserModel();