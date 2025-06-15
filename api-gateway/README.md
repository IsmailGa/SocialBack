# API Gateway

API Gateway для микросервисной архитектуры Socialka. Служит единой точкой входа для всех микросервисов.

## Установка

```bash
npm install
```

## Конфигурация

Создайте файл `.env` в корневой директории и настройте следующие переменные:

```env
PORT=3000

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
POST_SERVICE_URL=http://localhost:3003
COMMENT_SERVICE_URL=http://localhost:3004
LIKE_SERVICE_URL=http://localhost:3005
MESSAGE_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007
```

## Запуск

### Локальный запуск

Для разработки:
```bash
npm run dev
```

Для продакшена:
```bash
npm start
```

### Запуск в Docker

Сборка образа:
```bash
docker build -t socialka-api-gateway .
```

Запуск контейнера:
```bash
docker run -p 3000:3000 --env-file .env socialka-api-gateway
```

## Доступные маршруты

- `/auth` - Сервис аутентификации
- `/users` - Сервис пользователей
- `/posts` - Сервис постов
- `/comments` - Сервис комментариев
- `/likes` - Сервис лайков
- `/messages` - Сервис сообщений
- `/notifications` - Сервис уведомлений

## Проверка работоспособности

Для проверки работоспособности API Gateway используйте эндпоинт:
```
GET /health
```

## Особенности

- Автоматическая маршрутизация запросов к соответствующим сервисам
- Обработка CORS
- Логирование запросов
- Обработка ошибок
- Поддержка масштабирования
- Docker-контейнеризация 