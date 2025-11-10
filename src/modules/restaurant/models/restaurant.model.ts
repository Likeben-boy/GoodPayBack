import { prisma } from '@/database/prisma';
import {
  Restaurant,
  DishCategory,
  Dish,
  RestaurantTag,
  RestaurantTagTagType
} from '../models/restaurant';

interface QueryOptions {
  where?: any;
  orderBy?: any;
  skip?: number;
  take?: number;
}

class RestaurantModel {
  constructor() {
  }

  /**
   * 获取餐厅列表
   * @param options - 查询选项
   * @returns {Promise<Restaurant[]>}
   */
  async findMany(options: QueryOptions = {}): Promise<Restaurant[]> {
    const {
      skip = 0,
      take = 10,
      where = {},
      orderBy = { createdAt: 'desc' }
    } = options;

    // 构建基础查询条件
    const baseWhere = {
      deletedAt: null,
      status: true
    };

    // 合并查询条件，确保rating筛选条件正确应用
    const finalWhere = { ...baseWhere, ...where };

    const restaurants = await prisma.restaurants.findMany({
      relationLoadStrategy: 'join',
      where: finalWhere,
      orderBy,
      skip,
      take,
      include:{
        restaurantTagRelations:{
          include:{
            restaurantTag:{
              select:{
                tagName:true
              }
            }
          }
        }
      }
    });

    // 转换为实体类类型，处理Decimal类型转换
    return restaurants.map(restaurant => {
      const { deletedAt,restaurantTagRelations, ...rest } = restaurant;

      return {
        ...rest,
        rating: Number(restaurant.rating),
        deliveryFee: Number(restaurant.deliveryFee),
        tags: restaurantTagRelations.map(relation => relation.restaurantTag.tagName),
        ...(deletedAt && { deletedAt })
      };
    });
  }

  /**
   * 根据ID获取餐厅详情
   * @param id - 餐厅ID
   * @returns {Promise<Restaurant | null>}
   */
  async findById(id: number): Promise<Restaurant | null> {
    const restaurant = await prisma.restaurants.findUnique({
      where: {
        id,
        deletedAt: null,
        status: true
      },
            include:{
        restaurantTagRelations:{
          include:{
            restaurantTag:{
              select:{
                tagName:true
              }
            }
          }
        }
      }
    });

    if (!restaurant) {
      return null;
    }

    // 转换为实体类类型，处理Decimal类型转换
    const { deletedAt,restaurantTagRelations, ...rest } = restaurant;
    return {
      ...rest,
      rating: Number(restaurant.rating),
      deliveryFee: Number(restaurant.deliveryFee),
              tags: restaurantTagRelations.map(relation => relation.restaurantTag.tagName),
      ...(deletedAt && { deletedAt })
    };
  }

  /**
   * 获取餐厅总数
   * @param where - 查询条件
   * @returns {Promise<Number>}
   */
  count(where: any = {}): Promise<number> {
    // 构建基础查询条件
    const baseWhere = {
      deletedAt: null,
      status: true
    };

    // 合并查询条件，确保与findMany保持一致
    const finalWhere = { ...baseWhere, ...where };

    console.log('RestaurantModel count - 查询条件:', JSON.stringify(finalWhere, null, 2));

    return prisma.restaurants.count({
      where: finalWhere
    });
  }

  /**
   * 获取菜品分类
   * @param restaurantId - 餐厅ID
   * @returns {Promise<(DishCategory & { dishes: Dish[] })[]>}
   */
  async getDishCategories(restaurantId: number): Promise<(DishCategory & { dishes: Dish[] })[]> {
    const categories = await prisma.dishCategories.findMany({
      where: {
        restaurantId,
        status: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    // Get dishes for each category
    const categoriesWithDishes = await Promise.all(
      categories.map(async (category) => {
        const dishes = await prisma.dishes.findMany({
          where: {
            categoryId: category.id,
            deletedAt: null,
            status: true
          },
          orderBy: {
            salesCount: 'desc'
          }
        });

        // 转换为实体类类型
        const convertedDishes: Dish[] = dishes.map(dish => {
          const { deletedAt, description, image, ...rest } = dish;
          return {
            ...rest,
            price: Number(dish.price),
            ...(description && { description }),
            ...(image && { image }),
            ...(deletedAt && { deletedAt })
          };
        });

        return {
          ...category,
          dishes: convertedDishes
        };
      })
    );

    return categoriesWithDishes;
  }

  /**
   * 获取餐厅菜品
   * @param restaurantId - 餐厅ID
   * @param categoryId - 分类ID（可选）
   * @returns {Promise<Dish[]>}
   */
  async getDishes(restaurantId: number, categoryId: number | null = null): Promise<Dish[]> {
    const where: any = {
      restaurantId,
      deletedAt: null,
      status: true
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const dishes = await prisma.dishes.findMany({
      where,
      orderBy: [
        { categoryId: 'asc' },
        { salesCount: 'desc' }
      ]
    });

    // 转换为实体类类型
    return dishes.map(dish => {
      const { deletedAt, description, image, ...rest } = dish;
      return {
        ...rest,
        price: Number(dish.price),
        ...(description && { description }),
        ...(image && { image }),
        ...(deletedAt && { deletedAt })
      };
    });
  }

  /**
   * 根据分类获取菜品
   * @param categoryId - 分类ID
   * @returns {Promise<Dish[]>}
   */
  async getDishesByCategory(categoryId: number): Promise<Dish[]> {
    const dishes = await prisma.dishes.findMany({
      where: {
        categoryId,
        deletedAt: null,
        status: true
      },
      orderBy: [
        { salesCount: 'desc' }
      ]
    });

    // 转换为实体类类型
    return dishes.map(dish => {
      const { deletedAt, description, image, ...rest } = dish;
      return {
        ...rest,
        price: Number(dish.price),
        ...(description && { description }),
        ...(image && { image }),
        ...(deletedAt && { deletedAt })
      };
    });
  }

  /**
   * 根据ID和餐厅ID查询菜品
   * @param dishId - 菜品ID
   * @param restaurantId - 餐厅ID
   * @returns 菜品信息
   */
  async findDishByIdAndRestaurant(dishId: number, restaurantId: number): Promise<any> {
    const dish = await prisma.dishes.findFirst({
      where: {
        id: dishId,
        restaurantId: restaurantId,
        deletedAt: null,
        status: true
      }
    });

    return dish;
  }

  /**
   * 批量查询菜品信息
   * @param dishIds - 菜品ID数组
   * @param restaurantId - 餐厅ID
   * @returns 菜品信息列表
   */
  async findDishesByIds(dishIds: number[], restaurantId: number): Promise<any[]> {
    const dishes = await prisma.dishes.findMany({
      where: {
        id: { in: dishIds },
        restaurantId: restaurantId,
        deletedAt: null,
        status: true
      }
    });

    return dishes;
  }

  /**
   * 获取餐厅标签列表
   * @param tagType 可选的标签类型筛选 (cuisine | feature | price_range | service)
   * @returns {Promise<RestaurantTag[]>}
   */
   async getRestaurantTags(tagType?: RestaurantTagTagType): Promise<RestaurantTag[]> {
    // 构建查询条件
    const whereCondition: any = {
      status: true
    };

    // 如果指定了tagType，添加到查询条件
    if (tagType) {
      whereCondition.tagType = tagType;
    }

    const tags = await prisma.restaurantTag.findMany({
      where: whereCondition,
      orderBy: {
        sortOrder: 'asc'
      }
    });

    // 转换为实体类类型
    return tags.map(tag => {
      const { icon, color, tagType, ...rest } = tag;
      return {
        ...rest,
        tagType: tagType as RestaurantTagTagType,
        color: color || '#ff6b6b',
        ...(icon && { icon })
      };
    });
  }
}

// 导出单例实例
const restaurantModel = new RestaurantModel();
export default restaurantModel;