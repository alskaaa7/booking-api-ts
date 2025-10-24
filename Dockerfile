FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем ВСЕ зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY src/ ./src/

# Собираем приложение
RUN npm run build

# Production образ
FROM node:18-alpine AS production

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем ТОЛЬКО production зависимости
RUN npm ci --only=production

# Копируем собранное приложение из builder stage
COPY --from=builder /app/dist ./dist

# Создаем пользователя node
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER node

EXPOSE 3000

CMD ["npm", "start"]