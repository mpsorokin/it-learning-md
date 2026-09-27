# Production Debugging Symptoms

## Interview questions

### API иногда возвращает duplicate records.
<!-- question-id: 41-production-debugging-task01 -->

Я буду давать тебе симптомы:

И спрашивать, где искать.

И мы строим diagnosis tree.

#### Ответ

Сначала уточняю, где виден duplicate: одинаковые строки в одном HTTP response, повторные записи в БД или повторный рендер/запрос в UI; беру request ID, tenant, query params и временной диапазон. Сравниваю raw response, SQL result и frontend state. В SQL проверяю JOIN 1:N, неверный join key, отсутствие DISTINCT там, где он семантически оправдан, pagination до/после join и несколько реплик чтения. Для повторных INSERT проверяю retry после timeout, двойной submit, consumer redelivery и отсутствие idempotency key.

Далее воспроизвожу тот же запрос на snapshot/тестовых данных и ищу первопричину. Если уникальность является бизнес-инвариантом, закрепляю её UNIQUE constraint в PostgreSQL и делаю insert/upsert транзакционно; предварительный SELECT не защищает от гонки. Для at-least-once доставки обработчик должен быть идемпотентным по event ID. UI отдельно дедуплицирует только как защиту отображения, не как исправление данных. Добавляю метрику duplicate rate и regression test, затем удаляю уже накопившиеся повторы контролируемой миграцией с backup и правилом выбора canonical row.

### После deploy p95 вырос с 150 до 800 ms.
<!-- question-id: 41-production-debugging-task02 -->

Я буду давать тебе симптомы:

И спрашивать, где искать.

И мы строим diagnosis tree.

#### Ответ

Сначала проверяю, что сравнение корректно: тот же endpoint, нагрузка, region, client mix и окно; делю latency по route/status/tenant, p50/p95/p99 и по свежему commit. В traces ищу, где добавилось время: очередь на ingress, приложение, DB pool/SQL, внешний сервис или сериализация. Сопоставляю error rate, throughput, CPU/memory, GC, connection pool, cache hit и DB waits. Если SLO нарушен, остановить rollout или вернуть предыдущий digest важнее долгого расследования на пользователях.

Сравниваю canary и baseline на одинаковом traffic split, смотрю diff кода/config/schema и профилирую горячие запросы. Типовые причины: N+1, новый full scan, потерянный индекс, блокирующая миграция, connection pool saturation, холодный cache, retry storm или синхронный вызов нового внешнего API. Проверяю запросы с EXPLAIN (ANALYZE, BUFFERS) только безопасно и на соответствующих данных; ANALYZE исполняет запрос. Фикс подтверждаю повторным измерением под близкой нагрузкой и проверяю, что error rate не вырос. Добавляю trace/метрику и performance regression test или budget, а не оптимизирую по одному локальному замеру.

### React page делает 11 запросов вместо 3.
<!-- question-id: 41-production-debugging-task03 -->

Я буду давать тебе симптомы:

И спрашивать, где искать.

И мы строим diagnosis tree.

#### Ответ

Сначала выясняю, где считать 11: browser Network tab показывает method, initiator, URL, timing, cache и request payload; серверные access logs/traces связываю по trace ID. Сравниваю production build с development: React Strict Mode в dev может повторно вызывать некоторые циклы эффектов, поэтому это не следует автоматически принимать за production регрессию. Ищу waterfall из последовательных fetch, N+1 по карточкам, повторный запрос из useEffect при меняющейся ссылке, дублирующую загрузку RSC и client fetch, refetch-on-focus/retry или повторное монтирование.

Затем группирую запросы по данным и владельцу, проверяю dedupe/cache key в query library и отмену устаревшего запроса. Если сервер уже знает данные при SSR/RSC, не дублирую их без причины на клиенте; если нужны несколько независимых сущностей — параллелю или создаю агрегирующий endpoint, учитывая ограничения и права доступа. Удалять запрос безопасно только после проверки freshness/ошибок. Добавляю assertion на критичное число network calls в e2e либо трассировке, и регрессионно проверяю именно production bundle.

### После масштабирования WebSocket на 3 replicas часть сообщений исчезает.
<!-- question-id: 41-production-debugging-task04 -->

Я буду давать тебе симптомы:

И спрашивать, где искать.

И мы строим diagnosis tree.

#### Ответ

Три реплики имеют три локальных набора WebSocket-соединений. Если событие публикуется только в памяти одной реплики, клиенты на двух других его не увидят; sticky sessions сохраняют соединение к узлу, но не обеспечивают fanout между узлами и replay после disconnect. Проверяю: пропускаются все события или только при multi-replica, какой gateway принял emit, присутствует ли общий Redis/NATS/Kafka adapter, как устроены комнаты/подписки, reconnect и балансировщик. Логирую event ID и connection ID на ingress, publish, fanout и client ack, не payload с секретами.

Если событие ephemeral, общий broker/adapter решает межрепличный fanout, но Pub/Sub может потерять публикацию при разрыве подписки. Для надёжной доставки сохраняю событие/outbox в durable store, выдаю sequence/cursor, при reconnect клиент запрашивает события после последнего cursor и дедуплицирует повтор. Добавляю ack, bounded retry и backpressure; при медленном consumer не накапливаю бесконечный буфер. Провожу fault test: restart брокера, отключение узла, reconnect, rolling deploy. Метрики показывают publish→ack latency, gap/duplicate rate и reconnect count. Гарантию формулирую как at-least-once с дедупликацией, если система не обеспечивает отдельный end-to-end protocol.

### PostgreSQL CPU = 95%, API CPU = 20%.
<!-- question-id: 41-production-debugging-task05 -->

Я буду давать тебе симптомы:

И спрашивать, где искать.

И мы строим diagnosis tree.

#### Ответ

Высокий CPU БД при низком CPU API говорит о том, что вычисление/ожидание сосредоточено на стороне PostgreSQL, но сначала исключаю ошибку метрик и перегрузку других ресурсов. Смотрю нагрузку во времени, active queries, wait_event, количество connections, transaction age, locks, I/O и replication lag. По pg_stat_statements ранжирую запросы по total_exec_time, calls и rows; проверяю частоту, рост после deploy и query fingerprints. Для горячих запросов изучаю EXPLAIN (ANALYZE, BUFFERS) на репрезентативном окружении: план, scan, join, sort, estimate vs actual rows. EXPLAIN ANALYZE исполняет запрос, поэтому осторожно отношусь к тяжёлой production-команде.

Частые причины: отсутствующий/неподходящий индекс, низкая селективность, плохая статистика, N+1, крупные сортировки, неограниченная выборка, lock contention, слишком много параллельных запросов или retry storm. Низкий API CPU может означать ожидание пула/DB, а не малую нагрузку. Сначала ставлю предохранитель: ограничиваю concurrency/частоту тяжёлого endpoint, отключаю опасный rollout или применяю read replica лишь если запросы допускают lag. Не масштабирую БД вслепую. После исправления повторяю тот же замер и добавляю query/latency budget, нагрузочный сценарий и алерт на pool wait/slow query. [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) и [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html).
