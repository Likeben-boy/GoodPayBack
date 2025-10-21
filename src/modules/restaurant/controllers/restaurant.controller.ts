import { Request, Response } from 'express';
import restaurantService from '../services/restaurant.service';
import { successResponse, errorResponse } from '../../../utils/response';
import logger, { businessLogger } from '../../../utils/logger';

class RestaurantController {
  /**
   * 获取餐厅列表
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getRestaurants(req: Request, res: Response): Promise<void> {
    try {
      businessLogger.debug('获取餐厅列表', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        queryParams: req.query
      });

      const result = await restaurantService.getRestaurantList(req.query);

      businessLogger.info('获取餐厅列表成功', {
        ip: req.ip,
        total: result.data?.pagination?.total || 0
      });

      successResponse(res, '获取餐厅列表成功', result.data);
    } catch (error: any) {
      logger.error('获取餐厅列表失败', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        queryParams: req.query,
        code: error.code || 'FETCH_RESTAURANTS_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'FETCH_RESTAURANTS_ERROR');
    }
  }

  /**
   * 获取餐厅详情
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getRestaurantDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const restaurantId = parseInt(id);

      if (isNaN(restaurantId)) {
        throw new Error('无效的餐厅ID');
      }

      businessLogger.debug('获取餐厅详情', {
        restaurantId,
        ip: req.ip
      });

      const result = await restaurantService.getRestaurantDetail(restaurantId);

      if (!result.success) {
        const statusCode = result.code === 'RESTAURANT_NOT_FOUND' ? 404 : 400;
        errorResponse(res, result.message, statusCode, result.code);
        return;
      }

      businessLogger.info('获取餐厅详情成功', {
        restaurantId,
        restaurantName: result.data?.name,
        ip: req.ip
      });

      successResponse(res, '获取餐厅详情成功', result.data);
    } catch (error: any) {
      logger.error('获取餐厅详情失败', {
        error: error.message,
        stack: error.stack,
        restaurantId: req.params.id,
        ip: req.ip,
        code: error.code || 'FETCH_RESTAURANT_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'FETCH_RESTAURANT_ERROR');
    }
  }

  /**
   * 搜索餐厅
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async searchRestaurants(req: Request, res: Response): Promise<void> {
    try {
      const { keyword } = req.query;

      if (!keyword) {
        errorResponse(res, '搜索关键词不能为空', 400, 'MISSING_KEYWORD');
        return;
      }

      businessLogger.debug('搜索餐厅', {
        keyword,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const result = await restaurantService.searchRestaurants(keyword as string, req.query);

      if (!result.success) {
        errorResponse(res, result.message, 400, result.code);
        return;
      }

      businessLogger.info('搜索餐厅成功', {
        keyword,
        resultCount: result.data?.restaurants?.length || 0,
        ip: req.ip
      });

      successResponse(res, '搜索餐厅成功', result.data);
    } catch (error: any) {
      logger.error('搜索餐厅失败', {
        error: error.message,
        stack: error.stack,
        keyword: req.query.keyword,
        ip: req.ip,
        code: error.code || 'SEARCH_RESTAURANTS_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'SEARCH_RESTAURANTS_ERROR');
    }
  }

  /**
   * 获取餐厅菜单
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getRestaurantMenu(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const restaurantId = parseInt(id);

      if (isNaN(restaurantId)) {
        throw new Error('无效的餐厅ID');
      }

      businessLogger.debug('获取餐厅菜单', {
        restaurantId,
        ip: req.ip
      });

      const result = await restaurantService.getRestaurantMenu(restaurantId);

      if (!result.success) {
        const statusCode = result.code === 'RESTAURANT_NOT_FOUND' ? 404 : 400;
        errorResponse(res, result.message, statusCode, result.code);
        return;
      }

      businessLogger.info('获取餐厅菜单成功', {
        restaurantId,
        categoryCount: result.data?.categories?.length || 0,
        dishCount: result.data?.categories?.reduce((sum, cat) => sum + (cat.dishes?.length || 0), 0) || 0,
        ip: req.ip
      });

      successResponse(res, '获取餐厅菜单成功', result.data);
    } catch (error: any) {
      logger.error('获取餐厅菜单失败', {
        error: error.message,
        stack: error.stack,
        restaurantId: req.params.id,
        ip: req.ip,
        code: error.code || 'FETCH_MENU_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'FETCH_MENU_ERROR');
    }
  }

  /**
   * 获取指定分类的菜品
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getDishesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, categoryId } = req.params;
      const restaurantIdNum = parseInt(restaurantId);
      const categoryIdNum = parseInt(categoryId);

      if (isNaN(restaurantIdNum) || isNaN(categoryIdNum)) {
        throw new Error('无效的餐厅ID或分类ID');
      }

      businessLogger.debug('获取分类菜品', {
        restaurantId: restaurantIdNum,
        categoryId: categoryIdNum,
        ip: req.ip
      });

      const result = await restaurantService.getDishesByCategory(restaurantIdNum, categoryIdNum);

      if (!result.success) {
        const statusCode = result.code === 'RESTAURANT_NOT_FOUND' ? 404 : 400;
        errorResponse(res, result.message, statusCode, result.code);
        return;
      }

      businessLogger.info('获取分类菜品成功', {
        restaurantId: restaurantIdNum,
        categoryId: categoryIdNum,
        dishCount: result.data?.dishes?.length || 0,
        ip: req.ip
      });

      successResponse(res, '获取菜品列表成功', result.data);
    } catch (error: any) {
      logger.error('获取分类菜品失败', {
        error: error.message,
        stack: error.stack,
        restaurantId: req.params.restaurantId,
        categoryId: req.params.categoryId,
        ip: req.ip,
        code: error.code || 'FETCH_DISHES_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'FETCH_DISHES_ERROR');
    }
  }

  /**
   * 获取热门餐厅
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getPopularRestaurants(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      businessLogger.debug('获取热门餐厅', {
        limit,
        ip: req.ip
      });

      const result = await restaurantService.getPopularRestaurants(limit as string);

      if (!result.success) {
        errorResponse(res, result.message, 400, result.code);
        return;
      }

      businessLogger.info('获取热门餐厅成功', {
        limit,
        resultCount: result.data?.length || 0,
        ip: req.ip
      });

      successResponse(res, '获取热门餐厅成功', result.data);
    } catch (error: any) {
      logger.error('获取热门餐厅失败', {
        error: error.message,
        stack: error.stack,
        limit: req.query.limit,
        ip: req.ip,
        code: error.code || 'FETCH_POPULAR_RESTAURANTS_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'FETCH_POPULAR_RESTAURANTS_ERROR');
    }
  }

  /**
   * 获取附近餐厅
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getNearbyRestaurants(req: Request, res: Response): Promise<void> {
    try {
      const { maxDistance = 5, limit = 10 } = req.query;

      businessLogger.debug('获取附近餐厅', {
        maxDistance,
        limit,
        ip: req.ip
      });

      const result = await restaurantService.getNearbyRestaurants(
        maxDistance as string,
        limit as string
      );

      if (!result.success) {
        errorResponse(res, result.message, 400, result.code);
        return;
      }

      businessLogger.info('获取附近餐厅成功', {
        maxDistance,
        limit,
        resultCount: result.data?.length || 0,
        ip: req.ip
      });

      successResponse(res, '获取附近餐厅成功', result.data);
    } catch (error: any) {
      logger.error('获取附近餐厅失败', {
        error: error.message,
        stack: error.stack,
        maxDistance: req.query.maxDistance,
        limit: req.query.limit,
        ip: req.ip,
        code: error.code || 'FETCH_NEARBY_RESTAURANTS_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'FETCH_NEARBY_RESTAURANTS_ERROR');
    }
  }

  /**
   * 获取餐厅标签列表
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getRestaurantTags(req: Request, res: Response): Promise<void> {
    try {
      businessLogger.debug('获取餐厅标签列表', {
        ip: req.ip
      });

      const result = await restaurantService.getRestaurantTags();

      if (!result.success) {
        errorResponse(res, result.message, 400, result.code);
        return;
      }

      businessLogger.info('获取餐厅标签成功', {
        tagCount: result.data?.length || 0,
        ip: req.ip
      });

      successResponse(res, '获取餐厅标签成功', result.data);
    } catch (error: any) {
      logger.error('获取餐厅标签失败', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        code: error.code || 'FETCH_TAGS_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'FETCH_TAGS_ERROR');
    }
  }

  /**
   * 创建餐厅（管理员功能）
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async createRestaurant(req: Request, res: Response): Promise<void> {
    try {
      businessLogger.info('管理员创建餐厅', {
        restaurantName: req.body.name,
        adminId: req.user?.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const result = await restaurantService.createRestaurant(req.body);

      if (!result.success) {
        errorResponse(res, result.message, 400, result.code);
        return;
      }

      businessLogger.info('创建餐厅成功', {
        restaurantId: result.data?.id,
        restaurantName: result.data?.name,
        adminId: req.user?.userId,
        ip: req.ip
      });

      successResponse(res, result.message, result.data, 201);
    } catch (error: any) {
      logger.error('创建餐厅失败', {
        error: error.message,
        stack: error.stack,
        restaurantData: req.body,
        adminId: req.user?.userId,
        ip: req.ip,
        code: error.code || 'CREATE_RESTAURANT_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'CREATE_RESTAURANT_ERROR');
    }
  }

  /**
   * 更新餐厅信息（管理员功能）
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async updateRestaurant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const restaurantId = parseInt(id);

      if (isNaN(restaurantId)) {
        throw new Error('无效的餐厅ID');
      }

      businessLogger.info('管理员更新餐厅信息', {
        restaurantId,
        updateData: req.body,
        adminId: req.user?.userId,
        ip: req.ip
      });

      const result = await restaurantService.updateRestaurant(restaurantId, req.body);

      if (!result.success) {
        const statusCode = result.code === 'RESTAURANT_NOT_FOUND' ? 404 : 400;
        errorResponse(res, result.message, statusCode, result.code);
        return;
      }

      businessLogger.info('更新餐厅信息成功', {
        restaurantId,
        restaurantName: result.data?.name,
        adminId: req.user?.userId,
        ip: req.ip
      });

      successResponse(res, result.message, result.data);
    } catch (error: any) {
      logger.error('更新餐厅信息失败', {
        error: error.message,
        stack: error.stack,
        restaurantId: req.params.id,
        updateData: req.body,
        adminId: req.user?.userId,
        ip: req.ip,
        code: error.code || 'UPDATE_RESTAURANT_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'UPDATE_RESTAURANT_ERROR');
    }
  }

  /**
   * 删除餐厅（管理员功能）
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async deleteRestaurant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const restaurantId = parseInt(id);

      if (isNaN(restaurantId)) {
        throw new Error('无效的餐厅ID');
      }

      businessLogger.info('管理员删除餐厅', {
        restaurantId,
        adminId: req.user?.userId,
        ip: req.ip
      });

      const result = await restaurantService.deleteRestaurant(restaurantId);

      if (!result.success) {
        const statusCode = result.code === 'RESTAURANT_NOT_FOUND' ? 404 : 400;
        errorResponse(res, result.message, statusCode, result.code);
        return;
      }

      businessLogger.info('删除餐厅成功', {
        restaurantId,
        adminId: req.user?.userId,
        ip: req.ip
      });

      successResponse(res, result.message);
    } catch (error: any) {
      logger.error('删除餐厅失败', {
        error: error.message,
        stack: error.stack,
        restaurantId: req.params.id,
        adminId: req.user?.userId,
        ip: req.ip,
        code: error.code || 'DELETE_RESTAURANT_ERROR'
      });
      errorResponse(res, error.message, 400, error.code || 'DELETE_RESTAURANT_ERROR');
    }
  }
}

// 导出单例实例
const restaurantController = new RestaurantController();
export default restaurantController;