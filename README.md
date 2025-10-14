# GoodPayBack - 外卖点餐系统后端API

基于Express.js和TypeScript构建的现代化外卖点餐系统后端服务。

## 🚀 技术栈

- **Node.js** - JavaScript运行时
- **Express.js** - Web框架
- **TypeScript** - 类型安全的JavaScript
- **MySQL** - 关系型数据库
- **Redis** - 缓存和限流
- **JWT** - 身份认证
- **Winston** - 日志管理
- **Multer** - 文件上传

## 📁 项目结构

```
GoodPayBack/
├── src/                     # 源代码目录
│   ├── types/              # TypeScript类型定义
│   │   ├── index.ts        # 通用类型
│   │   ├── user.ts         # 用户相关类型
│   │   ├── restaurant.ts   # 餐厅相关类型
│   │   ├── product.ts      # 商品相关类型
│   │   ├── cart.ts         # 购物车相关类型
│   │   ├── order.ts        # 订单相关类型
│   │   └── payment.ts      # 支付相关类型
│   ├── config/             # 配置文件
│   │   └── index.ts        # 应用配置
│   ├── database/           # 数据库相关
│   │   └── connection.ts   # 数据库连接和工具
│   ├── middleware/         # 中间件
│   │   ├── auth.ts         # JWT认证中间件
│   │   ├── errorHandler.ts # 错误处理中间件
│   │   ├── rateLimiter.ts  # 限流中间件
│   │   ├── upload.ts       # 文件上传中间件
│   │   └── validation/     # 参数验证中间件
│   ├── utils/              # 工具函数
│   │   ├── response.ts     # 响应格式化
│   │   ├── jwt.ts          # JWT令牌工具
│   │   ├── logger.ts       # 日志工具
│   │   └── notification.ts # 通知工具
│   ├── modules/            # 业务模块
│   │   ├── user/           # 用户模块
│   │   ├── restaurant/     # 餐厅模块
│   │   ├── product/        # 商品模块
│   │   ├── cart/           # 购物车模块
│   │   ├── order/          # 订单模块
│   │   └── payment/        # 支付模块
│   └── app.ts              # Express应用配置
├── src/migrations/         # 数据库迁移文件
├── .env.example            # 环境变量模板
├── .gitignore              # Git忽略文件
├── tsconfig.json           # TypeScript配置
├── package.json            # 项目依赖
├── index.ts                # 应用入口
└── README.md               # 项目说明
```

## 🛠️ 开发指南

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0
- pnpm >= 8.0.0

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
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=goodpayback

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### 数据库设置

1. 创建数据库：
```sql
CREATE DATABASE goodpayback CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 运行迁移文件：
```bash
# 按顺序执行迁移文件
mysql -u root -p goodpayback < src/migrations/001_create_users_table.sql
mysql -u root -p goodpayback < src/migrations/002_create_restaurants_table.sql
mysql -u root -p goodpayback < src/migrations/003_create_products_table.sql
mysql -u root -p goodpayback < src/migrations/004_create_cart_orders_tables.sql
mysql -u root -p goodpayback < src/migrations/005_create_payments_tables.sql
```

### 开发命令

```bash
# 启动开发服务器（热重载）
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 类型检查
pnpm type-check

# 清理构建文件
pnpm clean
```

## 📚 API文档

### 认证相关

- `POST /api/v1/users/register` - 用户注册
- `POST /api/v1/users/login` - 用户登录
- `POST /api/v1/users/logout` - 用户登出
- `POST /api/v1/users/refresh-token` - 刷新令牌

### 用户管理

- `GET /api/v1/users/profile` - 获取用户信息
- `PUT /api/v1/users/profile` - 更新用户信息
- `PUT /api/v1/users/password` - 修改密码
- `POST /api/v1/users/avatar` - 上传头像

### 地址管理

- `GET /api/v1/users/addresses` - 获取地址列表
- `POST /api/v1/users/addresses` - 创建地址
- `PUT /api/v1/users/addresses/:id` - 更新地址
- `DELETE /api/v1/users/addresses/:id` - 删除地址

### 健康检查

- `GET /health` - 服务器健康状态

## 🔒 安全特性

- JWT令牌认证
- 密码加密存储
- 接口限流保护
- 请求参数验证
- SQL注入防护
- XSS防护

## 🏗️ 架构设计

### 分层架构

1. **控制层 (Controllers)** - 处理HTTP请求和响应
2. **服务层 (Services)** - 业务逻辑处理
3. **数据访问层 (Models)** - 数据库操作
4. **中间件层 (Middleware)** - 通用功能处理

### 设计原则

- **单一职责** - 每个模块只负责一个功能
- **依赖注入** - 通过接口降低模块间耦合
- **类型安全** - 利用TypeScript提供编译时检查
- **错误处理** - 统一的错误处理机制

## 🧪 测试

```bash
# 运行测试
pnpm test

# 运行测试覆盖率
pnpm run test:coverage
```

## 📦 部署

### Docker部署

```bash
# 构建镜像
docker build -t goodpayback-api .

# 运行容器
docker run -p 3000:3000 goodpayback-api
```

### 生产部署

1. 构建应用：
```bash
pnpm build
```

2. 使用PM2启动：
```bash
pm2 start ecosystem.config.js
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 邮箱: your-email@example.com
- GitHub Issues: [项目Issues页面]

---

**GoodPayBack** - 让点餐更简单！ 🍔🍕🥘