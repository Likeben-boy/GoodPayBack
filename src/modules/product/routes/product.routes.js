const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { validate } = require('../../middleware/validate');
const { productValidation } = require('../../middleware/validation');

/**
 * 商品路由模块
 * 包含商品查询、搜索、筛选等所有商品相关接口
 */

// 获取商品列表
router.get('/',
  validate(productValidation.getProducts),
  productController.getProducts
);

// 获取商品详情
router.get('/:id',
  validate(productValidation.getProductById),
  productController.getProductById
);

// 搜索商品
router.get('/search',
  validate(productValidation.searchProducts),
  productController.searchProducts
);

// 获取热门商品
router.get('/popular/list',
  productController.getPopularProducts
);

// 获取推荐商品
router.get('/recommended/list',
  productController.getRecommendedProducts
);

// 获取新品上市
router.get('/new/list',
  productController.getNewProducts
);

// 获取商品分类
router.get('/categories/list',
  productController.getCategories
);

// 获取指定分类的商品
router.get('/category/:categoryId',
  validate(productValidation.getProductsByCategory),
  productController.getProductsByCategory
);

// 获取指定餐厅的商品
router.get('/restaurant/:restaurantId',
  validate(productValidation.getProductsByRestaurant),
  productController.getProductsByRestaurant
);

// 获取商品评论
router.get('/:id/reviews',
  validate(productValidation.getProductById),
  productController.getProductReviews
);

// 获取商品规格选项
router.get('/:id/specs',
  validate(productValidation.getProductById),
  productController.getProductSpecs
);

// 获取商品库存信息
router.get('/:id/stock',
  validate(productValidation.getProductById),
  productController.getProductStock
);

module.exports = router;