import { Request, Response } from 'express';
import restaurantService from '../services/restaurant.service';
import { successResponse, errorResponse } from '../../../utils/response';
import { HttpCode } from '../../../types';
import { RestaurantTagTagType,QueryParams } from '../models/restaurant';
import logger, { businessLogger } from '../../../utils/logger';

class RestaurantController {
  /**
   * 获取餐厅列表（支持搜索功能）
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getRestaurants(req: Request, res: Response): Promise<void> {
    try {
      const keyword = req.query.keyword as string;
      const isSearch = !!keyword;

      businessLogger.debug(isSearch ? '搜索餐厅' : '获取餐厅列表', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        queryParams: req.query,
        keyword
      });

      // Convert query parameters to proper QueryParams format
      const queryParams: QueryParams = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        keyword,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as string,
        tags: req.query.tags as string | string[]
      };

      // Add minRating only if it's provided
      if (req.query.minRating) {
        queryParams.minRating = Number(req.query.minRating);
      }

      const result = await restaurantService.getRestaurantList(queryParams);

      businessLogger.info(isSearch ? '搜索餐厅成功' : '获取餐厅列表成功', {
        ip: req.ip,
        keyword,
        total: result.pagination?.total || 0,
        resultCount: result.data?.length || 0
      });

      successResponse(res, isSearch ? '搜索餐厅成功' : '获取餐厅列表成功', result);
    } catch (error: any) {
      logger.error('获取餐厅列表失败', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        queryParams: req.query,
        code: error.code || 'FETCH_RESTAURANTS_ERROR'
      });
      errorResponse(res, error.message, 500, HttpCode.INTERNAL_ERROR);
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

      if (!id) {
        throw new Error('餐厅ID不能为空');
      }

      const restaurantId = parseInt(id);

      if (isNaN(restaurantId)) {
        throw new Error('无效的餐厅ID');
      }

      businessLogger.debug('获取餐厅详情', {
        restaurantId,
        ip: req.ip
      });

      const restaurant = await restaurantService.getRestaurantDetail(restaurantId);

      businessLogger.info('获取餐厅详情成功', {
        restaurantId,
        restaurantName: restaurant?.name,
        ip: req.ip
      });

      successResponse(res, '获取餐厅详情成功', restaurant);
    } catch (error: any) {
      logger.error('获取餐厅详情失败', {
        error: error.message,
        stack: error.stack,
        restaurantId: req.params.id,
        ip: req.ip,
        code: error.code || 'FETCH_RESTAURANT_ERROR'
      });

      const statusCode = error.message === '餐厅不存在' ? 404 : 500;
      const errorCode = error.message === '餐厅不存在' ? HttpCode.NOT_FOUND : HttpCode.INTERNAL_ERROR;
      errorResponse(res, error.message, statusCode, errorCode);
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

      if (!id) {
        throw new Error('餐厅ID不能为空');
      }

      const restaurantId = parseInt(id);

      if (isNaN(restaurantId)) {
        throw new Error('无效的餐厅ID');
      }

      businessLogger.debug('获取餐厅菜单', {
        restaurantId,
        ip: req.ip
      });

      const result = await restaurantService.getRestaurantMenu(restaurantId);

      const dishCount = result.categories?.reduce((sum, cat) => sum + (cat.dishes?.length || 0), 0) || 0;

      businessLogger.info('获取餐厅菜单成功', {
        restaurantId,
        categoryCount: result.categories?.length || 0,
        dishCount,
        ip: req.ip
      });

      successResponse(res, '获取餐厅菜单成功', result);
    } catch (error: any) {
      logger.error('获取餐厅菜单失败', {
        error: error.message,
        stack: error.stack,
        restaurantId: req.params.id,
        ip: req.ip,
        code: error.code || 'FETCH_MENU_ERROR'
      });

      const statusCode = error.message === '餐厅不存在' ? 404 : 500;
      const errorCode = error.message === '餐厅不存在' ? HttpCode.NOT_FOUND : HttpCode.INTERNAL_ERROR;
      errorResponse(res, error.message, statusCode, errorCode);
    }
  }

  /**
   * 获取指定分类的菜品
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getDishesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { restaurantId, categoryId } = req.query;
      const restaurantIdNum = parseInt(restaurantId as string);
      const categoryIdNum = parseInt(categoryId as string);

      if (isNaN(restaurantIdNum) || isNaN(categoryIdNum)) {
        throw new Error('无效的餐厅ID或分类ID');
      }

      businessLogger.debug('获取分类菜品', {
        restaurantId: restaurantIdNum,
        categoryId: categoryIdNum,
        ip: req.ip
      });

      const result = await restaurantService.getDishesByCategory(restaurantIdNum, categoryIdNum);

      businessLogger.info('获取分类菜品成功', {
        restaurantId: restaurantIdNum,
        categoryId: categoryIdNum,
        dishCount: result.dishes?.length || 0,
        ip: req.ip
      });

      successResponse(res, '获取菜品列表成功', result);
    } catch (error: any) {
      logger.error('获取分类菜品失败', {
        error: error.message,
        stack: error.stack,
        restaurantId: req.query.restaurantId,
        categoryId: req.query.categoryId,
        ip: req.ip,
        code: error.code || 'FETCH_DISHES_ERROR'
      });

      const statusCode = error.message === '餐厅不存在' ? 404 : 500;
      const errorCode = error.message === '餐厅不存在' ? HttpCode.NOT_FOUND : HttpCode.INTERNAL_ERROR;
      errorResponse(res, error.message, statusCode, errorCode);
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

      const restaurants = await restaurantService.getPopularRestaurants(limit as string);

      businessLogger.info('获取热门餐厅成功', {
        limit,
        resultCount: restaurants?.length || 0,
        ip: req.ip
      });

      successResponse(res, '获取热门餐厅成功', restaurants);
    } catch (error: any) {
      logger.error('获取热门餐厅失败', {
        error: error.message,
        stack: error.stack,
        limit: req.query.limit,
        ip: req.ip,
        code: error.code || 'FETCH_POPULAR_RESTAURANTS_ERROR'
      });
      errorResponse(res, error.message, 500, HttpCode.INTERNAL_ERROR);
    }
  }

  /**
   * 获取餐厅标签列表
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getRestaurantTags(req: Request, res: Response): Promise<void> {
    try {
      const { tagType } = req.query;

      businessLogger.debug('获取餐厅标签列表', {
        tagType,
        ip: req.ip
      });

      // Validate tagType if provided
      let validatedTagType: RestaurantTagTagType | undefined;
      if (tagType) {
        const validTagTypes = Object.values(RestaurantTagTagType);
        if (!validTagTypes.includes(tagType as RestaurantTagTagType)) {
          errorResponse(res, `无效的标签类型: ${tagType}。支持的类型: ${validTagTypes.join(', ')}`, 400, HttpCode.VALIDATION_ERROR);
          return;
        }
        validatedTagType = tagType as RestaurantTagTagType;
      }

      const tags = await restaurantService.getRestaurantTags(validatedTagType);

      businessLogger.info('获取餐厅标签成功', {
        tagType,
        tagCount: tags?.length || 0,
        ip: req.ip
      });

      successResponse(res, '获取餐厅标签成功', tags);
    } catch (error: any) {
      logger.error('获取餐厅标签失败', {
        error: error.message,
        stack: error.stack,
        tagType: req.query.tagType,
        ip: req.ip,
        code: error.code || 'FETCH_TAGS_ERROR'
      });

      const statusCode = error.message.includes('无效的标签类型') ? 400 : 500;
      const errorCode = error.message.includes('无效的标签类型') ? HttpCode.VALIDATION_ERROR : HttpCode.INTERNAL_ERROR;
      errorResponse(res, error.message, statusCode, errorCode);
    }
}}

// 导出单例实例
const restaurantController = new RestaurantController();
export default restaurantController;