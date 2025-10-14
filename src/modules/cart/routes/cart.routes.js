const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validate } = require('../../middleware/validate');
const { cartValidation } = require('../../middleware/validation');

/**
 * 购物车路由模块
 * 包含购物车增删改查等所有购物车相关接口
 * 所有接口都需要用户登录
 */

// 获取购物车列表
router.get('/',
  cartController.getCart
);

// 添加商品到购物车
router.post('/add',
  validate(cartValidation.addToCart),
  cartController.addToCart
);

// 更新购物车商品数量
router.put('/items/:id',
  validate(cartValidation.updateCartItem),
  cartController.updateCartItem
);

// 删除购物车商品
router.delete('/items/:id',
  cartController.removeCartItem
);

// 清空购物车
router.delete('/clear',
  cartController.clearCart
);

// 批量删除购物车商品
router.delete('/batch',
  validate(cartValidation.batchRemoveCartItems),
  cartController.batchRemoveCartItems
);

// 选择/取消选择购物车商品
router.put('/items/:id/select',
  validate(cartValidation.selectCartItem),
  cartController.selectCartItem
);

// 全选/取消全选购物车商品
router.put('/select-all',
  validate(cartValidation.selectAllCartItems),
  cartController.selectAllCartItems
);

// 获取购物车商品数量
router.get('/count',
  cartController.getCartCount
);

// 获取购物车选中商品总价
router.get('/selected-total',
  cartController.getSelectedTotal
);

// 获取购物车商品推荐
router.get('/recommendations',
  cartController.getCartRecommendations
);

// 合并购物车（用于用户登录后合并游客购物车）
router.post('/merge',
  validate(cartValidation.mergeCart),
  cartController.mergeCart
);

module.exports = router;