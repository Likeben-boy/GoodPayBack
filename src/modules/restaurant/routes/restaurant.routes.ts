import { Router } from 'express';
import restaurantController from '../controllers/restaurant.controller';
import { validate } from '../../../middleware/validation';
import { restaurantValidation } from '../../../middleware/validation/schemas';

const router: Router = Router();

/**
 * 餐厅路由模块
 * 包含餐厅查询、搜索、菜单管理等所有餐厅相关接口
 *
 * 路由说明：
 * GET /            - 获取餐厅列表（支持搜索、分页、排序、筛选）
 * GET /popular     - 获取热门餐厅
 * GET /tags        - 获取餐厅标签列表
 * GET /:id         - 获取餐厅详情
 * GET /:id/menu    - 获取餐厅菜单
 * GET /dishes      - 获取指定分类的菜品
 */

// 获取餐厅列表（支持搜索功能）
// 支持 keyword 参数进行搜索，支持分页、排序、筛选等功能
router.get('/',
  validate(restaurantValidation.getRestaurants),
  restaurantController.getRestaurants
);

// 获取餐厅标签列表
router.get('/tags',
  validate(restaurantValidation.getRestaurantTags),
  restaurantController.getRestaurantTags
);

// 通过ID查询餐厅详情 (获取单一资源，使用路径参数是标准的 RESTful 设计)
router.get('/id',
  validate(restaurantValidation.getRestaurantDetail),
  restaurantController.getRestaurantDetail
);

// 查询餐厅菜单 (菜单是餐厅的子资源，使用路径参数是合理的)
router.get('/menu',
  validate(restaurantValidation.getRestaurantMenu),
  restaurantController.getRestaurantMenu
);

// 获取指定分类的菜品 (使用查询参数，符合 RESTful GET 请求设计)
router.get('/dishes',
  validate(restaurantValidation.getDishesByCategory),
  restaurantController.getDishesByCategory
);


export default router;