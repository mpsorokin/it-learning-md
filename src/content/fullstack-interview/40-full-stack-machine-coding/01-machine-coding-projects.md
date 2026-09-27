# Full-Stack Machine Coding Projects

## Interview questions

### Task 1 — User dashboard
<!-- question-id: 40-full-stack-machine-coding-task01 -->

Будем делать за ограниченное время небольшие системы:

Next UI
+ Nest REST API
+ PostgreSQL
+ pagination/filter

#### Ответ

Срез: tenant-scoped таблица пользователей, allowlisted-фильтры, keyset pagination и URL-driven Next UI. `SessionGuard` валидирует сессию и кладёт tenant из principal в request; tenant никогда не берётся из query/body. `created_at` вместе с UUID `id` образует стабильный порядок. Cursor подписан HMAC, но не является правом доступа: каждый запрос всё равно ограничен tenant из сессии.

    import { createHmac, timingSafeEqual } from 'node:crypto';
    import { BadRequestException, Controller, Get, Injectable, Query, Req, UseGuards } from '@nestjs/common';
    import { DataSource } from 'typeorm';
    import 'server-only';
    import { cookies } from 'next/headers';
    import { redirect } from 'next/navigation';

    const STATUSES = ['active', 'invited', 'disabled'] as const;
    type UserStatus = typeof STATUSES[number];
    type Filters = { limit: number; status?: UserStatus; query?: string; cursor?: string };
    type Cursor = { tenantId: string; createdAt: string; id: string };
    type RawQuery = Record<string, unknown>;

    function parseFilters(raw: RawQuery): Filters {
      const limitValue = raw.limit === undefined ? 25 : Number(raw.limit);
      if (!Number.isInteger(limitValue) || limitValue < 1) {
        throw new BadRequestException('limit must be a positive integer');
      }
      const limit = Math.min(limitValue, 100);
      if (raw.status !== undefined && raw.status !== '' &&
          (typeof raw.status !== 'string' || !STATUSES.includes(raw.status as UserStatus))) {
        throw new BadRequestException('unsupported status');
      }
      for (const key of ['query', 'cursor'] as const) {
        if (raw[key] !== undefined && typeof raw[key] !== 'string') {
          throw new BadRequestException(`invalid ${key}`);
        }
      }
      const query = typeof raw.query === 'string'
        ? raw.query.trim().slice(0, 100) || undefined
        : undefined;
      return {
        limit,
        status: raw.status === '' ? undefined : raw.status as UserStatus | undefined,
        query,
        cursor: raw.cursor as string | undefined,
      };
    }

    const cursorSecret = process.env.CURSOR_SECRET!; // 32+ random bytes, managed secret
    function encodeCursor(cursor: Cursor): string {
      const body = Buffer.from(JSON.stringify(cursor)).toString('base64url');
      const signature = createHmac('sha256', cursorSecret).update(body).digest('base64url');
      return `${body}.${signature}`;
    }
    function decodeCursor(token: string | undefined, tenantId: string): Cursor | undefined {
      if (!token) return undefined;
      if (token.length > 512) throw new BadRequestException('invalid cursor');
      const [body, signature, extra] = token.split('.');
      if (!body || !signature || extra !== undefined) throw new BadRequestException('invalid cursor');
      const expected = createHmac('sha256', cursorSecret).update(body).digest();
      const supplied = Buffer.from(signature, 'base64url');
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        throw new BadRequestException('invalid cursor');
      }
      try {
        const value = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Cursor;
        if (value.tenantId !== tenantId || typeof value.createdAt !== 'string' || Number.isNaN(Date.parse(value.createdAt)) ||
            typeof value.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(value.id)) {
          throw new Error('invalid cursor payload');
        }
        return { tenantId, createdAt: new Date(value.createdAt).toISOString(), id: value.id };
      } catch {
        throw new BadRequestException('invalid cursor');
      }
    }

    type UserRow = { id: string; display_name: string; status: UserStatus; created_at: Date };
    type RequestWithPrincipal = { user: { tenantId: string } };

    @Controller('users')
    @UseGuards(SessionGuard)
    class UsersController {
      constructor(private readonly users: UsersService) {}
      @Get()
      list(@Req() req: RequestWithPrincipal, @Query() raw: RawQuery) {
        return this.users.list(req.user.tenantId, parseFilters(raw));
      }
    }

    @Injectable()
    class UsersService {
      constructor(private readonly db: DataSource) {}
      async list(tenantId: string, filters: Filters) {
        const values: unknown[] = [tenantId];
        const bind = (value: unknown) => {
          values.push(value);
          return `$${values.length}`;
        };
        const where = ['tenant_id = $1', 'deleted_at IS NULL'];
        if (filters.status) where.push(`status = ${bind(filters.status)}`);
        if (filters.query) where.push(`display_name ILIKE '%' || ${bind(filters.query)} || '%'`);
        const cursor = decodeCursor(filters.cursor, tenantId);
        if (cursor) {
          where.push(`(created_at, id) < (${bind(cursor.createdAt)}::timestamptz, ${bind(cursor.id)}::uuid)`);
        }
        const limitSlot = bind(filters.limit + 1);
        const rows = await this.db.query(
          `SELECT id, display_name, status, created_at FROM users
           WHERE ${where.join(' AND ')}
           ORDER BY created_at DESC, id DESC LIMIT ${limitSlot}`,
          values,
        ) as UserRow[];
        const hasMore = rows.length > filters.limit;
        const items = rows.slice(0, filters.limit).map(({ id, display_name, status, created_at }) => ({
          id, displayName: display_name, status, createdAt: created_at.toISOString(),
        }));
        const last = rows[filters.limit - 1];
        return {
          items,
          nextCursor: hasMore && last
            ? encodeCursor({ tenantId, createdAt: last.created_at.toISOString(), id: last.id })
            : null,
        };
      }
    }

    type UserPage = {
      items: Array<{ id: string; displayName: string; status: UserStatus; createdAt: string }>;
      nextCursor: string | null;
    };

    function UsersTable({ page, query, status }: {
      page: UserPage;
      query?: string;
      status?: UserStatus;
    }) {
      const next = new URLSearchParams();
      if (query) next.set('query', query);
      if (status) next.set('status', status);
      if (page.nextCursor) next.set('cursor', page.nextCursor);
      return <main>
        <form action="/users" method="get">
          <input name="query" defaultValue={query} maxLength={100} />
          <select name="status" defaultValue={status ?? ''}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </select>
          <button type="submit">Filter</button>
        </form>
        {page.items.length === 0 ? <p>No users found</p> :
          <table><tbody>{page.items.map(user => <tr key={user.id}>
            <td>{user.displayName}</td><td>{user.status}</td>
          </tr>)}</tbody></table>}
        {page.nextCursor && <a href={`/users?${next}`}>Next page</a>}
      </main>;
    }

    export default async function UsersPage({ searchParams }: {
      searchParams: Promise<Record<string, string | string[] | undefined>>;
    }) {
      const filters = parseFilters(await searchParams);
      const session = (await cookies()).get('__Host-session')?.value;
      if (!session) redirect('/login');
      const url = new URL('/users', process.env.NEST_INTERNAL_URL!);
      url.searchParams.set('limit', String(filters.limit));
      if (filters.query) url.searchParams.set('query', filters.query);
      if (filters.status) url.searchParams.set('status', filters.status);
      if (filters.cursor) url.searchParams.set('cursor', filters.cursor);
      const response = await fetch(url, {
        headers: { cookie: `__Host-session=${encodeURIComponent(session)}` },
        cache: 'no-store', // ответ tenant-specific; не помещать его в shared cache
      });
      if (response.status === 401) redirect('/login');
      if (!response.ok) throw new Error(`Users API failed: ${response.status}`);
      const page = await response.json() as UserPage;
      return <UsersTable page={page} query={filters.query} status={filters.status} />;
    }

В Next 15/16 `searchParams` и `cookies()` асинхронные; чтение cookie делает страницу динамической. `NEST_INTERNAL_URL` — private service URL, cookie передаётся только этому доверенному API, fetch отключает общий cache для tenant-specific данных. `SessionGuard` и application providers — bindings проекта; service сам всегда накладывает tenant scope. PostgreSQL нужен индекс `(tenant_id, created_at DESC, id DESC)`; status-индекс добавляется после `EXPLAIN (ANALYZE, BUFFERS)`. SQL значения параметризованы, DTO содержит только нужные поля. Debounce и отмена запроса предотвращают устаревший ответ при изменении фильтра. Проверки: подпись/повреждение и tenant mismatch cursor, пустой status, границы limit, одинаковые timestamps, переходы страниц и tenant isolation. [Next page props](https://nextjs.org/docs/app/api-reference/file-conventions/page) и [cookies](https://nextjs.org/docs/app/api-reference/functions/cookies).

### Task 2 — Realtime notifications
<!-- question-id: 40-full-stack-machine-coding-task02 -->

Будем делать за ограниченное время небольшие системы:

Next
+ Nest WebSocket
+ Redis

#### Ответ

Хранение и live-доставка — разные гарантии. В одной PostgreSQL-транзакции с доменным событием увеличиваю `user_notification_counter.last_seq` под row lock, вставляю notification с полученным per-user `seq` и outbox row. Уникальность `(user_id, seq)` и транзакционный counter дают упорядоченный cursor без дыр от откатившейся транзакции; конкурирующие события одного пользователя сериализуются. Worker публикует outbox через Redis Pub/Sub в Nest gateway. Это быстрая best-effort доставка подключённым клиентам, не replay; при потере Redis-сообщения источник восстановления — PostgreSQL.

Клиент аутентифицирует WebSocket по сессии, проверяет Origin и подписывается только на room из server-derived principal. При reconnect и периодически запрашивает `GET /notifications?after=<seq>` из БД в ascending порядке; периодическая сверка также обнаруживает потерю последнего Pub/Sub event, если после него новых сообщений нет. Обработчик применяет live/replay последовательно и двигает cursor только после применения. Так cursor ограничен одним числом, а видимый список — последними 50 уведомлениями, без растущего `seen Set`. На каждой реплике нужен Nest-compatible Redis adapter или явная fanout-схема; Pub/Sub не подтверждает обработку события браузером.

    type NotificationEvent = {
      id: string;
      seq: string; // PostgreSQL bigint сериализуется как string
      type: string;
      payload: unknown;
    };

    type CursorState = { current: bigint };
    type ReadAfter = (cursor: string) => Promise<NotificationEvent[]>; // <=100, ORDER BY seq ASC
    type ApplyAndPersist = (event: NotificationEvent) => Promise<void>;

    async function receiveInOrder(
      live: NotificationEvent,
      cursor: CursorState,
      readAfter: ReadAfter,
      applyAndPersist: ApplyAndPersist,
    ): Promise<void> {
      const target = BigInt(live.seq);
      if (target <= cursor.current) return; // уже применено из live/replay
      if (target === cursor.current + 1n) {
        await applyAndPersist(live); // upsert по id и сохранение seq выполняются атомарно
        cursor.current = target;
        return;
      }

      // Gap: durable replay is authoritative; do not advance to the live seq first.
      while (cursor.current < target) {
        const page = await readAfter(cursor.current.toString());
        if (page.length === 0) throw new Error('notification replay has a gap');
        for (const event of page) {
          const seq = BigInt(event.seq);
          if (seq <= cursor.current) continue;
          if (seq > target) throw new Error('replay passed the incoming sequence');
          if (seq !== cursor.current + 1n) throw new Error('notification replay is out of order');
          await applyAndPersist(event);
          cursor.current = seq;
          if (cursor.current >= target) return;
        }
      }
    }

    function attach(socket: WebSocket, initialSeq: string, readAfter: ReadAfter,
      applyAndPersist: ApplyAndPersist, onFailure: (error: unknown) => void) {
      const cursor = { current: BigInt(initialSeq) };
      let queue = Promise.resolve(); // serialize live handlers so they cannot race the replay
      socket.addEventListener('message', message => {
        const live = JSON.parse(String(message.data)) as NotificationEvent;
        queue = queue.then(() => receiveInOrder(live, cursor, readAfter, applyAndPersist))
          .catch(error => { onFailure(error); socket.close(); });
      });
    }

Replay endpoint ограничивает страницу и фильтрует `user_id` из сессии; read/ack mutation также проверяет владельца. `applyAndPersist` атомарно upsert-ит notification по id в bounded visible state и сохраняет seq; только после успеха память сдвигает cursor. На reconnect и по таймеру читаю страницы до пустого результата. Семантика — at-least-once с идемпотентным применением по `id/seq`, не exactly-once; при retention gap сервер возвращает явный snapshot/reset, а не молча перескакивает sequence. Тестирую disconnect во время публикации, дубли, gap, out-of-order, catch-up pagination, чужой room, отзыв сессии и медленного клиента с ограниченным буфером. [Nest gateways](https://docs.nestjs.com/websockets/gateways).

### Task 3 — Product catalog
<!-- question-id: 40-full-stack-machine-coding-task03 -->

Будем делать за ограниченное время небольшие системы:

SSR/RSC
+ search
+ filters
+ cache
+ mutation

#### Ответ

Реализую каталог как URL-driven SSR/RSC список: query/category/sort валидируются на сервере, SQL значения bind-параметризованы, а имя сортировки выбирается только из фиксированного mapping. Server Component отображает первую страницу; GET-form работает без клиентского состояния. PostgreSQL остаётся источником истины. Ниже код для Next 16 с включённым `cacheComponents`; cache helper содержит только публичные товары и получает нормализованные фильтры — они становятся частью cache key.

    import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

    type CatalogFilters = {
      query?: string;
      category?: 'books' | 'hardware' | 'software';
      sort: 'newest' | 'price';
    };
    const categories = ['books', 'hardware', 'software'] as const;

    function parseCatalogFilters(
      raw: Record<string, string | string[] | undefined>,
    ): CatalogFilters {
      const scalar = (value: string | string[] | undefined) =>
        typeof value === 'string' ? value : undefined;
      const query = (scalar(raw.q) ?? '').trim().slice(0, 120) || undefined;
      const categoryValue = scalar(raw.category);
      const category = categories.find(value => value === categoryValue);
      return {
        query,
        category,
        sort: scalar(raw.sort) === 'price' ? 'price' : 'newest',
      };
    }

    async function getPublicCatalog(filters: CatalogFilters) {
      'use cache';
      cacheLife('minutes');
      cacheTag('public-catalog');
      const orderBy = filters.sort === 'price'
        ? 'price_minor ASC, id ASC'
        : 'created_at DESC, id DESC'; // только константные варианты
      return db.query(
        `SELECT id, name, category, price_minor, image_url FROM products
         WHERE published_at IS NOT NULL
           AND ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
           AND ($2::text IS NULL OR category = $2)
         ORDER BY ${orderBy} LIMIT 25`,
        [filters.query ?? null, filters.category ?? null],
      );
    }

    export async function updatePublicProduct(input: UpdateProductInput) {
      'use server';
      const actor = await requireCatalogEditor();
      const product = validateProductInput(input);
      await db.transaction(async tx => {
        const rows = await tx.query(
          `UPDATE products SET name = $1, price_minor = $2, version = version + 1
           WHERE id = $3 AND version = $4 RETURNING id`,
          [product.name, product.priceMinor, product.id, product.expectedVersion],
        );
        if (!rows[0]) throw new Error('product changed or is unavailable');
        await tx.query('INSERT INTO audit_events(actor_id, action, resource_id) VALUES ($1, $2, $3)',
          [actor.id, 'product.updated', product.id]);
      });
      revalidateTag('public-catalog', 'max'); // stale-while-revalidate для публичного каталога
    }

Для Next 16 включаю `cacheComponents: true`; в версии без Cache Components использую поддерживаемый ей механизм, не предполагая кэширование fetch по умолчанию. Server page получает `searchParams`, вызывает `getPublicCatalog(parseCatalogFilters(...))`, рисует фильтры, loading/empty/error и карточки. Цена пользователя, права и персональные скидки не попадают в shared cache. `revalidateTag(..., 'max')` допускает временно stale публичную выдачу; если stock/price требует read-your-own-write, этот путь не кэширую либо использую подходящую immediate invalidation семантику целевой версии.

Mutation всегда проверяет роль на сервере, валидирует whitelist полей, использует optimistic concurrency по `version`, пишет audit record в той же транзакции и инвалидирует tag после commit. Ключевые проверки: SQL injection через фильтры/sort, cache key между разными фильтрами, отсутствие утечки персональных данных, invalidation после изменения, конфликт версии и состояние пустой выдачи. [Next Cache Components](https://nextjs.org/docs/app/api-reference/directives/use-cache), [cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife), [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag).

### Task 4 — Authentication
<!-- question-id: 40-full-stack-machine-coding-task04 -->

Будем делать за ограниченное время небольшие системы:

login
refresh
logout
protected routes
roles

#### Ответ

Для browser app выбираю непрозрачную серверную сессию: случайный 256-bit token хранится в cookie, в БД лежит только SHA-256 от токена; для такого высокоэнтропийного секрета медленный password hash не нужен. Cookie имеет вид `__Host-session=<token>; Secure; HttpOnly; Path=/; SameSite=Lax`, без `Domain`. Пароль проверяю через Argon2id библиотеку, login rate-limited, ошибка одинаковая для неизвестного пользователя и неверного пароля. После успешного login создаю новую сессию, не переиспользуя pre-auth session.

    import { createHash, randomBytes } from 'node:crypto';
    import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

    type Session = { userId: string; expiresAt: Date };
    type User = { id: string; tenantId: string; active: boolean; roles: string[] };
    interface Sessions {
      create(hash: string, userId: string, expiresAt: Date): Promise<void>;
      findByTokenHash(hash: string): Promise<Session | null>;
      findActiveUser(id: string): Promise<User | null>;
      // Atomic rotate validates expiry/active user; replay is detected from token-family history and revokes that family.
      rotate(oldHash: string, newHash: string, expiresAt: Date): Promise<'rotated' | 'invalid' | 'replayed'>;
      revokeByTokenHash(hash: string): Promise<void>;
    }
    const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

    async function createSession(userId: string, sessions: Sessions) {
      const token = randomBytes(32).toString('base64url');
      await sessions.create(tokenHash(token), userId, new Date(Date.now() + 7 * 86400_000));
      return token; // raw token уходит только в Secure HttpOnly cookie
    }

    async function requireUser(cookieToken: string | undefined, sessions: Sessions): Promise<User> {
      if (!cookieToken) throw new UnauthorizedException();
      const session = await sessions.findByTokenHash(tokenHash(cookieToken));
      if (!session || session.expiresAt <= new Date()) throw new UnauthorizedException();
      const user = await sessions.findActiveUser(session.userId);
      if (!user?.active) throw new UnauthorizedException();
      return user; // роли читаются актуальными, а не доверяются из cookie
    }

    function requireRole(user: User, role: string): void {
      if (!user.roles.includes(role)) throw new ForbiddenException();
    }

    async function refreshSession(oldToken: string, sessions: Sessions) {
      const newToken = randomBytes(32).toString('base64url');
      const result = await sessions.rotate(
        tokenHash(oldToken), tokenHash(newToken), new Date(Date.now() + 7 * 86400_000),
      ); // срок и CAS проверяются атомарно; повтор отзывается вместе с token family
      if (result !== 'rotated') throw new UnauthorizedException();
      return newToken;
    }

    async function logoutSession(cookieToken: string | undefined, sessions: Sessions) {
      if (cookieToken) await sessions.revokeByTokenHash(tokenHash(cookieToken));
      return { 'Set-Cookie': '__Host-session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0' };
    }

`POST /auth/login` проверяет пароль, вызывает `createSession` и выдаёт cookie `__Host-session=<token>; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=604800` (без `Domain`); `Sessions.create` сохраняет hash и владельца; `POST /auth/refresh` атомарно заменяет старый hash новым и продлевает expiry; повтор старого refresh credential отзывает всю token family и требует повторный login. `POST /auth/logout` отзывает текущую серверную сессию и очищает cookie с теми же Path/SameSite/Secure атрибутами. Для unsafe cookie-authenticated requests дополнительно проверяю CSRF token и Origin. Каждый handler вызывает `requireUser`, затем role/resource check рядом с запросом данных; SQL ограничивает tenant и ownership, а не доверяет userId из тела. Redirect после login допускает только внутренний относительный путь. Тестирую fixation, expiry, refresh replay/race, CSRF, open redirect, отзыв роли, горизонтальный доступ и logout на всех вкладках. Proxy в Next допустим для раннего redirect/UX, но не заменяет авторизацию в data layer и API. [Next Authentication guidance](https://nextjs.org/docs/app/guides/authentication).

### Task 5 — Mini issue tracker
<!-- question-id: 40-full-stack-machine-coding-task05 -->

Будем делать за ограниченное время небольшие системы:

projects
tickets
comments
optimistic updates

#### Ответ

Начинаю с минимальных ограничений схемы: `projects(tenant_id, ...)`, `project_members(project_id, user_id, role)`, `tickets(project_id, status CHECK, version, updated_at, ...)` и append-only `comments(ticket_id, author_id, client_mutation_id, body CHECK length(body) <= 5000, created_at, UNIQUE(author_id, client_mutation_id))`. Внешние ключи и индексы по `(project_id, status, updated_at DESC, id DESC)` обеспечивают целостность и list path. Любой запрос сначала ограничивается tenant и членством; роли из UI не принимаются.

Ниже вертикальный срез смены статуса: сервер проверяет допустимое значение, блокирует только ticket row, проверяет членство/роль и expected version, затем обновляет условно. `version` защищает от lost update; недоступный объект возвращает 404, устаревшая версия — 409.

    type TicketStatus = 'open' | 'in_progress' | 'done';
    import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
    type Actor = { userId: string; tenantId: string };
    type StatusCommand = {
      ticketId: string;
      status: TicketStatus;
      expectedVersion: number;
    };

    async function changeStatus(actor: Actor, command: StatusCommand) {
      if (!['open', 'in_progress', 'done'].includes(command.status)) {
        throw new BadRequestException('unsupported status');
      }
      if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 0) {
        throw new BadRequestException('invalid expectedVersion');
      }
      return dataSource.transaction(async manager => {
        const visible = await manager.query(
          `SELECT t.id, t.version FROM tickets t
           JOIN projects p ON p.id = t.project_id
           JOIN project_members m ON m.project_id = p.id
           WHERE t.id = $1 AND p.tenant_id = $2 AND m.user_id = $3
             AND m.role IN ('owner', 'editor')
           FOR UPDATE OF t, m`,
          [command.ticketId, actor.tenantId, actor.userId],
        ) as Array<{ id: string; version: number }>;
        if (!visible[0]) throw new NotFoundException();
        if (visible[0].version !== command.expectedVersion) {
          throw new ConflictException('ticket changed; reload and retry');
        }
        const updated = await manager.query(
          `UPDATE tickets SET status = $1, version = version + 1, updated_at = now()
           WHERE id = $2 AND version = $3
           RETURNING id, project_id, status, version, updated_at`,
          [command.status, command.ticketId, command.expectedVersion],
        );
        return updated[0];
      });
    }

`POST /tickets/:id/comments` в той же транзакционной границе проверяет членство с правом comment, ограничивает и нормализует body, вставляет comment с `clientMutationId` (unique для автора) и обновляет `last_activity_at`; повторный submit возвращает прежний comment, а другой payload с тем же ключом — conflict. Мягкое удаление/редактирование комментария должно сохранять аудит, если это требование продукта.

    import { useEffect, useOptimistic, useState, useTransition } from 'react';

    type SavedStatus = { status: TicketStatus; version: number };

    function TicketStatus({
      ticket,
      save,
      refresh,
      showError,
    }: {
      ticket: { id: string; status: TicketStatus; version: number };
      save: (command: StatusCommand) => Promise<SavedStatus>;
      refresh: () => void;
      showError: (error: unknown) => void;
    }) {
      const [isPending, startTransition] = useTransition();
      const [base, setBase] = useState<SavedStatus>(() => ({
        status: ticket.status,
        version: ticket.version,
      }));
      useEffect(() => {
        setBase(current => ticket.version > current.version
          ? { status: ticket.status, version: ticket.version }
          : current); // запоздалые RSC props не откатывают уже сохранённую версию
      }, [ticket.status, ticket.version]);
      const [status, setStatus] = useOptimistic<TicketStatus, TicketStatus>(
        base.status,
        (_current, next) => next,
      );
      function change(next: TicketStatus) {
        startTransition(async () => {
          setStatus(next);
          try {
            const saved = await save({ ticketId: ticket.id, status: next, expectedVersion: base.version });
            startTransition(() => setBase(saved)); // state update после await снова входит в transition
            refresh(); // нужен для связанных RSC данных; stale props отсекаются по version
          } catch (error) {
            showError(error); // отображаем server error, 409 предлагает reload/retry
          }
        });
      }
      return <select disabled={isPending} value={status} onChange={e => change(e.target.value as TicketStatus)}>
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="done">Done</option>
      </select>;
    }

UI хранит project/status/filter в URL, список идёт курсором; комментарий появляется после ответа или как optimistic row с тем же clientMutationId, который сервер возвращает. UI оптимистичен только до результата, источник истины — API. Проверяю tenant isolation, member roles, 404/409, две конкурентные записи, duplicate comment submit, rollback optimistic state и порядок комментариев.

