import restaurantModel from '../models/restaurant.model';
import {
  Restaurant,
  DishCategory,
  Dish,
  RestaurantTag,
  RestaurantTagTagType,
  QueryParams
} from '../models/restaurant';
import { PaginatedResponse } from '../../../types/index';

interface MenuResult {
  categories: (DishCategory & { dishes: Dish[] })[];
}

class RestaurantService {

  /**
   * 验证餐厅是否存在
   * @param restaurantId - 餐厅ID
   * @returns {Promise<{exists: boolean, restaurant?: Restaurant}>}
   */
  public async validateRestaurantExists(restaurantId: number): Promise<{ exists: boolean; restaurant?: Restaurant }> {
    const restaurant = await restaurantModel.findById(restaurantId);
    if (restaurant) {
      return { exists: true, restaurant };
    }
    return { exists: false };
  }

  /**
   * 构建分页参数
   * @param page - 页码
   * @param limit - 每页数量
   * @returns {object} 分页参数
   */
  private buildPaginationParams(page?: string | number, limit?: string | number) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    return {
      page: pageNum,
      limit: limitNum,
      skip,
      take: limitNum
    };
  }

  
  /**
   * 获取餐厅列表
   * @param queryParams - 查询参数
   * @returns {Promise<RestaurantListResult>}
   */
  async getRestaurantList(queryParams: QueryParams): Promise<PaginatedResponse<Restaurant>> {
    const {
      page = 1,
      limit = 10,
      keyword,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minRating,
      tags
    } = queryParams;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // 构建查询条件
    const where: any = {};

    // 关键词搜索
    if (keyword) {
      where.name = 
        { contains : keyword };
    }

    // 评分筛选
    if (minRating) {
      // 对于Decimal类型，使用字符串形式比较更可靠
      const ratingValue = parseFloat(minRating.toString());
      if (!isNaN(ratingValue)) {
        where.rating = { gte: ratingValue };
        console.log('添加评分筛选条件 - minRating:', minRating, '筛选后条件:', JSON.stringify(where.rating));
      }
    }

    // 标签筛选
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      where.restaurantTagRelations = {
        some: {
          restaurantTag: {
            tagName: { in: tagArray }
          }
        }
      };
    }

    // 排序条件
    const orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'deliveryTime') {
      orderBy.deliveryTime = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [restaurants, total] = await Promise.all([
      restaurantModel.findMany({
        where,
        orderBy,
        skip,
        take
      }),
      restaurantModel.count(where)
    ]);

    const currentPage = Number(page);
    const totalPages = Math.ceil(total / take);

    return {
      data: restaurants,
      pagination: {
        page: currentPage,
        limit: take,
        total,
        pages: totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    };
  }

  /**
   * 获取餐厅详情
   * @param restaurantId - 餐厅ID
   * @returns {Promise<Restaurant>}
   */
  async getRestaurantDetail(restaurantId: number): Promise<Restaurant> {
    const { exists, restaurant } = await this.validateRestaurantExists(restaurantId);

    if (!exists || !restaurant) {
      throw new Error('餐厅不存在');
    }

    return restaurant;
  }

  /**
   * 获取餐厅菜单（分类和菜品）
   * @param restaurantId - 餐厅ID
   * @returns {Promise<MenuResult>}
   */
  async getRestaurantMenu(restaurantId: number): Promise<MenuResult> {
    // 验证餐厅是否存在
    const { exists, restaurant } = await this.validateRestaurantExists(restaurantId);
    if (!exists || !restaurant) {
      throw new Error('餐厅不存在');
    }

    // 获取菜品分类和菜品
    const categories = await restaurantModel.getDishCategories(restaurantId);

    return {
      categories
    };
  }

  /**
   * 获取指定分类的菜品
   * @param restaurantId - 餐厅ID
   * @param categoryId - 分类ID
   * @returns {Promise<{restaurantId: number, categoryId: number, dishes: Dish[]}>}
   */
  async getDishesByCategory(restaurantId: number, categoryId: number): Promise<{restaurantId: number, categoryId: number, dishes: Dish[]}> {
    // 验证餐厅是否存在
    const { exists } = await this.validateRestaurantExists(restaurantId);
    if (!exists) {
      throw new Error('餐厅不存在');
    }

    // 获取分类下的菜品
    const dishes = await restaurantModel.getDishesByCategory(categoryId);

    return {
      restaurantId,
      categoryId,
      dishes
    };
  }

  /**
   * 获取餐厅标签列表
   * @param tagType 可选的标签类型筛选 (cuisine | feature | price_range | service)
   * @returns {Promise<RestaurantTag[]>}
   */
  async getRestaurantTags(tagType?: RestaurantTagTagType): Promise<RestaurantTag[]> {
    // 如果提供了 tagType，校验是否为有效的枚举值
    if (tagType) {
      const validTagTypes = Object.values(RestaurantTagTagType);
      if (!validTagTypes.includes(tagType)) {
        throw new Error(`无效的标签类型: ${tagType}。支持的类型: ${validTagTypes.join(', ')}`);
      }
    }

    const tags = restaurantModel.getRestaurantTags(tagType);
    return tags;
  }
}

// 导出单例实例
const restaurantService = new RestaurantService();
export default restaurantService;