# Backend готов — все модули работают

## Endpoints

### Auth
- POST /api/v1/auth/register
- POST /api/v1/auth/login

### Users (требует JWT)
- GET    /api/v1/users
- GET    /api/v1/users/:id
- PATCH  /api/v1/users/:id
- DELETE /api/v1/users/:id

### Posts
- GET    /api/v1/posts          — публичный, likedByMe если есть JWT
- GET    /api/v1/posts/:id      — публичный
- POST   /api/v1/posts          — JWT обязателен
- PATCH  /api/v1/posts/:id      — JWT, только автор
- DELETE /api/v1/posts/:id      — JWT, только автор
- POST   /api/v1/posts/:id/like — JWT, toggle like/unlike

### Routes (маршруты)
- GET    /api/v1/routes          — публичный, фильтры: ?difficulty=&country=&search=&author_id=
- GET    /api/v1/routes/:id      — публичный
- POST   /api/v1/routes          — JWT обязателен
- PATCH  /api/v1/routes/:id      — JWT, только автор
- DELETE /api/v1/routes/:id      — JWT, только автор

### Social (подписки и комментарии)
- GET    /api/v1/users/:id/followers  — публичный
- GET    /api/v1/users/:id/following  — публичный
- POST   /api/v1/users/:id/follow     — JWT
- DELETE /api/v1/users/:id/follow     — JWT
- GET    /api/v1/posts/:id/comments   — публичный
- POST   /api/v1/posts/:id/comments   — JWT
- DELETE /api/v1/posts/:id/comments/:comment_id — JWT, только автор

### GPS Tracking
- POST  /api/v1/tracking/sessions           — JWT, начать сессию записи
- PATCH /api/v1/tracking/sessions/:id/finish — JWT, завершить
- GET   /api/v1/tracking/sessions/:id        — JWT, получить трек с точками
- WS    /api/v1/tracking/ws?token=JWT        — WebSocket, live запись GPS точек

### Health
- GET /health
