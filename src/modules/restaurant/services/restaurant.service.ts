import RestaurantModel from '../models/restaurant.model';

interface QueryParams {
  page?: string | number;
  limit?: string | number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
  minRating?: string | number;
  maxDistance?: string | number;
  tags?: string | string[];
}

interface RestaurantData {
  name: string;
  image?: string;
  rating?: number;
  distance?: number;
  deliveryFee?: number;
  deliveryTime?: number;
  status?: number;
}

interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface RestaurantListResult {
  restaurants: any[];
  pagination: PaginationInfo;
}

interface MenuResult {
  restaurant: {
    id: number;
    name: string;
    image: string;
    rating: number;
    distance: number;
    deliveryFee: number;
    deliveryTime: number;
    tags: string[];
  };
  categories: any[];
}

class RestaurantService {
  private restaurantModel: RestaurantModel;

  constructor() {
    this.restaurantModel = new RestaurantModel();
  }

  /**
   * 获取餐厅列表
   * @param queryParams - 查询参数
   * @returns {Promise<ServiceResult<RestaurantListResult>>}
   */
  async getRestaurantList(queryParams: QueryParams): Promise<ServiceResult<RestaurantListResult>> {
    const {
      page = 1,
      limit = 10,
      keyword,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minRating,
      maxDistance,
      tags
    } = queryParams;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // 构建查询条件
    const where: any = {};

    // 关键词搜索
    if (keyword) {
      where.OR = [
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
      ];
    }

    // 评分筛选
    if (minRating) {
      where.rating = { gte: Number(minRating) };
    }

    // 距离筛选
    if (maxDistance) {
      where.distance = { lte: Number(maxDistance) };
    }

    // 标签筛选
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      where.restaurantTagRelations = {
        some: {
          restaurantTagMaster: {
            tagName: { in: tagArray }
          }
        }
      };
    }

    // 排序条件
    const orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'distance') {
      orderBy.distance = sortOrder;
    } else if (sortBy === 'deliveryTime') {
      orderBy.deliveryTime = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    try {
      const [restaurants, total] = await Promise.all([
        this.restaurantModel.findMany({
          where,
          orderBy,
          skip,
          take
        }),
        this.restaurantModel.count(where)
      ]);

      return {
        success: true,
        data: {
          restaurants,
          pagination: {
            page: Number(page),
            limit: take,
            total,
            totalPages: Math.ceil(total / take)
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'FETCH_RESTAURANTS_ERROR'
      };
    }
  }

  /**
   * 获取餐厅详情
   * @param restaurantId - 餐厅ID
   * @returns {Promise<ServiceResult>}
   */
  async getRestaurantDetail(restaurantId: number): Promise<ServiceResult> {
    try {
      const restaurant = await this.restaurantModel.findById(restaurantId);

      if (!restaurant) {
        return {
          success: false,
          message: '餐厅不存在',
          code: 'RESTAURANT_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: restaurant
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'FETCH_RESTAURANT_ERROR'
      };
    }
  }

  /**
   * 搜索餐厅
   * @param keyword - 搜索关键词
   * @param queryParams - 查询参数
   * @returns {Promise<ServiceResult>}
   */
  async searchRestaurants(keyword: string, queryParams: QueryParams = {}): Promise<ServiceResult> {
    const { page = 1, limit = 10 } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    try {
      const [restaurants, total] = await Promise.all([
        this.restaurantModel.search(keyword, {
          skip,
          take
        }),
        this.restaurantModel.search(keyword).then(result => result.length)
      ]);

      return {
        success: true,
        data: {
          restaurants,
          keyword,
          pagination: {
            page: Number(page),
            limit: take,
            total,
            totalPages: Math.ceil(total / take)
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'SEARCH_RESTAURANTS_ERROR'
      };
    }
  }

  /**
   * 获取餐厅菜单（分类和菜品）
   * @param restaurantId - 餐厅ID
   * @returns {Promise<ServiceResult<MenuResult>>}
   */
  async getRestaurantMenu(restaurantId: number): Promise<ServiceResult<MenuResult>> {
    try {
      // 首先验证餐厅是否存在
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        return {
          success: false,
          message: '餐厅不存在',
          code: 'RESTAURANT_NOT_FOUND'
        };
      }

      // 获取菜品分类和菜品
      const categories = await this.restaurantModel.getDishCategories(restaurantId);

      // 格式化返回数据，匹配前端需要的结构
      const formattedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        dishes: category.dishes.map(dish => ({
          id: dish.id,
          name: dish.name,
          description: dish.description,
          price: Number(dish.price),
          image: dish.image,
          salesCount: dish.salesCount,
          categoryId: dish.categoryId,
          status: dish.status,
          createdAt: dish.createdAt,
          updatedAt: dish.updatedAt
        }))
      }));

      return {
        success: true,
        data: {
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            image: restaurant.image,
            rating: Number(restaurant.rating),
            distance: Number(restaurant.distance),
            deliveryFee: Number(restaurant.deliveryFee),
            deliveryTime: restaurant.deliveryTime,
            tags: restaurant.tags
          },
          categories: formattedCategories
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'FETCH_MENU_ERROR'
      };
    }
  }

  /**
   * 获取指定分类的菜品
   * @param restaurantId - 餐厅ID
   * @param categoryId - 分类ID
   * @returns {Promise<ServiceResult>}
   */
  async getDishesByCategory(restaurantId: number, categoryId: number): Promise<ServiceResult> {
    try {
      // 验证餐厅是否存在
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        return {
          success: false,
          message: '餐厅不存在',
          code: 'RESTAURANT_NOT_FOUND'
        };
      }

      // 获取分类下的菜品
      const dishes = await this.restaurantModel.getDishesByCategory(categoryId);

      return {
        success: true,
        data: {
          restaurantId,
          categoryId,
          dishes: dishes.map(dish => ({
            id: dish.id,
            name: dish.name,
            description: dish.description,
            price: Number(dish.price),
            image: dish.image,
            salesCount: dish.salesCount,
            categoryId: dish.categoryId,
            categoryName: dish.dishCategories.name,
            status: dish.status,
            createdAt: dish.createdAt,
            updatedAt: dish.updatedAt
          }))
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'FETCH_DISHES_ERROR'
      };
    }
  }

  /**
   * 获取热门餐厅
   * @param limit - 返回数量限制
   * @returns {Promise<ServiceResult>}
   */
  async getPopularRestaurants(limit: string | number = 10): Promise<ServiceResult> {
    try {
      const restaurants = await this.restaurantModel.findMany({
        where: {
          rating: { gte: 4.0 }
        },
        orderBy: {
          rating: 'desc'
        },
        take: Number(limit)
      });

      return {
        success: true,
        data: restaurants
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'FETCH_POPULAR_RESTAURANTS_ERROR'
      };
    }
  }

  /**
   * 获取附近餐厅
   * @param maxDistance - 最大距离（km）
   * @param limit - 返回数量限制
   * @returns {Promise<ServiceResult>}
   */
  async getNearbyRestaurants(maxDistance: string | number = 5, limit: string | number = 10): Promise<ServiceResult> {
    try {
      const restaurants = await this.restaurantModel.findMany({
        where: {
          distance: { lte: Number(maxDistance) }
        },
        orderBy: {
          distance: 'asc'
        },
        take: Number(limit)
      });

      return {
        success: true,
        data: restaurants
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'FETCH_NEARBY_RESTAURANTS_ERROR'
      };
    }
  }

  /**
   * 获取餐厅标签列表
   * @returns {Promise<ServiceResult>}
   */
  async getRestaurantTags(): Promise<ServiceResult> {
    try {
      const tags = await this.restaurantModel.prisma.restaurant_tag_master.findMany({
        where: {
          status: 1
        },
        orderBy: {
          sortOrder: 'asc'
        }
      });

      return {
        success: true,
        data: tags.map(tag => ({
          id: tag.id,
          name: tag.tagName,
          type: tag.tagType,
          color: tag.color,
          icon: tag.icon
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'FETCH_TAGS_ERROR'
      };
    }
  }

  /**
   * 创建餐厅（管理员功能）
   * @param restaurantData - 餐厅数据
   * @returns {Promise<ServiceResult>}
   */
  async createRestaurant(restaurantData: RestaurantData): Promise<ServiceResult> {
    try {
      const restaurant = await this.restaurantModel.create(restaurantData);

      return {
        success: true,
        data: restaurant,
        message: '餐厅创建成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'CREATE_RESTAURANT_ERROR'
      };
    }
  }

  /**
   * 更新餐厅信息（管理员功能）
   * @param id - 餐厅ID
   * @param updateData - 更新数据
   * @returns {Promise<ServiceResult>}
   */
  async updateRestaurant(id: number, updateData: Partial<RestaurantData>): Promise<ServiceResult> {
    try {
      // 验证餐厅是否存在
      const existingRestaurant = await this.restaurantModel.findById(id);
      if (!existingRestaurant) {
        return {
          success: false,
          message: '餐厅不存在',
          code: 'RESTAURANT_NOT_FOUND'
        };
      }

      const restaurant = await this.restaurantModel.update(id, updateData);

      return {
        success: true,
        data: restaurant,
        message: '餐厅信息更新成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'UPDATE_RESTAURANT_ERROR'
      };
    }
  }

  /**
   * 删除餐厅（管理员功能）
   * @param id - 餐厅ID
   * @returns {Promise<ServiceResult>}
   */
  async deleteRestaurant(id: number): Promise<ServiceResult> {
    try {
      // 验证餐厅是否存在
      const existingRestaurant = await this.restaurantModel.findById(id);
      if (!existingRestaurant) {
        return {
          success: false,
          message: '餐厅不存在',
          code: 'RESTAURANT_NOT_FOUND'
        };
      }

      await this.restaurantModel.softDelete(id);

      return {
        success: true,
        message: '餐厅删除成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        code: 'DELETE_RESTAURANT_ERROR'
      };
    }
  }
}

// 导出单例实例
const restaurantService = new RestaurantService();
export default restaurantService;