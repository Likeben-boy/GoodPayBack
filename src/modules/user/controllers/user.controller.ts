import { Request, Response } from 'express';
import userService from '../services/user.service';
import { successResponse, errorResponse } from '../../../utils/response';
import { ApiResponse } from '../../../types';

class UserController {
  /**
   * 用户注册
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.register(req.body);
      successResponse(res, '注册成功', result, 201);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 用户登录
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.login(req.body);
      successResponse(res, '登录成功', result);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 用户登出
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      await userService.logout(req.user!.id);
      successResponse(res, '登出成功');
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 刷新令牌
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.refreshToken(req.body);
      successResponse(res, '令牌刷新成功', result);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 获取用户信息
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.getUserProfile(req.user!.id);
      successResponse(res, '获取用户信息成功', result);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 更新用户信息
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.updateProfile(req.user!.id, req.body);
      successResponse(res, '更新用户信息成功', result);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 修改密码
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      await userService.changePassword(req.user!.id, req.body);
      successResponse(res, '密码修改成功');
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 重置密码
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      await userService.resetPassword(req.body);
      successResponse(res, '密码重置成功');
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 上传头像
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        throw new Error('请上传头像文件');
      }
      const result = await userService.uploadAvatar(req.user!.id, req.file);
      successResponse(res, '头像上传成功', result);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 获取用户地址列表
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getAddresses(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.getUserAddresses(req.user!.id);
      successResponse(res, '获取地址列表成功', result);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 获取用户默认地址
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getDefaultAddress(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.getDefaultAddress(req.user!.id);
      successResponse(res, '获取默认地址成功', result);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 创建用户地址
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async createAddress(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.createAddress(req.user!.id, req.body);
      successResponse(res, '创建地址成功', result, 201);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 更新用户地址
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async updateAddress(req: Request, res: Response): Promise<void> {
    try {
      const result = await userService.updateAddress(req.user!.id, parseInt(req.params.id), req.body);
      successResponse(res, '更新地址成功', result);
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 设置默认地址
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async setDefaultAddress(req: Request, res: Response): Promise<void> {
    try {
      await userService.setDefaultAddress(req.user!.id, parseInt(req.params.id));
      successResponse(res, '设置默认地址成功');
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 删除用户地址
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async deleteAddress(req: Request, res: Response): Promise<void> {
    try {
      await userService.deleteAddress(req.user!.id, parseInt(req.params.id));
      successResponse(res, '删除地址成功');
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }

  /**
   * 批量删除地址
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async batchDeleteAddresses(req: Request, res: Response): Promise<void> {
    try {
      const { addressIds } = req.body;
      await userService.batchDeleteAddresses(req.user!.id, addressIds);
      successResponse(res, '批量删除地址成功');
    } catch (error: any) {
      errorResponse(res, error.message, error.code || 400);
    }
  }
}

// 导出单例实例
const userController = new UserController();
export default userController;