const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const { validate } = require('../../middleware/validate');
const { restaurantValidation } = require('../../middleware/validation');

/**
 * 餐厅路由模块
 * 包含餐厅查询、筛选、详情等所有餐厅相关接口
 */

// 获取餐厅列表
router.get('/',
  validate(restaurantValidation.getRestaurants),
  restaurantController.getRestaurants
);

// 获取餐厅详情
router.get('/:id',
  validate(restaurantValidation.getRestaurantById),
  restaurantController.getRestaurantById
);

// 获取餐厅分类
router.get('/categories/list',
  restaurantController.getCategories
);

// 获取餐厅菜品分类
router.get('/:id/categories',
  validate(restaurantValidation.getRestaurantById),
  restaurantController.getRestaurantCategories
);

// 搜索餐厅
router.get('/search',
  validate(restaurantValidation.searchRestaurants),
  restaurantController.searchRestaurants
);

// 获取热门餐厅
router.get('/popular/list',
  restaurantController.getPopularRestaurants
);

// 获取附近餐厅
router.get('/nearby/list',
  validate(restaurantValidation.getNearbyRestaurants),
  restaurantController.getNearbyRestaurants
);

// 获取餐厅评分和评论
router.get('/:id/reviews',
  validate(restaurantValidation.getRestaurantById),
  restaurantController.getRestaurantReviews
);

// 获取餐厅营业时间
router.get('/:id/business-hours',
  validate(restaurantValidation.getRestaurantById),
  restaurantController.getBusinessHours
);

// 检查餐厅是否营业
router.get('/:id/is-open',
  validate(restaurantValidation.getRestaurantById),
  restaurantController.isRestaurantOpen
);

// 获取餐厅配送信息
router.get('/:id/delivery-info',
  validate(restaurantValidation.getRestaurantById),
  restaurantController.getDeliveryInfo
);

// 获取餐厅活动信息
router.get('/:id/promotions',
  validate(restaurantValidation.getRestaurantById),
  restaurantController.getPromotions
);

module.exports = router;