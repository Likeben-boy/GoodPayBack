import { Router } from 'express';
import restaurantController from '../controllers/restaurant.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 餐厅ID
 *         name:
 *           type: string
 *           description: 餐厅名称
 *         image:
 *           type: string
 *           description: 餐厅图片URL
 *         rating:
 *           type: number
 *           format: decimal
 *           description: 餐厅评分
 *         distance:
 *           type: number
 *           format: decimal
 *           description: 配送距离(公里)
 *         deliveryFee:
 *           type: number
 *           format: decimal
 *           description: 配送费
 *         deliveryTime:
 *           type: integer
 *           description: 配送时间(分钟)
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 餐厅标签
 *         status:
 *           type: integer
 *           description: 状态(1:正常 0:停业)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     Dish:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 菜品ID
 *         name:
 *           type: string
 *           description: 菜品名称
 *         description:
 *           type: string
 *           description: 菜品描述
 *         price:
 *           type: number
 *           format: decimal
 *           description: 菜品价格
 *         image:
 *           type: string
 *           description: 菜品图片URL
 *         salesCount:
 *           type: integer
 *           description: 销量
 *         categoryId:
 *           type: integer
 *           description: 分类ID
 *         status:
 *           type: integer
 *           description: 状态(1:正常 0:下架)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     DishCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 分类ID
 *         name:
 *           type: string
 *           description: 分类名称
 *         sortOrder:
 *           type: integer
 *           description: 排序
 *         dishes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Dish'
 *           description: 分类下的菜品
 */

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: 获取餐厅列表
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, distance, deliveryTime]
 *           default: createdAt
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: 最低评分
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         description: 最大距离(公里)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 标签过滤(多个用逗号分隔)
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取餐厅列表成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     restaurants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Restaurant'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       500:
 *         description: 服务器错误
 */
router.get('/', restaurantController.getRestaurants);

/**
 * @swagger
 * /api/restaurants/search:
 *   get:
 *     summary: 搜索餐厅
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 搜索成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/search', restaurantController.searchRestaurants);

/**
 * @swagger
 * /api/restaurants/popular:
 *   get:
 *     summary: 获取热门餐厅
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 获取成功
 *       500:
 *         description: 服务器错误
 */
router.get('/popular', restaurantController.getPopularRestaurants);

/**
 * @swagger
 * /api/restaurants/nearby:
 *   get:
 *     summary: 获取附近餐厅
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *           default: 5
 *         description: 最大距离(公里)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 获取成功
 *       500:
 *         description: 服务器错误
 */
router.get('/nearby', restaurantController.getNearbyRestaurants);

/**
 * @swagger
 * /api/restaurants/tags:
 *   get:
 *     summary: 获取餐厅标签列表
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取餐厅标签成功
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       color:
 *                         type: string
 *                       icon:
 *                         type: string
 *       500:
 *         description: 服务器错误
 */
router.get('/tags', restaurantController.getRestaurantTags);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: 获取餐厅详情
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 餐厅ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取餐厅详情成功
 *                 data:
 *                   $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: 餐厅不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', restaurantController.getRestaurantDetail);

/**
 * @swagger
 * /api/restaurants/{id}/menu:
 *   get:
 *     summary: 获取餐厅菜单
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 餐厅ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取餐厅菜单成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     restaurant:
 *                       $ref: '#/components/schemas/Restaurant'
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DishCategory'
 *       404:
 *         description: 餐厅不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id/menu', restaurantController.getRestaurantMenu);

/**
 * @swagger
 * /api/restaurants/{restaurantId}/categories/{categoryId}/dishes:
 *   get:
 *     summary: 获取指定分类的菜品
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 餐厅ID
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 分类ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 餐厅或分类不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:restaurantId/categories/:categoryId/dishes', restaurantController.getDishesByCategory);

// 管理员功能路由 (需要添加权限验证中间件)
/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: 创建餐厅 (管理员功能)
 *     tags: [Restaurants Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: 餐厅名称
 *               image:
 *                 type: string
 *                 description: 餐厅图片URL
 *               rating:
 *                 type: number
 *                 description: 评分
 *               distance:
 *                 type: number
 *                 description: 配送距离
 *               deliveryFee:
 *                 type: number
 *                 description: 配送费
 *               deliveryTime:
 *                 type: integer
 *                 description: 配送时间
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post('/', restaurantController.createRestaurant);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   put:
 *     summary: 更新餐厅信息 (管理员功能)
 *     tags: [Restaurants Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 餐厅ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 餐厅名称
 *               image:
 *                 type: string
 *                 description: 餐厅图片URL
 *               rating:
 *                 type: number
 *                 description: 评分
 *               distance:
 *                 type: number
 *                 description: 配送距离
 *               deliveryFee:
 *                 type: number
 *                 description: 配送费
 *               deliveryTime:
 *                 type: integer
 *                 description: 配送时间
 *               status:
 *                 type: integer
 *                 description: 状态
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 餐厅不存在
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', restaurantController.updateRestaurant);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   delete:
 *     summary: 删除餐厅 (管理员功能)
 *     tags: [Restaurants Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 餐厅ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 餐厅不存在
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', restaurantController.deleteRestaurant);

export default router;