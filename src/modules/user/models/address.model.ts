import { prisma, executeTransaction } from '../../../database/prisma';
import { Address, CreateAddressInput, UpdateAddressInput } from '../../../types/user';

class AddressModel {
  /**
   * 创建地址
   * @param addressData - 地址数据
   * @returns 地址ID
   */
  async create(addressData: CreateAddressInput): Promise<number> {
    const address = await prisma.addresses.create({
      data: {
        userId: addressData.userId,
        recipient: addressData.recipient,
        phone: addressData.phone,
        province: addressData.province,
        city: addressData.city,
        district: addressData.district,
        detailedAddress: addressData.detailedAddress,
        postalCode: addressData.postalCode || null,
        isDefault: addressData.isDefault || false
      }
    });
    return address.id;
  }

  /**
   * 根据ID查询地址
   * @param id - 地址ID
   * @returns 地址信息
   */
  async findById(id: number): Promise<Address | null> {
    const address = await prisma.addresses.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!address) return null;

    return {
      ...address,
      isDefault: address.isDefault || false,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt
    };
  }

  /**
   * 获取用户的所有地址
   * @param userId - 用户ID
   * @returns 地址列表
   */
  async findByUserId(userId: number): Promise<Address[]> {
    const addresses = await prisma.addresses.findMany({
      where: {
        userId,
        deletedAt: null
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return addresses.map(address => ({
      ...address,
      isDefault: address.isDefault || false,
      postalCode: address.postalCode || undefined,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
      deletedAt: address.deletedAt
    }));
  }

  /**
   * 获取用户的默认地址
   * @param userId - 用户ID
   * @returns 默认地址
   */
  async findDefaultByUserId(userId: number): Promise<Address | null> {
    const address = await prisma.addresses.findFirst({
      where: {
        userId,
        isDefault: true,
        deletedAt: null
      }
    });

    if (!address) return null;

    return {
      ...address,
      isDefault: address.isDefault || false,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt
    };
  }

  /**
   * 更新地址信息
   * @param id - 地址ID
   * @param addressData - 更新数据
   * @returns 影响行数
   */
  async update(id: number, addressData: UpdateAddressInput): Promise<number> {
    const result = await prisma.addresses.updateMany({
      where: {
        id,
        deletedAt: null
      },
      data: addressData
    });
    return result.count;
  }

  /**
   * 设置默认地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   * @returns 影响行数
   */
  async setDefault(userId: number, addressId: number): Promise<number> {
    const result = await executeTransaction(async (tx) => {
      // 取消所有默认地址
      await tx.addresses.updateMany({
        where: {
          userId,
          deletedAt: null
        },
        data: {
          isDefault: false
        }
      });

      // 设置新的默认地址
      const updateResult = await tx.addresses.updateMany({
        where: {
          id: addressId,
          userId,
          deletedAt: null
        },
        data: {
          isDefault: true
        }
      });

      return updateResult.count;
    });

    return result;
  }

  /**
   * 删除地址（软删除）
   * @param id - 地址ID
   * @returns 影响行数
   */
  async delete(id: number): Promise<number> {
    const result = await prisma.addresses.updateMany({
      where: {
        id,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });
    return result.count;
  }

  /**
   * 批量删除地址（软删除）
   * @param userId - 用户ID
   * @param addressIds - 地址ID数组
   * @returns 影响行数
   */
  async batchDelete(userId: number, addressIds: number[]): Promise<number> {
    const result = await prisma.addresses.updateMany({
      where: {
        userId,
        id: {
          in: addressIds
        },
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });
    return result.count;
  }

  /**
   * 检查地址是否属于指定用户
   * @param addressId - 地址ID
   * @param userId - 用户ID
   * @returns 是否属于用户
   */
  async belongsToUser(addressId: number, userId: number): Promise<boolean> {
    const address = await prisma.addresses.findFirst({
      where: {
        id: addressId,
        userId,
        deletedAt: null
      },
      select: { id: true }
    });

    return !!address;
  }

  /**
   * 获取用户地址数量
   * @param userId - 用户ID
   * @returns 地址数量
   */
  async countByUserId(userId: number): Promise<number> {
    return await prisma.addresses.count({
      where: {
        userId,
        deletedAt: null
      }
    });
  }

  /**
   * 获取用户默认地址数量
   * @param userId - 用户ID
   * @returns 默认地址数量
   */
  async countDefaultByUserId(userId: number): Promise<number> {
    return await prisma.addresses.count({
      where: {
        userId,
        isDefault: true,
        deletedAt: null
      }
    });
  }

  /**
   * 分页查询用户地址
   * @param userId - 用户ID
   * @param options - 查询选项
   * @returns 分页结果
   */
  async findWithPagination(userId: number, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null
    };

    const [addresses, total] = await Promise.all([
      prisma.addresses.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.addresses.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: addresses.map(address => ({
        ...address,
        isDefault: address.isDefault || false,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}

// 导出单例实例
const addressModel = new AddressModel();
export default addressModel;