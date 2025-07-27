# Настройка безопасности между сервисами

## Переменные окружения

### Для локальной разработки

Создайте файлы `.env` в каждой папке сервиса:

#### auth-service/.env
```bash
# Database Configuration
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=socialka_auth
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
EMAIL_VERIFICATION_SECRET=your_email_verification_secret_key_here
RESET_TOKEN_SECRET=your_reset_token_secret_key_here

# Service Configuration
PORT=3000
NODE_ENV=development

# Inter-service Communication
INTER_SERVICE_API_KEY=socialka-inter-service-key-2024
USER_SERVICE_URL=http://localhost:3001

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

#### user-service/.env
```bash
# Database Configuration
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=socialka_users
DB_HOST=localhost
DB_PORT=5432

# Service Configuration
PORT=3001
NODE_ENV=development

# Inter-service Communication
INTER_SERVICE_API_KEY=socialka-inter-service-key-2024
```

## Для Docker

Переменные окружения уже настроены в `docker-compose.yml`.

## Проверка работы

1. Запустите сервисы:
   ```bash
   # Для Docker
   docker-compose up
   
   # Для локальной разработки
   cd auth-service && npm start
   cd user-service && npm start
   ```

2. Проверьте аутентификацию:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## Безопасность

- `INTER_SERVICE_API_KEY` должен быть одинаковым для всех сервисов
- В продакшене используйте сложные секретные ключи
- Никогда не коммитьте `.env` файлы в репозиторий
- Регулярно ротируйте API ключи 