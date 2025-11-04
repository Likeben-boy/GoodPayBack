import { Router } from 'express';
import restaurantController from '../controllers/restaurant.controller';

const router:Router = Router();

//查询所有餐厅
router.get('/', restaurantController.getRestaurants);

//搜索餐厅
router.get('/search', restaurantController.searchRestaurants);

//获取热门餐厅
router.get('/popular', restaurantController.getPopularRestaurants);

//获取附近餐厅
router.get('/nearby', restaurantController.getNearbyRestaurants);

//标签列表
router.get('/tags', restaurantController.getRestaurantTags);

//通过id查询餐厅
router.get('/:id', restaurantController.getRestaurantDetail);

//查询菜单
router.get('/:id/menu', restaurantController.getRestaurantMenu);

//获取制定分类的菜品
router.get('/:restaurantId/categories/:categoryId/dishes', restaurantController.getDishesByCategory);

// 管理员功能路由 (需要添加权限验证中间件)
router.post('/', restaurantController.createRestaurant);

//修改餐厅
router.put('/:id', restaurantController.updateRestaurant);

//删除餐厅
router.delete('/:id', restaurantController.deleteRestaurant);

export default router;