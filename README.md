# Lumora Booking

Полнофункциональная система онлайн-записи: нативное приложение React Native для Android/iOS, Next.js API и защищённая веб-мини-CRM администратора. Серверный слой считает доступность с учётом графика, длительности услуги, часового пояса и уже занятых интервалов.

## Возможности

### Для клиента

- каталог услуг с ценами, категориями и продолжительностью;
- каталог специалистов и фильтрация по услуге;
- пятишаговая запись: услуга → специалист → дата и время → контакты → проверка;
- серверная и клиентская валидация, loading/skeleton, empty и error-состояния;
- страница успеха с номером записи, деталями, копированием номера и экспортом `.ics`;
- поиск своих визитов по совпадению телефона и email и безопасная отмена через подтверждение;
- освобождение отменённого интервала для новой записи.

### Для администратора

- JWT-сессия в `httpOnly` cookie, bcrypt-хеш пароля и защита `/admin/**` и `/api/admin/**` через middleware;
- dashboard: активные записи сегодня, новые клиенты, отмены и выручка;
- список и недельный календарь записей, поиск и фильтры;
- создание, редактирование, отмена и смена статуса записи;
- CRUD услуг и специалистов с мягкой деактивацией используемых сущностей;
- недельный график каждого специалиста;
- адаптивные таблицы/карточки, диалоги опасных действий и toast-уведомления.

## Стек

- Next.js 15, App Router, React 19, TypeScript strict;
- Tailwind CSS, переиспользуемые UI-компоненты, Lucide Icons;
- Prisma ORM;
- SQLite для zero-config локального демо;
- готовая эквивалентная PostgreSQL-схема для production;
- Zod для общей серверной валидации;
- `jose` + `bcryptjs` для авторизации;
- Vitest для критичной бизнес-логики.
- Expo SDK 54, React Native и Expo Router для нативного мобильного клиента.

## Быстрый запуск

Требуется Node.js 20+ и npm.

```bash
npm install
```

Создайте локальный файл окружения из примера:

```powershell
Copy-Item .env.example .env
```

Для macOS/Linux:

```bash
cp .env.example .env
```

Создайте SQLite-базу, сгенерируйте Prisma Client и загрузите демоданные:

```bash
npm run db:setup
```

Запустите приложение:

```bash
npm run dev
```

- клиентская часть: [http://localhost:3000](http://localhost:3000)
- вход администратора: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Запуск мобильного приложения на телефоне

Установите **Expo Go** на Android или iPhone. Телефон и компьютер должны быть подключены к одной Wi-Fi сети.

В первом PowerShell-окне запустите API:

```powershell
npm.cmd run dev:api
```

Во втором окне запустите мобильное приложение:

```powershell
npm.cmd run mobile:start
```

Отсканируйте появившийся QR-код через Expo Go. IP компьютера определяется автоматически. Если соединение не установилось, настройте `EXPO_PUBLIC_API_URL` по инструкции в [`mobile/README.md`](mobile/README.md).

## Демо-доступ

```text
Email:    admin@lumora.ru
Пароль:   Lumora2026!
```

Учётные данные задаются через `ADMIN_EMAIL` и `ADMIN_PASSWORD` во время seed. После их изменения выполните `npm run db:seed` повторно.

Для проверки раздела «Мои записи» после seed можно использовать, например:

```text
Телефон: +7 999 123-45-67
Email:   irina@example.com
```

## Переменные окружения

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | Подключение Prisma; локально `file:./dev.db` |
| `AUTH_SECRET` | Ключ подписи сессии, минимум 32 символа |
| `ADMIN_EMAIL` | Email создаваемого seed-администратора |
| `ADMIN_PASSWORD` | Пароль создаваемого seed-администратора |

Не коммитьте `.env`. Для production создайте новые `AUTH_SECRET` и пароль администратора.

## PostgreSQL

Локальный профиль использует [`prisma/schema.prisma`](prisma/schema.prisma) с SQLite, потому что ему не нужен отдельный сервер. Бизнес-логика и API не зависят от провайдера. Для PostgreSQL подготовлена [`prisma/schema.postgresql.prisma`](prisma/schema.postgresql.prisma) с теми же моделями и ограничениями.

1. Укажите PostgreSQL URL в `.env`:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumora?schema=public"
   ```

2. Сгенерируйте клиент и создайте миграцию:

   ```bash
   npm run db:postgres:generate
   npm run db:postgres:migrate -- --name init
   npm run db:seed
   ```

3. Перезапустите Next.js.

Чтобы вернуться на SQLite, восстановите `DATABASE_URL="file:./dev.db"`, затем выполните `npm run db:setup`.

## Бизнес-логика бронирования

- все входные данные повторно проверяются Zod на сервере;
- просмотр и отмена клиентских записей требуют совпадения обоих контактов; существующий телефон нельзя перепривязать к другому email;
- в локальном демо пара «телефон + email» служит идентификатором клиента; перед публичным production-запуском этот сценарий следует дополнить OTP или magic-link подтверждением владения контактом;
- клиент не может запросить прошедшую дату или создать запись в прошлом;
- единый timezone клиента и сервера задан в `lib/business-timezone.ts` (`Europe/Moscow`), а в БД сохраняются UTC-значения `DateTime`;
- длительность услуги должна полностью помещаться в рабочий интервал;
- пересечения ищутся по диапазону `startsAt < existing.endsAt && endsAt > existing.startsAt`;
- запись создаётся в serializable-транзакции;
- таблица `AppointmentSlot` ставит уникальные 15-минутные блокировки на специалиста — это защищает от гонок и услуг разной длительности;
- при отмене slot-lock записи удаляются, поэтому время сразу возвращается в availability.

## Полезные команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | запускает dev-сервер |
| `npm run build` | создаёт production-сборку |
| `npm run lint` | проверяет ESLint |
| `npm run typecheck` | проверяет TypeScript без emit |
| `npm test` | запускает Vitest |
| `npm run db:generate` | генерирует Prisma Client для SQLite-схемы |
| `npm run db:push` | синхронизирует локальную SQLite-базу |
| `npm run db:seed` | пересоздаёт демонстрационные данные |
| `npm run db:setup` | выполняет generate + push + seed |

## Структура

```text
app/
  (public)/           публичные страницы и booking flow
  admin/              вход и защищённая мини-CRM
  api/                public/admin route handlers
components/
  public/             каталог и маркетинговые компоненты
  booking/            wizard, success и «Мои записи»
  admin/              shell, формы, таблицы и календарь
  ui/                 переиспользуемые UI-примитивы
lib/
  server/             auth, Prisma, timezone, slots и appointments
  validation.ts       Zod-схемы API
prisma/
  schema.prisma       SQLite-профиль
  schema.postgresql.prisma
  seed.ts
```

## Проверка качества

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Тесты в [`lib/server/availability.test.ts`](lib/server/availability.test.ts) покрывают границы расписания, длительность услуги, прошедшее время, пересечения, смежные интервалы и slot-lock блокировки. [`components/admin/date.test.ts`](components/admin/date.test.ts) проверяет московские календарные дни, границы недели и преобразование `datetime-local` в UTC.
