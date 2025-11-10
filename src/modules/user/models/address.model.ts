import { prisma } from "@/database/prisma";
import { CreateAddressInput, UpdateAddressInput,Address } from "./user";

class AddressModel {
  /**
   * 创建地址
   * @param userId - 用户ID
   * @param addressData - 地址数据
   * @returns 创建的地址
   */
  async createAddress(
    userId: number,
    addressData: CreateAddressInput
  ): Promise<Address> {
    // 如果设置为默认地址，需要先取消其他默认地址（只影响未删除的地址）
    if (addressData.isDefault) {
      await prisma.userAddresses.updateMany({
        where: {
          userId,
          deleteAt: null,
        } as any,
        data: { isDefault: false },
      });
    }

    const address = await prisma.userAddresses.create({
      data: {
        userId,
        contactName: addressData.contactName,
        contactPhone: addressData.contactPhone,
        province: addressData.province,
        city: addressData.city,
        district: addressData.district,
        detailAddress: addressData.detailAddress,
        isDefault: addressData.isDefault || false,
      },
    });

    return address;
  }

  /**
   * 获取用户的所有地址
   * @param userId - 用户ID
   * @returns 地址列表
   */
  async getUserAddresses(userId: number): Promise<Address[]> {
    return await prisma.userAddresses.findMany({
      where: {
        userId,
        deleteAt: null, // 排除已删除的地址
      } as any,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 获取用户的默认地址
   * @param userId - 用户ID
   * @returns 默认地址
   */
  async getDefaultAddress(userId: number): Promise<Address | null> {
    return await prisma.userAddresses.findFirst({
      where: {
        userId,
        isDefault: true,
        deleteAt: null, // 排除已删除的地址
      } as any,
    });
  }

  /**
   * 根据ID查询地址
   * @param addressId - 地址ID
   * @param userId - 用户ID
   * @returns 地址信息
   */
  async findByIdAndUserId(
    addressId: number,
    userId: number
  ): Promise<Address | null> {
    const address = await prisma.userAddresses.findFirst({
      where: {
        id: addressId,
        userId,
        deleteAt: null, // 排除已删除的地址
      } as any,
    });

    if (!address) return null;
    return address;
  }

  /**
   * 更新地址信息
   * @param addressId - 地址ID
   * @param userId - 用户ID
   * @param updateData - 更新数据
   * @returns 更新后的地址
   */
  async updateAddress(
    addressId: number,
    userId: number,
    updateData: UpdateAddressInput
  ): Promise<Address> {
    const address = await this.findByIdAndUserId(addressId, userId);

    if (!address) {
      throw { message: "地址不存在", code: "ADDRESS_NOT_FOUND" };
    }

    // 如果设置为默认地址，需要先取消其他默认地址
    if (updateData.isDefault) {
      await prisma.userAddresses.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.userAddresses.update({
      where: { id: addressId },
      data: updateData,
    });

    return updatedAddress;
  }

  /**
   * 设置默认地址
   * @param userId - 用户ID
   * @param addressId - 地址ID
   */
  async setDefaultAddress(userId: number, addressId: number): Promise<void> {
    const address = await this.findByIdAndUserId(addressId, userId);

    if (!address) {
      throw { message: "地址不存在", code: "ADDRESS_NOT_FOUND" };
    }

    // 使用事务来确保数据一致性
    await prisma.$transaction([
      // 取消所有默认地址（只影响未删除的地址）
      prisma.userAddresses.updateMany({
        where: {
          userId,
          deleteAt: null,
        } as any,
        data: { isDefault: false },
      }),
      // 设置新的默认地址
      prisma.userAddresses.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);
  }

  /**
   * 删除地址（软删除）
   * @param userId - 用户ID
   * @param addressId - 地址ID
   */
  async deleteAddress(userId: number, addressId: number): Promise<void> {
    const address = await this.findByIdAndUserId(addressId, userId);

    if (!address) {
      throw { message: "地址不存在", code: "ADDRESS_NOT_FOUND" };
    }

    // 软删除：设置 deleteAt 字段
    await prisma.userAddresses.update({
      where: { id: addressId },
      data: { deleteAt: new Date() } as any,
    });
  }

  /**
   * 批量删除地址（软删除）
   * @param userId - 用户ID
   * @param addressIds - 地址ID数组
   */
  async batchDeleteAddresses(
    userId: number,
    addressIds: number[]
  ): Promise<void> {
    await prisma.userAddresses.updateMany({
      where: {
        id: { in: addressIds },
        userId,
      },
      data: { deleteAt: new Date() } as any,
    });
  }

  /**
   * 获取用户地址数量
   * @param userId - 用户ID
   * @returns 地址数量
   */
  async countByUserId(userId: number): Promise<number> {
    return await prisma.userAddresses.count({
      where: {
        userId,
        deleteAt: null, // 排除已删除的地址
      } as any,
    });
  }
}

// 导出单例实例
const addressModel = new AddressModel();
export default addressModel;
