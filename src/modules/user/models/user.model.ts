import { prisma, softDelete, paginate } from '../../../database/prisma';
import { User, CreateUserInput, UpdateUserInput } from '../../../types/user';
import { UserStatus, UserRole } from '@prisma/client';

class UserModel {
  /**
   * 创建用户
   * @param userData - 用户数据
   * @returns 用户ID
   */
  async create(userData: CreateUserInput): Promise<number> {
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        nickname: userData.nickname || userData.username,
        avatar: userData.avatar,
        status: (userData.status as UserStatus) || UserStatus.ACTIVE
      }
    });
    return user.id;
  }

  /**
   * 根据ID查询用户
   * @param id - 用户ID
   * @returns 用户信息
   */
  async findById(id: number): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        nickname: true,
        avatar: true,
        status: true,
        role: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) return null;

    return {
      ...user,
      status: user.status.toLowerCase() as User['status'],
      role: user.role.toLowerCase() as User['role']
    };
  }

  /**
   * 根据用户名查询用户（包含密码）
   * @param username - 用户名
   * @returns 用户信息
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        username,
        deletedAt: null
      }
    });

    if (!user) return null;

    return {
      ...user,
      status: user.status.toLowerCase() as User['status'],
      role: user.role.toLowerCase() as User['role']
    };
  }

  /**
   * 根据邮箱查询用户（包含密码）
   * @param email - 邮箱
   * @returns 用户信息
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null
      }
    });

    if (!user) return null;

    return {
      ...user,
      status: user.status.toLowerCase() as User['status'],
      role: user.role.toLowerCase() as User['role']
    };
  }

  /**
   * 根据手机号查询用户（包含密码）
   * @param phone - 手机号
   * @returns 用户信息
   */
  async findByPhone(phone: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        phone,
        deletedAt: null
      }
    });

    if (!user) return null;

    return {
      ...user,
      status: user.status.toLowerCase() as User['status'],
      role: user.role.toLowerCase() as User['role']
    };
  }

  /**
   * 更新用户信息
   * @param id - 用户ID
   * @param userData - 更新数据
   * @returns 影响行数
   */
  async update(id: number, userData: UpdateUserInput): Promise<number> {
    const result = await prisma.user.updateMany({
      where: {
        id,
        deletedAt: null
      },
      data: userData
    });
    return result.count;
  }

  /**
   * 删除用户（软删除）
   * @param id - 用户ID
   * @returns 影响行数
   */
  async delete(id: number): Promise<number> {
    const result = await prisma.user.updateMany({
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
   * 获取用户列表
   * @param options - 查询选项
   * @returns 用户列表
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    keyword?: string;
  } = {}): Promise<User[]> {
    const { page = 1, limit = 10, status, keyword } = options;

    const where: any = {
      deletedAt: null
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { nickname: { contains: keyword } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        nickname: true,
        avatar: true,
        status: true,
        role: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return users.map(user => ({
      ...user,
      status: user.status.toLowerCase() as User['status'],
      role: user.role.toLowerCase() as User['role']
    }));
  }

  /**
   * 获取用户总数
   * @param options - 查询选项
   * @returns 用户总数
   */
  async count(options: {
    status?: string;
    keyword?: string;
  } = {}): Promise<number> {
    const { status, keyword } = options;

    const where: any = {
      deletedAt: null
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { nickname: { contains: keyword } }
      ];
    }

    return await prisma.user.count({ where });
  }

  /**
   * 检查用户名是否存在
   * @param username - 用户名
   * @param excludeId - 排除的用户ID
   * @returns 是否存在
   */
  async isUsernameExists(username: string, excludeId?: number): Promise<boolean> {
    const where: any = {
      username,
      deletedAt: null
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const user = await prisma.user.findFirst({
      where,
      select: { id: true }
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
      deletedAt: null
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const user = await prisma.user.findFirst({
      where,
      select: { id: true }
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
      deletedAt: null
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const user = await prisma.user.findFirst({
      where,
      select: { id: true }
    });

    return !!user;
  }

  /**
   * 更新最后登录信息
   * @param id - 用户ID
   * @param loginIp - 登录IP
   */
  async updateLastLogin(id: number, loginIp?: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: loginIp
      }
    });
  }

  /**
   * 分页查询用户
   * @param options - 查询选项
   * @returns 分页结果
   */
  async findWithPagination(options: {
    page?: number;
    limit?: number;
    status?: string;
    keyword?: string;
  } = {}) {
    const { page = 1, limit = 10, status, keyword } = options;

    const where: any = {
      deletedAt: null
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { nickname: { contains: keyword } }
      ];
    }

    const result = await paginate(prisma.user, {
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        nickname: true,
        avatar: true,
        status: true,
        role: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // 计算总数和分页信息
    const total = await prisma.user.count({ where });
    const totalPages = Math.ceil(total / limit);

    return {
      items: result.items.map(user => ({
        ...user,
        status: user.status.toLowerCase() as User['status'],
        role: user.role.toLowerCase() as User['role']
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
const userModel = new UserModel();
export default userModel;