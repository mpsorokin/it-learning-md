# Redis Practice

## Interview questions

### caching layer
<!-- question-id: 33-redis-task01 -->

#### Ответ
**Допущения и контракт.** Redis — ускоряющий cache, PostgreSQL остаётся источником истины; допустима короткая eventual consistency, а операции чтения не должны менять бизнес-состояние. Для `GET /products/:id` путь: Redis hit → валидировать payload и вернуть; miss → ограниченно прочитать primary DB → записать cache с TTL+jitter → вернуть. Ошибка или timeout Redis не должна автоматически ломать чтение, если это некритичный cache; fallback на DB защищают circuit breaker и concurrency limit.

**Ключи и формат.** Использую изолированный namespace `catalog:v3:product:<tenantId>:<productId>` и versioned JSON DTO без полей, которые нельзя отдавать клиенту. Tenant входит в ключ; при смене формата namespace поднимается, чтобы несовместимые старые значения не парсились новым кодом. TTL для примера — 5 минут плюс случайный jitter 0–60 секунд; отрицательный ответ «не найдено» можно кэшировать отдельно на короткие 15–30 секунд. Не кэшировать ошибки БД и временные запреты доступа как будто это отсутствие товара.

**Алгоритм чтения и гонки.** На miss можно использовать single-flight в процессе, затем короткий Redis lease-lock для популярного ключа: владелец ставит случайный token через `SET lock:<cache-key> token NX PX lease`, после получения повторно проверяет cache, читает DB и записывает значение; остальные ждут ограниченное время либо применяют direct-read policy. Lock удаляется Lua compare-and-delete по token. TTL lock должен покрывать нормальную работу с запасом, но не заменяет timeout и ограничение параллельности.

При записи сначала commit в DB, потом invalidation/cache update; для надёжной доставки invalidation пишется outbox event в той же DB-транзакции и повторно обрабатывается worker-ом. Однако возможна гонка: loader прочитал старую версию, запись закоммитилась и ключ удалили, а loader после этого положил старое значение. Для строгого решения храним `version` сущности и не записываем loader result, если версия уже устарела; ещё проще для read-your-writes/критичных полей читать из DB. Обычный TTL лишь ограничивает окно stale, не устраняет гонку.

Наблюдаю hit/miss, origin QPS/latency, deserialize errors, Redis timeout, evictions, memory, hot keys, lock contention, возраст данных и долю fallback. Нагрузочный тест включает cold cache, одновременный miss одного hot key, обновление при активном чтении и недоступность Redis. Принимаем Redis OSS 8.x как версионное допущение; используемые здесь `GET`/`SET`/`DEL`, TTL и Lua — базовые возможности Redis, а API конкретной клиентской библиотеки следует адаптировать отдельно.

### distributed rate limiter
<!-- question-id: 33-redis-task02 -->

#### Ответ
**Требования и выбор.** Ограничиваем, например, 10 запросов/секунду с burst до 20 по authenticated user и отдельно по дорогому endpoint; все API replicas должны видеть общий счётчик. Выбираю token bucket: контролирует среднюю скорость и явно разрешает ограниченный burst. Для простого квотирования fixed window дешевле, но допускает почти двойной burst на границе окон; для строгого rolling window можно взять sliding log ценой O(requests) памяти.

У каждого субъекта один hash с `tokens` и `last_ms`; атомарная Lua operation берёт server time (`TIME`), восстанавливает токены с заданной скоростью, ограничивает их capacity, списывает стоимость запроса при достаточном остатке и задаёт TTL. Это исключает гонку read/modify/write и расхождение часов API инстансов. Пример: capacity=20, refill=10 tokens/sec, cost=1; ключи включают policy version, endpoint и доверенный user/tenant ID, а не невалидированный клиентский header.

```text
-- KEYS[1] bucket key; ARGV: capacity, refill-per-second, cost
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2]) / 1000
local cost = tonumber(ARGV[3])
if capacity <= 0 or rate <= 0 or cost <= 0 or cost > capacity then
  return redis.error_reply('invalid limiter configuration')
end
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local state = redis.call('HMGET', KEYS[1], 'tokens', 'last_ms')
local tokens = tonumber(state[1]) or capacity
local last = tonumber(state[2]) or now
local elapsed = math.max(0, now - last)
tokens = math.min(capacity, tokens + elapsed * rate)
local allowed = 0
local retry_ms = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  retry_ms = math.ceil((cost - tokens) / rate)
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'last_ms', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(capacity / rate) + 1000)
return {allowed, math.floor(tokens), retry_ms}
```

Application превращает результат в allow/deny и HTTP `429` с `Retry-After` (округлить milliseconds вверх), добавляет limit/remaining headers и не вызывает handler до решения. В Redis Cluster скрипту нужен один key или все keys в одном hash slot; этот вариант использует один key. Для защиты от spoofing IP берётся только от настроенного trusted proxy; при Redis error действуют короткий timeout и заранее выбранный fail-open/fail-closed policy. На auth/payment API обычно fail-closed или независимый gateway safety limit; для некритичных read endpoint допустим fail-open с аварийным локальным limit. Следить за Redis latency/errors, отказами по лимиту, кардинальностью ключей и skew/аномалиями; скрипт соответствует token-bucket модели из [официального Redis примера для Node.js](https://redis.io/docs/latest/develop/use-cases/rate-limiter/nodejs/). Принимаем Redis 8.x, но алгоритм использует `TIME`, hashes, expiry и scripting, давно доступные в OSS.

### lock
<!-- question-id: 33-redis-task03 -->

#### Ответ
**Применение и ограничения.** Для координации фонового refresh cache или снижения дублирования работы можно взять короткую lease-lock на одном Redis primary. Для защиты денежной операции блокировка Redis сама по себе недостаточна: окончательную гарантию дают constraint/conditional update/transaction в authoritative DB. Разделяю lock key и ключ защищённого ресурса, задаю конечный lease и общий deadline на acquire.

Владелец генерирует криптографически случайный token на попытку; acquire — один атомарный `SET lock:inventory:sku-123 <token> NX PX 5000`. Если ответ `OK`, работа выполняется с timeout, а release всегда compare-and-delete. Нельзя делать безусловный `DEL`: lease может истечь и ключ уже принадлежать другому процессу. На отказ acquire worker ждёт случайный небольшой backoff с jitter до дедлайна, после чего возвращает busy/повторяет позже, а не блокирует request навсегда.

```text
-- KEYS[1] = lock key; ARGV[1] = owner token
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
```

Acquire/release вызываются через поддерживаемый клиентом `SET NX PX` и `EVALSHA`/script; release выполняется в `finally`, но TTL остаётся аварийным освобождением при падении процесса. Продление допустимо только при совпадении token и при подтверждённом владении; потеря renew означает немедленно прекратить работу. Нельзя считать timeout доказательством, что операция не завершилась, и нельзя запускать неидемпотентный side effect без дедупликации.

Lease ограничивает время владения: процесс может зависнуть дольше TTL и продолжить уже после того, как lock получил другой. Для критичных записей применяют fencing token/монотонную версию, которую целевой ресурс отклоняет при устаревшем владельце. Кроме того, replication Redis обычно асинхронна: failover может потерять lock-write, что допустимо лишь при осознанной модели. Мониторинг: contention, timeout, renew failure, длительность работы относительно TTL и число параллельных исполнителей; тесты включают process crash, задержку сети и паузу дольше lease. Базовый token+TTL подход описан в [официальных Redis lock patterns](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/); при более строгих требованиях оценить safety assumptions отдельно.

### WebSocket fan-out
<!-- question-id: 33-redis-task04 -->

#### Ответ
**Архитектура.** WebSocket-соединение привязано к конкретному API instance; Redis Pub/Sub использую как межинстансный best-effort канал, а не как хранилище клиентских сообщений. На каждом instance есть локальный registry `roomId → Set<socket>`. После аутентификации сервер проверяет право пользователя на room и подписывает соединение на нужные локальные комнаты. Событие, созданное сервисом, публикуется один раз в канал `ws:room:<tenant>:<room>`; каждый API instance получает publish и рассылает его только своим локальным socket-ам этой комнаты.

Payload — компактный versioned event с `eventId`, типом, room/tenant, временем и минимально необходимыми данными; секреты, access token и лишний PII не публикуются. Аутентификацию выполняют на handshake, authorization — при join и при изменениях членства; нельзя доверять room ID из клиента. Для глобальных событий применяют отдельный ограниченный channel, а не wildcard подписку на весь tenant без контроля. Если комнаты очень большие, partition/shard channels и нагрузку по fan-out планируют заранее.

**Надёжность и масштабирование.** Pub/Sub имеет at-most-once delivery: disconnect subscriber или Redis outage означает потерю события. Поэтому этот путь подходит для typing/presence/обновления UI, которые можно восстановить повторной загрузкой snapshot. Для важных уведомлений записываю event в durable Stream/outbox, а клиент хранит cursor или запрашивает состояние после reconnect; клиентские handlers дедуплицируют `eventId`. Redis Streams/DB event log выбирают для replay и ack, но всё равно задают retention и идемпотентность.

Медленный WebSocket client не должен бесконечно наращивать memory queue: применяются bounded buffer, drop/coalesce для replaceable state, disconnect или повторная синхронизация с snapshot. В Redis Pub/Sub нет consumer backpressure/ack для доставки приложению, поэтому следим за publish rate, subscriber count, network egress, event loop lag, buffer size, reconnects и fan-out latency; используем горизонтальное масштабирование и лимиты на число соединений/комнат. При отказе Redis локальные подключения остаются, но межинстансный fan-out деградирует: политика — деградировать realtime, а не блокировать основной API. В Redis OSS 8.x актуальная базовая модель Pub/Sub остаётся best-effort at-most-once; официально для replay и retention Redis предлагает Streams ([Pub/Sub](https://redis.io/docs/latest/develop/pubsub/), [Streams](https://redis.io/docs/latest/develop/data-types/streams/)).
