import { prisma, paginate } from "../../../database/prisma";
import { User, CreateUserInput, UpdateUserInput } from "./user";

class UserModel {
  /**
   * 创建用户
   * @param userData - 用户数据
   * @returns 用户ID
   */
  async create(userData: CreateUserInput): Promise<number> {
    const user = await prisma.users.create({
      data: {
        username: userData.phone, // 使用手机号作为用户名
        phone: userData.phone,
        password: userData.password,
        avatar: null,
        status: true,
      },
    });
    return user.id;
  }

  /**
   * 根据ID查询用户
   * @param id - 用户ID
   * @returns 用户信息
   */
  async findById(id: number): Promise<User | null> {
    const user = await prisma.users.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      status: user.status,
    };
  }

  /**
   * 根据用户名查询用户（包含密码）
   * @param username - 用户名
   * @returns 用户信息
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.users.findFirst({
      where: {
        username,
        deletedAt: null,
      },
    });

    if (!user) return null;

    return {
      ...user,
      status: Boolean(user.status),
    };
  }

  /**
   * 根据手机号查询用户（包含密码）
   * @param phone - 手机号
   * @returns 用户信息
   */
  async findByPhone(phone: string): Promise<User | null> {
    const user = await prisma.users.findFirst({
      where: {
        phone,
        deletedAt: null,
      },
    });

    if (!user) return null;

    return {
      ...user,
      status: Boolean(user.status),
    };
  }

  /**
   * 更新用户信息
   * @param id - 用户ID
   * @param userData - 更新数据
   * @returns 影响行数
   */
  async update(id: number, userData: UpdateUserInput): Promise<number> {
    const result = await prisma.users.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: userData,
    });
    return result.count;
  }

  /**
   * 删除用户（软删除）
   * @param id - 用户ID
   * @returns 影响行数
   */
  async delete(id: number): Promise<number> {
    const result = await prisma.users.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return result.count;
  }

  /**
   * 获取用户列表
   * @param options - 查询选项
   * @returns 用户列表
   */
  async findAll(
    options: {
      page?: number;
      limit?: number;
      status?: string;
      keyword?: string;
    } = {}
  ): Promise<User[]> {
    const { page = 1, limit = 10, status, keyword } = options;

    const where: any = {
      deletedAt: null,
    };

    if (status !== undefined) {
      where.status = Boolean(status);
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        username: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return users.map((user) => ({
      ...user,
      status: Boolean(user.status),
    }));
  }

  /**
   * 获取用户总数
   * @param options - 查询选项
   * @returns 用户总数
   */
  async count(
    options: {
      status?: string;
      keyword?: string;
    } = {}
  ): Promise<number> {
    const { status, keyword } = options;

    const where: any = {
      deletedAt: null,
    };

    if (status !== undefined) {
      where.status = Boolean(status);
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    return await prisma.users.count({ where });
  }

  /**
   * 检查用户名是否存在
   * @param username - 用户名
   * @param excludeId - 排除的用户ID
   * @returns 是否存在
   */
  async isUsernameExists(
    username: string,
    excludeId?: number
  ): Promise<boolean> {
    const where: any = {
      username,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const user = await prisma.users.findFirst({
      where,
      select: { id: true },
    });

    return !!user;
  }

  /**
   * 检查邮箱是否存在
   * @param email - 邮箱
   * @param excludeId - 排除的用户ID
   * @returns 是否存在
   */
  async isEmailExists(email: string, excludeId?: number): Promise<boolean> {
    const where: any = {
      email,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const user = await prisma.users.findFirst({
      where,
      select: { id: true },
    });

    return !!user;
  }

  /**
   * 检查手机号是否存在
   * @param phone - 手机号
   * @param excludeId - 排除的用户ID
   * @returns 是否存在
   */
  async isPhoneExists(phone: string, excludeId?: number): Promise<boolean> {
    const where: any = {
      phone,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const user = await prisma.users.findFirst({
      where,
      select: { id: true },
    });

    return !!user;
  }

  /**
   * 更新最后登录信息
   * @param id - 用户ID
   * @param loginIp - 登录IP
   */
  async updateLastLogin(id: number, loginIp?: string): Promise<void> {
    // 检查数据库schema中是否有这些字段，如果没有则暂时注释掉
    await prisma.users.update({
      where: { id },
      data: {
        // lastLoginAt: new Date(),
        // ...(loginIp && { lastLoginIp: loginIp })
      } as any,
    });
  }

  /**
   * 更新用户头像
   * @param userId - 用户ID
   * @param avatarUrl - 头像URL
   */
  async updateAvatar(userId: number, avatarUrl: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
  }

  /**
   * 更新用户密码
   * @param userId - 用户ID
   * @param hashedPassword - 加密后的密码
   */
  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * 分页查询用户
   * @param options - 查询选项
   * @returns 分页结果
   */
  async findWithPagination(
    options: {
      page?: number;
      limit?: number;
      status?: string;
      keyword?: string;
    } = {}
  ) {
    const { page = 1, limit = 10, status, keyword } = options;

    const where: any = {
      deletedAt: null,
    };

    if (status !== undefined) {
      where.status = Boolean(status);
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    const result = paginate(prisma.users, {
      page,
      limit,
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        phone: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });

    // 等待查询结果
    const [items, total] = await Promise.all([
      result.items,
      prisma.users.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((user) => ({
        ...user,
        status: Boolean(user.status),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

// 导出单例实例
const userModel = new UserModel();
export default userModel;
