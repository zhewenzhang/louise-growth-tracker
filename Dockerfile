FROM node:18-alpine AS builder

WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴（不更新 npm 全局）
RUN npm ci

# 複製源代碼
COPY . .

# 構建
RUN npm run build

# 生產階段 - 使用 nginx 提供靜態文件
FROM nginx:alpine

# 複製構建輸出到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 nginx 配置支持 SPA 路由
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
