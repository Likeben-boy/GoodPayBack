# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个外卖点餐系统的纯后端项目，基于Express.js构建。项目当前处于初始化阶段，包含基础的依赖配置。

## 常用开发命令

### 依赖管理
```bash
# 安装依赖
pnpm install

# 添加依赖
pnpm add <package-name>

# 添加开发依赖
pnpm add -D <package-name>
```

### 项目运行
```bash
# 启动开发服务器
node index.js

# 当前package.json中只有基础测试命令
npm test
```

### 包管理器
项目使用pnpm作为包管理器（版本10.15.1），建议使用pnpm命令而非npm。

## 项目架构规划

根据README.md描述，项目将包含以下核心模块：

### 1. 用户模块 (User Module)
- 用户注册、登录功能
- JWT令牌认证
- 个人信息管理
- 地址管理（CRUD操作）

### 2. 餐馆模块 (Restaurant Module)
- 商户列表查询
- 商户筛选功能
- 商户详情信息

### 3. 菜品模块 (Product Module)
- 商品列表展示
- 商品搜索功能

### 4. 购物车模块 (Cart Module)
- 添加商品到购物车
- 删除购物车商品
- 商品数量调整（增减）

### 5. 订单模块 (Order Module)
- 订单创建
- 订单状态流转（待支付→已支付→待接单→制作中→配送中→已完成）
- 订单取消
- 订单支付
- 订单退款
- 订单查询

### 6. 支付模块 (Payment Module)
- 微信支付/支付宝SDK集成
- 支付参数生成
- 支付回调处理
- 对账定时任务

## 技术栈

- **后端框架**: Express.js 5.1.0
- **数据库**: MySQL（规划中）
- **缓存**: Redis（规划中）
- **认证**: JWT（规划中）
- **包管理器**: pnpm 10.15.1

## 数据库设计考虑

项目需要设计的核心数据表：
- users（用户表）
- addresses（地址表）
- restaurants（餐厅表）
- products（商品表）
- categories（分类表）
- carts（购物车表）
- orders（订单表）
- order_items（订单商品表）
- payments（支付记录表）

## API设计原则

- RESTful API设计
- 统一的响应格式
- 完善的错误处理
- JWT认证中间件
- 请求参数验证
- 接口文档（Swagger/OpenAPI）

## 安全考虑

- 密码加密存储
- JWT令牌安全
- SQL注入防护
- XSS防护
- CSRF防护
- 输入数据验证

## 开发建议

1. **模块化设计**: 按功能模块划分代码结构
2. **中间件复用**: 提取通用中间件（认证、日志、错误处理）
3. **数据库连接池**: 使用连接池管理数据库连接
4. **缓存策略**: 合理使用Redis缓存热点数据
5. **异步处理**: 对于耗时操作使用异步处理
6. **日志记录**: 完善的日志系统便于问题排查
7. **单元测试**: 核心业务逻辑需要单元测试覆盖

## 文件结构建议

```
src/
├── config/          # 配置文件
├── controllers/     # 控制器
├── models/          # 数据模型
├── routes/          # 路由定义
├── middleware/      # 中间件
├── services/        # 业务逻辑层
├── utils/           # 工具函数
├── database/        # 数据库连接和迁移
└── app.js          # 应用入口
```