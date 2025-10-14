const { query, insert, update, remove, queryOne } = require('../../../database/connection');

class AddressModel {
  /**
   * 创建地址
   * @param {Object} addressData - 地址数据
   * @returns {Promise<number>} 地址ID
   */
  async create(addressData) {
    const sql = `
      INSERT INTO addresses (
        user_id, recipient, phone, province, city, district,
        detailed_address, postal_code, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      addressData.user_id,
      addressData.recipient,
      addressData.phone,
      addressData.province,
      addressData.city,
      addressData.district,
      addressData.detailed_address,
      addressData.postal_code,
      addressData.is_default || false
    ];
    return await insert(sql, params);
  }

  /**
   * 根据ID查询地址
   * @param {number} id - 地址ID
   * @returns {Promise<Object|null>} 地址信息
   */
  async findById(id) {
    const sql = `
      SELECT id, user_id, recipient, phone, province, city, district,
             detailed_address, postal_code, is_default, created_at, updated_at
      FROM addresses
      WHERE id = ? AND deleted_at IS NULL
    `;
    return await queryOne(sql, [id]);
  }

  /**
   * 获取用户的所有地址
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 地址列表
   */
  async findByUserId(userId) {
    const sql = `
      SELECT id, user_id, recipient, phone, province, city, district,
             detailed_address, postal_code, is_default, created_at, updated_at
      FROM addresses
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY is_default DESC, created_at DESC
    `;
    return await query(sql, [userId]);
  }

  /**
   * 获取用户的默认地址
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 默认地址
   */
  async findDefaultByUserId(userId) {
    const sql = `
      SELECT id, user_id, recipient, phone, province, city, district,
             detailed_address, postal_code, is_default, created_at, updated_at
      FROM addresses
      WHERE user_id = ? AND is_default = true AND deleted_at IS NULL
    `;
    return await queryOne(sql, [userId]);
  }

  /**
   * 更新地址信息
   * @param {number} id - 地址ID
   * @param {Object} addressData - 更新数据
   * @returns {Promise<number>} 影响行数
   */
  async update(id, addressData) {
    const fields = [];
    const params = [];

    Object.keys(addressData).forEach(key => {
      if (addressData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(addressData[key]);
      }
    });

    if (fields.length === 0) return 0;

    const sql = `
      UPDATE addresses
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;
    params.push(id);

    return await update(sql, params);
  }

  /**
   * 设置默认地址
   * @param {number} userId - 用户ID
   * @param {number} addressId - 地址ID
   * @returns {Promise<number>} 影响行数
   */
  async setDefault(userId, addressId) {
    const connection = await require('../../../database/connection').beginTransaction();

    try {
      // 取消所有默认地址
      await connection.execute(
        'UPDATE addresses SET is_default = false WHERE user_id = ? AND deleted_at IS NULL',
        [userId]
      );

      // 设置新的默认地址
      await connection.execute(
        'UPDATE addresses SET is_default = true WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        [addressId, userId]
      );

      await connection.commit();
      return 1;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  /**
   * 删除地址（软删除）
   * @param {number} id - 地址ID
   * @returns {Promise<number>} 影响行数
   */
  async delete(id) {
    const sql = `
      UPDATE addresses
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;
    return await update(sql, [id]);
  }

  /**
   * 批量删除地址（软删除）
   * @param {number} userId - 用户ID
   * @param {Array} addressIds - 地址ID数组
   * @returns {Promise<number>} 影响行数
   */
  async batchDelete(userId, addressIds) {
    const placeholders = addressIds.map(() => '?').join(',');
    const sql = `
      UPDATE addresses
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE user_id = ? AND id IN (${placeholders}) AND deleted_at IS NULL
    `;
    const params = [userId, ...addressIds];
    return await update(sql, params);
  }
}

module.exports = new AddressModel();