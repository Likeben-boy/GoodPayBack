# Prisma Schema 字段名转换工具

这个工具可以自动将 Prisma schema 文件中的下划线命名 (snake_case) 字段转换为驼峰命名 (camelCase)，并添加相应的 `@map` 注解，保持数据库字段名不变。

## 功能特性

- ✅ **字段名转换**: `user_id` → `userId`
- ✅ **模型名转换**: `user_addresses` → `UserAddresses`
- ✅ **添加映射注解**: 自动添加 `@map("user_id")` 和 `@@map("users")`
- ✅ **更新索引引用**: 索引中的字段名自动更新为驼峰命名
- ✅ **保持枚举不变**: 枚举类型和枚举值保持原样
- ✅ **自动备份**: 转换前自动创建 `.backup.prisma` 备份文件
- ✅ **一键恢复**: 支持从备份文件恢复原始内容

## 使用方法

### 1. 转换字段名

```bash
# 在 prisma 目录下执行
node convert-schema.js

# 或者使用 npm script
npm run convert
```

### 2. 恢复备份

```bash
node convert-schema.js --restore

# 或者使用 npm script
npm run restore
```

### 3. 查看帮助

```bash
node convert-schema.js --help

# 或者使用 npm script
npm run help
```

## 转换示例

### 转换前
```prisma
model users {
  id         Int       @id @default(autoincrement())
  username   String    @db.VarChar(50)
  phone      String    @unique @db.VarChar(20)
  created_at DateTime  @default(now()) @db.DateTime(0)
  updated_at DateTime  @default(now()) @db.DateTime(0)

  @@index([created_at], map: "idx_created_at")
}
```

### 转换后
```prisma
model Users {
  id        Int       @id @default(autoincrement())
  username  String    @db.VarChar(50)
  phone     String    @unique @db.VarChar(20)
  createdAt DateTime  @default(now()) @db.DateTime(0) @map("created_at")
  updatedAt DateTime  @default(now()) @db.DateTime(0) @map("updated_at")

  @@map("users")
  @@index([createdAt], map: "idx_created_at")
}
```

## 转换规则

1. **字段名**: 下划线命名 → 驼峰命名，添加 `@map` 保持数据库字段名
2. **模型名**: 下划线命名 → 帕斯卡命名，添加 `@@map` 保持数据库表名
3. **索引引用**: 索引中的字段名自动更新为新的驼峰命名
4. **枚举类型**: 保持不变，不进行任何转换
5. **属性保持**: 所有原有属性（如 `@default`、`@db.VarChar` 等）完全保留

## 注意事项

1. **备份文件**: 转换前自动创建 `.backup.prisma` 备份文件
2. **手动检查**: 转换后建议检查结果，确保转换符合预期
3. **索引引用**: 大部分索引引用会自动更新，但复杂情况可能需要手动调整
4. **枚举类型**: 枚举类型和枚举值保持不变，避免影响现有代码

## 安全性

- 转换前自动备份，安全无风险
- 支持一键恢复原始内容
- 只修改 schema 文件，不影响数据库数据

## 故障排除

如果转换出现问题：

1. 使用 `--restore` 选项恢复备份
2. 检查原始 schema 文件语法是否正确
3. 手动调整有问题的索引定义
4. 重新运行转换脚本

## 文件说明

- `convert-schema.js`: 主转换脚本
- `package.json`: npm 脚本配置
- `README.md`: 使用说明文档