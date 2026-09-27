# Scaling Realtime Systems

## Interview questions

### Horizontal scaling.
<!-- question-id: 29-websocket-sse-q16 -->

#### Ответ
WebSocket соединение остаётся закреплённым за одним gateway instance, а socket map обычно локальна. Для горизонтального масштабирования нужны connection-aware LB/ingress, распределённые подписки/fanout и отдельная модель хранения durable state; sticky routing может помочь с локальным state, но не переносит события к сокету на другом узле. Разбейте каналы по room/tenant, вычислите fanout hot spots, лимиты file descriptors/memory/bandwidth и graceful drain при deploy. При падении узла клиенты reconnect-ятся с jitter, повторной auth и replay cursor. Pub/sub удобно для transient broadcast; для истории/гарантий нужен durable log. Проверьте TLS termination, idle timeouts, readiness и нагрузочные сценарии на реальной топологии.

### Sticky sessions.
<!-- question-id: 29-websocket-sse-q17 -->

#### Ответ
Sticky sessions направляют новые подключения одного клиента на выбранный backend, что помогает, когда handshake/session/socket registry находится только в памяти узла или stateful auth требует локального context. Уже установленный TCP socket и так остаётся на выбранном сервере; sticky не решает межузловой broadcast, failover, replay или равномерное распределение нагрузки. Она усложняет rebalance/deploy, может создать hot nodes и теряет локальный state при падении сервера. Если identity и подписки восстанавливаются из общего хранилища/брокера, а каждый узел умеет обрабатывать соединения stateless, sticky может быть не нужна. Выберите по реальной необходимости сессии, а не как substitute for distributed fanout.

### Redis Pub/Sub.
<!-- question-id: 29-websocket-sse-q18 -->

#### Ответ
Redis Pub/Sub позволяет gateway публиковать room event без знания, на каком экземпляре подключён каждый получатель: все подписанные узлы получают публикацию и делают local fanout своим sockets. Это быстрый ephemeral broadcast, но Redis документирует at-most-once semantics: subscriber, отсутствовавший при публикации или потерявший сообщение, его не воспроизведёт; подтверждения обработки и история не входят в Pub/Sub. Поэтому храните сообщение в DB/Redis Streams/Kafka/outbox до публикации, включайте event ID и partition sequence, а reconnect восстанавливайте из durable источника. ACL/namespace изолируют tenant channels, payload validate/authorize до publish, большие комнаты не должны создавать синхронный broadcast hot spot. [Redis delivery semantics](https://redis.io/docs/latest/develop/pubsub/).

### Presence.
<!-- question-id: 29-websocket-sse-q19 -->

#### Ответ
Presence — приблизительное состояние online/away, а не источник истины для бизнес-решения. Храните lease/heartbeat с TTL по user и отдельным connection ID (пользователь может иметь несколько устройств); успешный heartbeat продлевает expiry, явный disconnect — ранняя очистка, timeout убирает записи при crash. При гонках обновляйте атомарно и учитывайте, что поздний close одного сокета не должен стереть активность другого. На сеть/паузы процесса и мобильный sleep неизбежно будут false offline/online, поэтому состояние eventual и UI должен переживать это. Шардируйте room/user key, агрегируйте события вместо broadcast каждого heartbeat, установите rate/TTL и не используйте presence для разрешения доступа.

### Backpressure.
<!-- question-id: 29-websocket-sse-q20 -->

#### Ответ
Backpressure возникает, когда producer отправляет быстрее, чем клиент/сеть/consumer успевает прочитать: очереди и memory растут, затем latency и OOM. Браузерный WebSocket API не имеет механизма receive-side backpressure; bufferedAmount показывает лишь очередь исходящих данных и не гарантирует, что peer уже обработал их. На sender ограничивайте очередь/размер, измеряйте lag, coalesce/drop устаревшие state updates, замедляйте producer через credits/ACK или закрывайте slow consumer по политике. На сервере применяйте framework stream high-water marks/pause-resume, per-user quotas и таймауты. Не ограничивайтесь ping. Конкретные методы и буферы зависят от runtime/library. [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

### Спроектировать realtime chat:
<!-- question-id: 29-websocket-sse-task01 -->

Next frontend
→ Nest WebSocket gateway
→ Redis
→ multiple backend instances

#### Ответ
Предположения: chat messages должны сохраняться, room имеет ограниченный membership, gateway запускается в нескольких Nest instances, браузер подключается через wss. Во время upgrade gateway валидирует session/ticket и точный Origin; после handshake клиент посылает subscribe с room ID, сервер проверяет членство и ограничивает число rooms/frames/rate. На send server повторно авторизует, валидирует schema/length, создаёт message ID и коммитит запись + outbox event атомарно. Publisher доставляет outbox в Redis Pub/Sub по room; все gateway instances с локальными участниками делают fanout. Pub/Sub — только live transport (at-most-once), не история: при connect/reconnect клиент загружает историю/replay по sequence cursor из DB/Streams, дедуплицируя message ID. Если нужен порядок в комнате, присваивайте sequence одному room partition/DB log; не обещайте глобальный order. На клиенте reconnect с exponential backoff+jitter, heartbeat/ping, ограниченная очередь и ACK/duplicate handling. Presence — TTL lease на user+connectionId. Масштабируйте по числу sockets, fanout/room, memory и broker partitions; graceful drain отправляет reconnect hint, а deploy/failure не теряет сохранённые сообщения.

