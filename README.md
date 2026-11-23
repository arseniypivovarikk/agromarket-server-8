# AgroMarket Server — Лабораторная 7 (Пользователи и JWT)

## Запуск
1. `cd agromarket-server`
2. `npm install`
3. Скопируйте `.env.example` в `.env` и замените JWT_SECRET на случайный секрет. В Windows PowerShell: `Copy-Item .env.example .env`.
4. Укажите ADMIN_EMAIL и ADMIN_PASSWORD (пароль администратора должен быть новым и безопасным).
5. `npm run dev`

Сервер: http://localhost:3000. Frontend запускается из папки `agromarket-react`: `npm install`, `npm run dev` (Vite, порт 5173).

## Учебная реализация
Исходный проект ЛР6 использовал JSON-хранилище вместо PostgreSQL. Чтобы сохранить простоту запуска, в этой версии users сохраняются в `data/users.json`, а пароли — только bcrypt-хэши. При первом запуске сервер создаёт администратора из переменных ADMIN_EMAIL / ADMIN_PASSWORD, если администратор ещё не существует. Для реального/учебного соответствия PostgreSQL-части методички следует перенести users и orders на таблицы SQL.

## API
| Метод | Путь | Доступ | Ответы |
|---|---|---|---|
| GET | `/api/health` | Все | 200 |
| GET | `/api/products` | Все | 200 |
| POST | `/api/auth/register` | Все | 201, 400, 409 |
| POST | `/api/auth/login` | Все | 200, 400, 401, 429 |
| GET | `/api/auth/me` | Bearer JWT | 200, 401 |
| POST | `/api/products` | admin JWT | 201, 400, 401, 403 |
| DELETE | `/api/products/:id` | admin JWT | 204, 401, 403, 404 |
| POST | `/api/orders` | Все | 201, 400 |
| GET | `/api/orders` | admin JWT | 200, 401, 403 |

## Безопасность
- bcryptjs с солью (10 rounds), не хранить пароль открытым текстом.
- JWT payload: subject (id) и role, срок по JWT_EXPIRES_IN.
- `requireAuth` проверяет Bearer JWT; `requireRole('admin')` проверяет права. 401 — отсутствует/недействителен вход, 403 — недостаточно прав.
- Rate limit: 5 неуспешных входов за 15 минут с IP.
- Helmet заголовки, CORS origin, ограничение JSON body 10 KB.
- UI скрывает админскую форму от обычных пользователей, но настоящая защита находится на backend middleware.

## Ответы для защиты (кратко)
- Аутентификация — установление личности пользователя; авторизация — проверка разрешений. 401 относится к входу, 403 — к правам.
- bcrypt-хэш односторонний; соль делает одинаковые пароли разными хэшами, а вычисление намеренно замедлено.
- JWT состоит из Header, Payload и Signature. Header/Payload можно декодировать, подпись защищает от изменения содержимого.
- Изменить role в payload нельзя без корректной подписи; если JWT_SECRET утечёт, злоумышленник сможет выпускать поддельные токены.
- requireAuth проверяет токен и ставит req.user. requireRole возвращает middleware-функцию, потому что принимает параметр роли.
- Нельзя раскрывать, существует ли e-mail: это облегчает подбор зарегистрированных аккаунтов.
- Mass assignment — прямое присвоение всех полей запроса. Здесь сервер формирует объект продукта только из разрешённых полей name, price, image.
- Токен хранится в localStorage и apiFetch добавляет Authorization: Bearer. Недостаток localStorage — доступность токена JavaScript при XSS.
- Спрятанная форма React не защищает API; сервер проверяет роль независимо от UI.
- OPTIONS preflight — браузер заранее проверяет допустимость cross-origin метода/заголовков.
- ИИ использовался как помощник для сборки и объяснения учебного кода; перед сдачей проверьте код, запустите его и будьте готовы объяснить.

## Git-коммит
`git add . && git commit -m "lab7: users, bcrypt, JWT auth, roles, rate limit, helmet"`


## Лабораторная 8

- `npm test` — автотесты Vitest + Supertest.
- `npm run test:watch` — watch режим.
- `npm run coverage` — отчёт покрытия.
- `.env.test.example` — шаблон тестовой среды.
- `app.js` импортируется тестами; `server.js` запускает listen.

В этой версии проект ЛР7 использует JSON-хранилище, тесты работают с отдельными файлами `*.test.json`; PostgreSQL CI из исходной методички не используется.
