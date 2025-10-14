// 用户相关类型定义
export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  nickname: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'banned';
  role: 'user' | 'admin' | 'superadmin';
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  status?: string;
}

export interface UpdateUserInput {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface UserLoginInput {
  username: string;
  password: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface Address {
  id: number;
  userId: number;
  recipient: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailedAddress: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressInput {
  recipient: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailedAddress: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  recipient?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  detailedAddress?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface LoginResult {
  userId: number;
  tokens: TokenPair;
  user: Omit<User, 'password'>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}