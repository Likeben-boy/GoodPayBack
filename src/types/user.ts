

/**
 * 用户实体接口
 */
export interface User {
  /** 用户唯一标识ID */
  id: number;
  /** 用户名 */
  username: string;
  //密码
  password?: string;
  /** 手机号码，可选 */
  phone: string | null;
  /** 用户头像URL，可选 */
  avatar?: string | null;
  /** 用户状态 */
  status: boolean;
  /** 创建时间 */
  createdAt?: Date;
  /** 更新时间 */
  updatedAt?: Date;
  /** 软删除时间 */
  deletedAt?: Date | null;
}

/**
 * 创建用户请求参数接口
 */
export interface CreateUserInput {
  /** 用户密码 */
  password: string;
  /** 手机号码 */
  phone: string;
  /** 验证码 */
  authCode: string;
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
  /** 用户密码 */
  password?: string;
  /** 手机号码，可选 */
  phone: string;
//登陆码
  authCode?:string;
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
  /** 用户手机号 */
  phone: string;
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
  postalCode?: string | null | undefined;
  /** 是否为默认地址 */
  isDefault: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 软删除时间 */
  deletedAt?: Date | null;
}

/**
 * 创建地址请求参数接口
 */
export interface CreateAddressInput {
  /** 所属用户ID */
  userId: number;
  /** 收件人姓名 */
  contactName: string;
  /** 收件人手机号码 */
  phone: string;
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
  /** 区县 */
  district: string;
  /** 详细地址 */
  detailAddress: string;
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
  /** 用户信息 */
  user: User;
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
//  刷新令牌过期时间
  refreshExpiresIn: string | number;
}