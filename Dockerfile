# 使用官方 Node.js 23 作为基础镜像
FROM node:23-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm@10.15.1

# 安装项目依赖（仅生产依赖）
RUN pnpm install --frozen-lockfile --prod

# 复制项目源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript
RUN pnpm run build

# 创建必要的目录
RUN mkdir -p logs uploads

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/index.js"]