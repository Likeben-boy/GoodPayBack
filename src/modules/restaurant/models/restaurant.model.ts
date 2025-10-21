import { PrismaClient } from '@prisma/client';

interface QueryOptions {
  where?: any;
  orderBy?: any;
  skip?: number;
  take?: number;
  include?: any;
}

interface Restaurant {
  id: number;
  name: string;
  image?: string;
  rating?: number;
  distance?: number;
  deliveryFee?: number;
  deliveryTime?: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface Dish {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  salesCount: number;
  categoryId: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface DishCategory {
  id: number;
  name: string;
  restaurantId: number;
  sortOrder: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  dishes?: Dish[];
}

interface CreateRestaurantData {
  name: string;
  image?: string;
  rating?: number;
  distance?: number;
  deliveryFee?: number;
  deliveryTime?: number;
  status?: number;
}

interface UpdateRestaurantData {
  name?: string;
  image?: string;
  rating?: number;
  distance?: number;
  deliveryFee?: number;
  deliveryTime?: number;
  status?: number;
}

class RestaurantModel {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 获取餐厅列表
   * @param options - 查询选项
   * @returns {Promise<Array>}
   */
  async findMany(options: QueryOptions = {}): Promise<any[]> {
    const {
      skip = 0,
      take = 10,
      where = {},
      orderBy = { createdAt: 'desc' },
      include = {
        restaurantTagRelations: {
          include: {
            restaurantTagMaster: true
          }
        }
      }
    } = options;

    try {
      const restaurants = await this.prisma.restaurants.findMany({
        where: {
          deletedAt: null,
          status: 1,
          ...where
        },
        include,
        orderBy,
        skip,
        take
      });

      return restaurants.map(restaurant => ({
        ...restaurant,
        tags: restaurant.restaurantTagRelations.map((relation: any) =>
          relation.restaurantTagMaster.tagName
        )
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch restaurants: ${error.message}`);
    }
  }

  /**
   * 根据ID获取餐厅详情
   * @param id - 餐厅ID
   * @returns {Promise<Object|null>}
   */
  async findById(id: number): Promise<any | null> {
    try {
      const restaurant = await this.prisma.restaurants.findFirst({
        where: {
          id,
          deletedAt: null,
          status: 1
        },
        include: {
          restaurantTagRelations: {
            include: {
              restaurantTagMaster: true
            }
          }
        }
      });

      if (!restaurant) {
        return null;
      }

      return {
        ...restaurant,
        tags: restaurant.restaurantTagRelations.map((relation: any) =>
          relation.restaurantTagMaster.tagName
        )
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch restaurant by id: ${error.message}`);
    }
  }

  /**
   * 搜索餐厅
   * @param keyword - 搜索关键词
   * @param options - 查询选项
   * @returns {Promise<Array>}
   */
  async search(keyword: string, options: QueryOptions = {}): Promise<any[]> {
    const { skip = 0, take = 10 } = options;

    try {
      const restaurants = await this.prisma.restaurants.findMany({
        where: {
          deletedAt: null,
          status: 1,
          OR: [
            { name: { contains: keyword } },
            {
              restaurantTagRelations: {
                some: {
                  restaurantTagMaster: {
                    tagName: { contains: keyword }
                  }
                }
              }
            }
          ]
        },
        include: {
          restaurantTagRelations: {
            include: {
              restaurantTagMaster: true
            }
          }
        },
        skip,
        take
      });

      return restaurants.map(restaurant => ({
        ...restaurant,
        tags: restaurant.restaurantTagRelations.map((relation: any) =>
          relation.restaurantTagMaster.tagName
        )
      }));
    } catch (error: any) {
      throw new Error(`Failed to search restaurants: ${error.message}`);
    }
  }

  /**
   * 获取餐厅总数
   * @param where - 查询条件
   * @returns {Promise<Number>}
   */
  async count(where: any = {}): Promise<number> {
    try {
      return await this.prisma.restaurants.count({
        where: {
          deletedAt: null,
          status: 1,
          ...where
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to count restaurants: ${error.message}`);
    }
  }

  /**
   * 获取菜品分类
   * @param restaurantId - 餐厅ID
   * @returns {Promise<Array>}
   */
  async getDishCategories(restaurantId: number): Promise<DishCategory[]> {
    try {
      const categories = await this.prisma.dish_categories.findMany({
        where: {
          restaurantId,
          status: 1
        },
        include: {
          dishes: {
            where: {
              deletedAt: null,
              status: 1
            },
            orderBy: {
              sortOrder: 'asc'
            }
          }
        },
        orderBy: {
          sortOrder: 'asc'
        }
      });

      return categories;
    } catch (error: any) {
      throw new Error(`Failed to fetch dish categories: ${error.message}`);
    }
  }

  /**
   * 获取餐厅菜品
   * @param restaurantId - 餐厅ID
   * @param categoryId - 分类ID（可选）
   * @returns {Promise<Array>}
   */
  async getDishes(restaurantId: number, categoryId: number | null = null): Promise<any[]> {
    try {
      const where: any = {
        restaurantId,
        deletedAt: null,
        status: 1
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const dishes = await this.prisma.dishes.findMany({
        where,
        include: {
          dishCategories: true
        },
        orderBy: [
          { categoryId: 'asc' },
          { sortOrder: 'asc' },
          { salesCount: 'desc' }
        ]
      });

      return dishes;
    } catch (error: any) {
      throw new Error(`Failed to fetch dishes: ${error.message}`);
    }
  }

  /**
   * 根据分类获取菜品
   * @param categoryId - 分类ID
   * @returns {Promise<Array>}
   */
  async getDishesByCategory(categoryId: number): Promise<any[]> {
    try {
      const dishes = await this.prisma.dishes.findMany({
        where: {
          categoryId,
          deletedAt: null,
          status: 1
        },
        include: {
          dishCategories: true
        },
        orderBy: [
          { sortOrder: 'asc' },
          { salesCount: 'desc' }
        ]
      });

      return dishes;
    } catch (error: any) {
      throw new Error(`Failed to fetch dishes by category: ${error.message}`);
    }
  }

  /**
   * 创建餐厅
   * @param restaurantData - 餐厅数据
   * @returns {Promise<Object>}
   */
  async create(restaurantData: CreateRestaurantData): Promise<any> {
    try {
      const restaurant = await this.prisma.restaurants.create({
        data: restaurantData
      });
      return restaurant;
    } catch (error: any) {
      throw new Error(`Failed to create restaurant: ${error.message}`);
    }
  }

  /**
   * 更新餐厅信息
   * @param id - 餐厅ID
   * @param updateData - 更新数据
   * @returns {Promise<Object>}
   */
  async update(id: number, updateData: UpdateRestaurantData): Promise<any> {
    try {
      const restaurant = await this.prisma.restaurants.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });
      return restaurant;
    } catch (error: any) {
      throw new Error(`Failed to update restaurant: ${error.message}`);
    }
  }

  /**
   * 软删除餐厅
   * @param id - 餐厅ID
   * @returns {Promise<Object>}
   */
  async softDelete(id: number): Promise<any> {
    try {
      const restaurant = await this.prisma.restaurants.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });
      return restaurant;
    } catch (error: any) {
      throw new Error(`Failed to delete restaurant: ${error.message}`);
    }
  }

  /**
   * 关闭Prisma连接
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default RestaurantModel;