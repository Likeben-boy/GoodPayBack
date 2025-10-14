// 用户相关类型定义

/**
 * 用户实体接口
 */
export interface User {
  /** 用户唯一标识ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 用户邮箱，可选 */
  email?: string;
  /** 手机号码，可选 */
  phone?: string;
  /** 用户昵称 */
  nickname: string;
  /** 用户头像URL，可选 */
  avatar?: string;
  /** 用户状态：激活、未激活、被禁用 */
  status: 'active' | 'inactive' | 'banned';
  /** 用户角色：普通用户、管理员、超级管理员 */
  role: 'user' | 'admin' | 'superadmin';
  /** 最后登录时间，可选 */
  lastLoginAt?: Date;
  /** 最后登录IP地址，可选 */
  lastLoginIp?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 创建用户请求参数接口
 */
export interface CreateUserInput {
  /** 用户名 */
  username: string;
  /** 用户密码 */
  password: string;
  /** 用户邮箱，可选 */
  email?: string;
  /** 手机号码，可选 */
  phone?: string;
  /** 用户昵称，可选 */
  nickname?: string;
  /** 用户头像URL，可选 */
  avatar?: string;
  /** 用户状态，可选 */
  status?: string;
}

/**
 * 更新用户信息请求参数接口
 */
export interface UpdateUserInput {
  /** 用户昵称，可选 */
  nickname?: string;
  /** 用户邮箱，可选 */
  email?: string;
  /** 手机号码，可选 */
  phone?: string;
  /** 用户头像URL，可选 */
  avatar?: string;
}

/**
 * 用户登录请求参数接口
 */
export interface UserLoginInput {
  /** 用户名 */
  username: string;
  /** 用户密码 */
  password: string;
  /** 用户邮箱，可选 */
  email?: string;
  /** 手机号码，可选 */
  phone?: string;
}

/**
 * 修改密码请求参数接口
 */
export interface ChangePasswordInput {
  /** 原密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
}

/**
 * 重置密码请求参数接口
 */
export interface ResetPasswordInput {
  /** 用户邮箱 */
  email: string;
  /** 验证码 */
  code: string;
  /** 新密码 */
  newPassword: string;
}

/**
 * 用户地址实体接口
 */
export interface Address {
  /** 地址唯一标识ID */
  id: number;
  /** 所属用户ID */
  userId: number;
  /** 收件人姓名 */
  recipient: string;
  /** 收件人手机号码 */
  phone: string;
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
  /** 区县 */
  district: string;
  /** 详细地址 */
  detailedAddress: string;
  /** 邮政编码，可选 */
  postalCode?: string;
  /** 是否为默认地址 */
  isDefault: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 创建地址请求参数接口
 */
export interface CreateAddressInput {
  /** 收件人姓名 */
  recipient: string;
  /** 收件人手机号码 */
  phone: string;
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
  /** 区县 */
  district: string;
  /** 详细地址 */
  detailedAddress: string;
  /** 邮政编码，可选 */
  postalCode?: string;
  /** 是否设为默认地址，可选 */
  isDefault?: boolean;
}

/**
 * 更新地址请求参数接口
 */
export interface UpdateAddressInput {
  /** 收件人姓名，可选 */
  recipient?: string;
  /** 收件人手机号码，可选 */
  phone?: string;
  /** 省份，可选 */
  province?: string;
  /** 城市，可选 */
  city?: string;
  /** 区县，可选 */
  district?: string;
  /** 详细地址，可选 */
  detailedAddress?: string;
  /** 邮政编码，可选 */
  postalCode?: string;
  /** 是否设为默认地址，可选 */
  isDefault?: boolean;
}

/**
 * 用户登录结果接口
 */
export interface LoginResult {
  /** 用户ID */
  userId: number;
  /** JWT令牌对 */
  tokens: TokenPair;
  /** 用户信息（不包含密码） */
  user: Omit<User, 'password'>;
}

/**
 * JWT令牌对接口
 */
export interface TokenPair {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌过期时间 */
  expiresIn: string | number;
}