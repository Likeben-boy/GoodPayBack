# GoodPayBack - 外卖点餐系统后端API

基于Express.js和TypeScript构建的现代化外卖点餐系统后端服务，使用Prisma作为ORM，支持MySQL数据库。

## 🚀 技术栈

### 核心技术
- **Node.js** - JavaScript运行时
- **Express.js 5.1.0** - Web框架
- **TypeScript** - 类型安全的JavaScript
- **Prisma** - 现代化的ORM工具
- **MySQL 8.0+** - 关系型数据库

### 中间件与工具
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **Helmet** - 安全头部
- **CORS** - 跨域资源共享
- **Morgan** - 请求日志
- **Winston** - 日志管理
- **Multer** - 文件上传
- **Express-rate-limit** - 接口限流
- **Express-validator** - 参数验证

### 开发工具
- **tsx** - TypeScript执行器
- **pnpm** - 包管理器
- **PM2** - 生产环境进程管理

## 📁 项目结构

```
GoodPayBack/
├── src/                          # 源代码目录
│   ├── config/                   # 配置文件
│   │   └── index.ts             # 应用配置
│   ├── database/                 # 数据库相关
│   │   ├── prisma.ts            # Prisma客户端
│   │   └── prisma_example.ts    # Prisma使用示例
│   ├── middleware/               # 中间件
│   │   ├── auth.ts              # JWT认证中间件
│   │   ├── errorHandler.ts      # 错误处理中间件
│   │   ├── rateLimiter.ts       # 限流中间件
│   │   ├── validation/          # 参数验证中间件
│   │   │   ├── index.ts         # 验证中间件入口
│   │   │   └── schemas.ts       # 验证模式定义
│   ├── modules/                  # 业务模块
│   │   ├── user/                # 用户模块
│   │   │   ├── controllers/     # 用户控制器
│   │   │   ├── services/        # 用户服务层
│   │   │   ├── models/          # 用户模型
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── address.model.ts
│   │   │   └── routes/          # 用户路由
│   │   ├── restaurant/          # 餐厅模块
│   │   │   ├── controllers/     # 餐厅控制器
│   │   │   ├── services/        # 餐厅服务层
│   │   │   ├── models/          # 餐厅模型
│   │   │   │   ├── restaurant.model.ts
│   │   │   │   └── restaurant.ts
│   │   │   └── routes/          # 餐厅路由
│   │   ├── order/               # 订单模块
│   │   │   ├── controllers/     # 订单控制器
│   │   │   ├── services/        # 订单服务层
│   │   │   ├── models/          # 订单模型
│   │   │   │   ├── order.model.ts
│   │   │   │   └── order.ts
│   │   │   └── routes/          # 订单路由
│   │   ├── cart/                # 购物车模块（规划中）
│   │   └── payment/             # 支付模块（规划中）
│   ├── types/                    # TypeScript类型定义
│   │   ├── index.ts             # 通用类型
│   │   ├── payment.ts           # 支付相关类型
│   │   └── product.ts           # 商品相关类型
│   ├── utils/                    # 工具函数
│   │   ├── response.ts          # 响应格式化
│   │   ├── jwt.ts               # JWT令牌工具
│   │   ├── logger.ts            # 日志工具
│   │   ├── notification.ts      # 通知工具
│   │   ├── memoryCache.ts       # 内存缓存工具
│   │   └── index.ts             # 工具函数入口
│   ├── migrations/               # 数据库迁移文件
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_create_restaurants_table.sql
│   │   ├── 003_create_products_table.sql
│   │   ├── 004_create_cart_orders_tables.sql
│   │   └── 005_create_payments_tables.sql
│   └── app.ts                    # Express应用配置
├── .env.example                  # 环境变量模板
├── .gitignore                    # Git忽略文件
├── ecosystem.config.js           # PM2配置文件
├── tsconfig.json                 # TypeScript配置
├── package.json                  # 项目依赖
├── index.ts                      # 应用入口
└── README.md                     # 项目说明
```

## 🛠️ 开发指南

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- pnpm >= 10.15.1
- Prisma CLI (自动安装)

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/goodpayback"

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 前端地址
FRONTEND_URL=http://localhost:3000
```

### 数据库设置

1. 创建数据库：
```sql
CREATE DATABASE goodpayback CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 生成Prisma客户端：
```bash
pnpm prisma:generate
```

3. 运行数据库迁移（自动创建所有表结构）：
```bash
# 首次部署或重置数据库
pnpm prisma:migrate dev --name init

# 或在生产环境中
pnpm prisma:migrate deploy
```

4. 可选：打开Prisma Studio查看数据库：
```bash
pnpm prisma:studio
```

> 💡 **提示**: 项目使用Prisma ORM管理数据库，所有表结构都会根据`prisma/schema.prisma`文件自动生成，无需手动执行SQL文件。

### 开发命令

```bash
# 启动开发服务器（热重载）
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 使用PM2部署到生产环境
pnpm prod

# 类型检查
pnpm type-check

# 清理构建文件
pnpm clean

# Prisma相关命令
pnpm prisma:generate     # 生成Prisma客户端
pnpm prisma:migrate dev  # 运行开发环境数据库迁移
pnpm prisma:migrate deploy # 运行生产环境数据库迁移
pnpm prisma:studio       # 打开Prisma Studio（数据库可视化工具）
pnpm prisma:pull         # 从数据库拉取模式（同步schema）
pnpm prisma:reset        # 重置数据库（删除所有数据并重新迁移）
pnpm prisma:db push      # 将schema推送到数据库（不创建迁移文件）
```

## 📚 API文档

### 🔐 认证相关

- `POST /api/v1/users/register` - 用户注册（带限流保护）
- `POST /api/v1/users/login` - 用户登录（带限流保护）
- `POST /api/v1/users/logout` - 用户登出（需要认证）
- `POST /api/v1/users/refresh-token` - 刷新JWT令牌
- `POST /api/v1/users/reset-password` - 重置密码（带限流保护）

### 👤 用户管理（需要认证）

- `GET /api/v1/users/profile` - 获取用户信息
- `PUT /api/v1/users/profile` - 更新用户信息
- `PUT /api/v1/users/password` - 修改密码

### 📍 地址管理（需要认证）

- `GET /api/v1/users/addresses` - 获取用户地址列表
- `GET /api/v1/users/addresses/default` - 获取用户默认地址
- `POST /api/v1/users/addresses` - 添加用户地址
- `PUT /api/v1/users/addresses/:id` - 更新用户地址
- `PUT /api/v1/users/addresses/:id/default` - 设置默认地址
- `DELETE /api/v1/users/addresses/:id` - 删除用户地址
- `DELETE /api/v1/users/addresses` - 批量删除用户地址

### 🍽️ 餐厅管理（无需认证）

- `GET /api/v1/restaurants` - 获取餐厅列表（支持搜索、分页、排序、筛选）
- `GET /api/v1/restaurants/tags` - 获取餐厅标签列表
- `GET /api/v1/restaurants/id` - 获取餐厅详情（注意：使用查询参数而非路径参数）
- `GET /api/v1/restaurants/menu` - 获取餐厅菜单
- `GET /api/v1/restaurants/dishes` - 获取指定分类的菜品

### 📋 订单管理（需要认证）

#### 订单操作
- `POST /api/v1/orders/create` - 创建订单
- `POST /api/v1/orders/pay` - 订单支付
- `POST /api/v1/orders/refund` - 订单退款
- `POST /api/v1/orders/cancel` - 取消订单
- `POST /api/v1/orders/changeStatus` - 改变订单状态（模拟商家接单、骑手配送等）
- `POST /api/v1/orders/confirm` - 确认收货

#### 订单查询
- `GET /api/v1/orders` - 获取订单列表（支持分页和状态筛选）
- `GET /api/v1/orders/detail` - 获取订单详情
- `GET /api/v1/orders/delivery` - 获取订单配送信息

#### 订单统计
- `GET /api/v1/orders/statistics/overview` - 获取用户订单统计信息
- `GET /api/v1/orders/statistics/status-count` - 获取订单状态数量统计
- `GET /api/v1/orders/statistics/history` - 获取用户订单历史（按时间统计）

#### 订单评价
- `POST /api/v1/orders/review` - 评价订单
- `GET /api/v1/orders/reviews` - 获取订单评价列表

### 支付模块（已集成在订单模块中）

支付功能已集成在订单模块中，通过以下接口实现：
- `POST /api/v1/orders/pay` - 处理支付请求
- `POST /api/v1/orders/refund` - 处理退款请求

### 健康检查

- `GET /health` - 服务器健康状态

## 🔒 安全特性

- JWT令牌认证
- 密码bcrypt加密存储
- 接口限流保护
- 请求参数验证
- SQL注入防护（Prisma ORM）
- XSS防护（Helmet中间件）
- CORS跨域保护
- 请求日志记录

## 🏗️ 架构设计

### 分层架构

1. **控制层 (Controllers)** - 处理HTTP请求和响应
2. **服务层 (Services)** - 业务逻辑处理
3. **数据访问层 (Models)** - 数据库操作（Prisma）
4. **中间件层 (Middleware)** - 通用功能处理

### 设计原则

- **模块化设计** - 按功能模块划分代码结构
- **依赖注入** - 通过接口降低模块间耦合
- **类型安全** - 利用TypeScript提供编译时检查
- **错误处理** - 统一的错误处理机制
- **日志系统** - 完善的请求和业务日志

## 🔧 特性功能

### 已实现功能
- ✅ 用户注册、登录、JWT认证
- ✅ 用户信息管理和地址管理
- ✅ 餐厅列表和详情查询
- ✅ 订单创建、查询、状态更新
- ✅ 全面的错误处理和日志记录
- ✅ 参数验证和安全防护
- ✅ 数据库迁移脚本

### 开发中功能
- 🚧 购物车管理
- 🚧 支付集成
- 🚧 商品搜索和筛选
- 🚧 订单退款功能

### 规划功能
- 📋 实时通知系统
- 📋 数据统计分析
- 📋 第三方登录集成
- 📋 文件上传服务

## 📦 部署

### 开发环境部署

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
pnpm dev
```

### 生产环境部署

1. 构建应用：
```bash
pnpm build
```

2. 使用PM2启动：
```bash
pnpm prod
# 或者
pm2 start ecosystem.config.js
```

3. 查看PM2状态：
```bash
pm2 status
pm2 logs goodpayback
```

### Docker部署

#### 1. 快速开始（使用外部数据库）

```bash
# 构建 Docker 镜像
docker build -t goodpayback-api .

# 运行容器（后台运行）
docker run -d \
  --name goodpayback-api \
  -p 3000:3000 \
  --restart unless-stopped \
  goodpayback-api
```

> ⚠️ **重要提示**: 不使用 `--env-file .env` 参数，因为应用会自动读取容器内的 `.env` 文件。确保 `.env` 文件已正确配置并包含 `DATABASE_URL` 等必要的环境变量。

#### 2. 镜像导出与导入（离线部署）

如果你需要在没有网络连接的服务器上部署，可以使用以下方法导出和导入镜像：

**导出镜像（在本地机器）：**

```bash
# 导出镜像到文件
docker save -o goodpayback-api.tar goodpayback-api

# 或者使用 gzip 压缩（文件更小）
docker save goodpayback-api | gzip > goodpayback-api.tar.gz

# 传输到服务器
scp goodpayback-api.tar.gz username@server-ip:/path/on/server/
```

**导入镜像（在服务器）：**

```bash
# 导入镜像（如果压缩了，先解压）
gunzip -c goodpayback-api.tar.gz | docker load

# 或者如果未压缩：
docker load -i goodpayback-api.tar

# 验证镜像是否导入成功
docker images | grep goodpayback-api

# 运行容器
docker run -d \
  --name goodpayback-api \
  -p 3000:3000 \
  --restart unless-stopped \
  goodpayback-api
```

#### 3. 使用 Docker Compose（包含数据库）

```bash
# 启动所有服务（应用 + MySQL + Redis）
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止所有服务
docker-compose down
```

#### 4. 容器管理命令

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs -f goodpayback-api

# 进入容器内部
docker exec -it goodpayback-api sh

# 停止容器
docker stop goodpayback-api

# 启动容器
docker start goodpayback-api

# 重启容器
docker restart goodpayback-api

# 删除容器
docker rm goodpayback-api

# 删除镜像
docker rmi goodpayback-api
```

#### 5. 数据库迁移

```bash
# 进入应用容器
docker exec -it goodpayback-api sh

# 运行数据库迁移
npx prisma migrate deploy

# 查看数据库状态
npx prisma db pull
```

#### 6. 环境配置

- **开发环境**: 使用 `.env.dev` 文件
- **生产环境**: 使用 `.env` 文件
- **Docker**: 自动读取 `.env` 文件中的配置

确保 `.env` 文件包含正确的数据库连接信息：

```bash
DATABASE_URL="mysql://username:password@your-db-server:3306/goodpayback"
NODE_ENV=production
PORT=3000
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范

- 遵循TypeScript最佳实践
- 使用ESLint和Prettier格式化代码
- 编写清晰的注释和文档
- 确保所有API都有适当的错误处理
- 遵循RESTful API设计原则

## 📄 许可证

本项目采用 ISC 许可证

## 📞 项目状态

**当前版本**: 1.0.0
**开发状态**: 里程碑阶段 - 核心业务功能已实现
**最后更新**: 2025年1月

### 已完成模块
- 用户模块：注册、登录、信息管理
- 餐厅模块：列表查询、详情展示
- 订单模块：创建、查询、状态管理

### 进行中的工作
- 支付模块集成
- 前后端联调优化

---

**GoodPayBack** - 让点餐更简单！ 🍔🍕🥘