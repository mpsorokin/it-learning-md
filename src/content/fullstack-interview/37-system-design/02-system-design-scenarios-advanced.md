# System Design Scenarios: Advanced Products

## Interview questions

### Booking system
<!-- question-id: 37-system-design-task07 -->

Для каждого:

Requirements
→ API
→ data model
→ components
→ request flows
→ scaling
→ cache
→ queues
→ consistency
→ failures
→ security
→ observability
→ trade-offs

#### Ответ

**Предположения и требования.** Есть ограниченный inventory (место/слот/номер), несколько клиентов могут конкурировать за одну единицу; не допускаем oversell. Уточняю модель ресурса, длительность hold, оплату, отмены, часовые пояса и требование к подтверждению.

- **API/данные.** `GET /availability` — best-effort чтение; `POST /reservations` требует idempotency key и возвращает hold/конфликт, `POST /confirm` завершает бронь. Реляционная БД хранит Inventory/Slot, Reservation (`held`, `confirmed`, `expired`, `cancelled`), owner, expiry, price snapshot и версию. Уникальность на ресурс/слот и атомарный conditional update или блокировка строки обеспечивают единственного победителя.
- **Путь.** Поиск читает реплики/cache, но финальная резервация идёт только в authoritative write store. В одной транзакции проверяется доступность и создаётся hold с TTL. Оплата запускается снаружи; успешная команда переводит в confirmed, отказ освобождает hold. Worker истечения обрабатывает просроченные записи идемпотентно; финальная проверка expiry в транзакции защищает от гонки worker-а и оплаты.
- **Надёжность/согласованность.** Состояния платежа и брони координирует saga; timeout оплаты означает неопределённый результат, поэтому проверяется provider operation, а не сразу освобождается ресурс. Используются outbox, idempotency, reconciliation и явный 409 при конфликте. Очереди не являются источником истины по остаткам.
- **Безопасность и масштаб.** Авторизую пользователя/организатора, защищаю от массового захвата слотов rate limits и CAPTCHA/abuse controls при необходимости. Партиционирую по ресурсу/дате, отдельно обрабатываю hot inventory; кэш availability может устареть и никогда не подтверждает бронь.
- **Наблюдаемость/trade-offs.** SLI: успешность reservation, hold-to-confirm, p95, конфликт/oversell (целевой ноль), просроченный hold и backlog. Строгая консистентность остатка снижает доступность при проблемах write store, но нужна там, где ресурс нельзя продать дважды; чтение можно масштабировать слабее согласованно.

### Payment/subscription service
<!-- question-id: 37-system-design-task08 -->

Для каждого:

Requirements
→ API
→ data model
→ components
→ request flows
→ scaling
→ cache
→ queues
→ consistency
→ failures
→ security
→ observability
→ trade-offs

#### Ответ

**Предположения и требования.** Сервис создаёт разовые платежи и периодические подписки через внешний PSP; сам не хранит PAN/CVV. Требования к PCI scope, валютам, налогам, возвратам, grace period и юридической отмене уточняются заранее.

- **API/модель.** `POST /payments` и `POST /subscriptions` принимают idempotency key; запрос отдаёт operation/payment ID и начальный статус. В БД хранятся Customer/PaymentAttempt/Subscription/Entitlement, суммы в minor units плюс ISO currency, provider reference, статусы и версии. Денежные проводки ведутся append-only ledger с балансирующей сверкой, а не перезаписываемым полем «остаток».
- **Путь/согласованность.** Создаю попытку транзакционно, вызываю PSP по idempotency key, но не считаю таймаут ни отказом, ни оплатой — запрашиваю статус/жду подписанный webhook. Webhook проверяет подпись, timestamp и replay, дедуплицируется по provider event ID; из-за дубликатов/неупорядоченности допустимы только валидные переходы состояний. Outbox запускает entitlement/дальнейший workflow; для renewal работают scheduler + очередь, ограниченные повторы и dunning.
- **Отказы и безопасность.** Saga обрабатывает частичные шаги, компенсация возврата — отдельная операция. Reconciliation сверяет ledger, подписки и отчёт PSP. Секреты изолированы, данные минимизируются и шифруются; платёжные данные токенизируются у провайдера, роли и аудит ограничивают операции refund/cancel. Проверяются подписанные webhook-и и фиксируется происхождение команды.
- **Масштаб/наблюдаемость.** БД транзакционна для локальных финансовых изменений, очереди обрабатывают уведомления и выдачу прав; кэш допустим для плана, но не для авторитетного статуса платежа. Метрики: успешность авторизации, webhook lag/duplicates, renewal failure, reconciliation delta, refund и ledger imbalance; trace связывает попытку с PSP без записи секретов.
- **Компромиссы.** Авторитетный финансовый статус важнее мгновенной выдачи доступа, поэтому entitlement может иметь короткую задержку с отображением `processing`. Отдельный ledger усложняет реализацию, но даёт аудит и сверяемость; автоматические повторы платежа ограничивают политикой, чтобы не создавать неожиданные списания.

### Analytics ingestion
<!-- question-id: 37-system-design-task09 -->

Для каждого:

Requirements
→ API
→ data model
→ components
→ request flows
→ scaling
→ cache
→ queues
→ consistency
→ failures
→ security
→ observability
→ trade-offs

#### Ответ

**Предположения и требования.** Много производителей отправляют аналитические события, которые нужны для отчётов/агрегаций с задержкой; потеря части данных допустима только если явно определён режим best-effort. Уточняю peak ingress, размер batch, latency до dashboard, retention, privacy и требования к удалению.

- **API/модель.** Batch endpoint принимает producer/tenant, schema version, event IDs, occurredAt и типизированный payload; ответ различает принятые и отклонённые элементы. Gateway проверяет auth, размер/частоту, схему и квоту, затем быстро подтверждает durable append. Сырые события хранятся append-only в object storage/data lake; агрегаты и оперативные метрики — в подходящем query store.
- **Путь/масштаб.** Вход пишет в partitioned log/queue, ключ партиционирования выбирается под нужный порядок (например, tenant/entity; один глобальный порядок обычно не нужен). Consumers валидируют схемы, дедуплицируют event ID в ограниченном окне, считают stream aggregates и периодически сохраняют raw batches. Backpressure через квоты/429/load shedding, компрессию и контролируемый lag лучше, чем бесконтрольный рост памяти.
- **Согласованность/сбои.** При at-least-once доставке идемпотентность нужна downstream; offsets коммитятся после надёжной обработки. Некорректные события уходят в quarantine/DLQ с причиной и безопасным replay; schema registry и совместимые изменения предотвращают поломку старых producers. Event time и ingestion time хранятся отдельно для late arrivals.
- **Безопасность.** События проверяются по tenant identity и schema allowlist, payload имеет лимиты и защита от инъекций; отбрасываются платёжные секреты и лишние PII. Шифрование, retention, consent и запросы на удаление распространяются также на raw storage и производные агрегаты, где это требуется.
- **Наблюдаемость/trade-offs.** SLI: ingest accepted/rejected, durable ack latency, consumer lag/oldest age, malformed rate, completeness и стоимость хранения. Высокая задержка/очередь повышает свежесть цену ресурса; batch/partitioning снижают стоимость, но дают eventual consistency. Нужны контроль схемы и data quality, иначе технически успешный ingestion производит неверную аналитику.

### Marketplace
<!-- question-id: 37-system-design-task10 -->

Для каждого:

Requirements
→ API
→ data model
→ components
→ request flows
→ scaling
→ cache
→ queues
→ consistency
→ failures
→ security
→ observability
→ trade-offs

#### Ответ

**Предположения и требования.** Платформа связывает покупателей и продавцов, показывает каталог, принимает заказы/оплату и организует выполнение/возвраты. Уточняю, кто merchant of record, модель запасов, выплаты, комиссии, модерацию и страны/налоги. Начал бы с модульного монолита, пока независимые границы не доказаны нагрузкой или владением.

- **API/данные.** Разделяю listing/catalog, seller, cart, order, inventory, payment/payout и search модели. `Order` содержит immutable snapshot цены, валюты, продавца и строк; API checkout принимает idempotency key. Search index — производная проекция, а inventory и ledger имеют authoritative write path.
- **Путь.** Checkout фиксирует сумму/условия, резервирует остаток, создаёт заказ и запускает оплату через saga. Локальные транзакции и outbox обеспечивают доставку между модулями/сервисами; payment/inventory отказ ведёт к компенсирующему снятию резерва или возврату. Каталог обновляется в search асинхронно, а продавец получает отслеживаемый статус заказа и выплаты.
- **Согласованность/масштаб.** Каталог и рекомендации можно кэшировать/CDN, обновления eventual; продажа товара, расчёт суммы и финансовый ledger проверяются на write owner. Масштабирую поисковое чтение отдельно, partitioning делаю по рынку/tenant только когда подтверждена нагрузка. Не разрешаю сервисам напрямую менять чужие таблицы.
- **Сбои/безопасность.** Идемпотентность заказов, webhook verification, reconciliation с PSP, retry/backoff, DLQ и операционный replay. Владелец может редактировать только свои listing/fulfillment; проверки возврата/выплаты, антифрод, seller verification, rate limits и аудит защищают от злоупотреблений. Персональные и платёжные данные ограничены по доступу и retention.
- **Наблюдаемость/trade-offs.** Отслеживаю conversion funnel, oversell, отмены, chargeback, seller fulfillment, payment/refund reconciliation, latency и saga backlog. Сильная консистентность для stock/payment дороже и может отклонить конкурентный заказ; eventual search даёт масштаб и приемлемое отставание каталога.

### Dating/matching app
<!-- question-id: 37-system-design-task11 -->

Для каждого:

Requirements
→ API
→ data model
→ components
→ request flows
→ scaling
→ cache
→ queues
→ consistency
→ failures
→ security
→ observability
→ trade-offs

#### Ответ

**Предположения и требования.** Пользователь создаёт профиль, получает ограниченную выдачу кандидатов и может like/pass; взаимные likes образуют match. Уточняю географию, возрастные/региональные правила, приватность, блокировки, гео-точность, модерацию и критерии качества ранжирования.

- **API/модель.** `GET /discovery?cursor=...`, `POST /decisions` с парой actor/target и `like|pass`, `GET /matches`. Профиль и настройки доступа хранятся отдельно от `Decision`; уникальный индекс на направленную пару обеспечивает повторобезопасность. `Match` имеет нормализованную неупорядоченную пару и статус/время. Состояние block/report — авторитетное и проверяется при выдаче и действии.
- **Путь/масштаб.** Candidate service сначала применяет eligibility/privacy/geo фильтры, затем ограниченный ranker возвращает cursor-страницу. Решение транзакционно записывается; если обратный like существует, создаётся match идемпотентно и через outbox отправляется уведомление. Кандидаты можно кэшировать коротко, но блокировка или удаление профиля инвалидирует/фильтрует cache.
- **Согласованность/отказы.** Взаимный match фиксируется с уникальным constraint, обработка event допускает дубликаты. Выдача может быть eventual, но не должна показать уже заблокированного пользователя — ACL/block проверяется на read path. При отказе ранжировщика fallback — безопасный базовый алгоритм, а не расширение приватного доступа.
- **Безопасность.** Минимизирую геолокацию и срок хранения точных координат, отдаю округлённое расстояние, проверяю возраст и региональные ограничения, rate-limit-ю likes/messages, предотвращаю enumeration, поддерживаю block/report/moderation и удаление аккаунта. Доступ к чувствительным профилям аудитируется.
- **Наблюдаемость/trade-offs.** Метрики: latency, empty candidate rate, взаимные match, жалобы/block, freshness, queue lag и качество по сегментам с privacy controls. Гео/интересы улучшают релевантность, но усиливают чувствительность персональных данных. Начинаю с объяснимого rule-based ranking; ML добавляю при наличии данных и проверки смещений/безопасности.

### TikTok-Shop-like integration platform
<!-- question-id: 37-system-design-task12 -->

Для каждого:

Requirements
→ API
→ data model
→ components
→ request flows
→ scaling
→ cache
→ queues
→ consistency
→ failures
→ security
→ observability
→ trade-offs

#### Ответ

**Предположения и требования.** Платформа соединяет торговые аккаунты с внешними commerce/social системами: синхронизирует catalog, orders, inventory и webhooks. Внешние API имеют разные схемы, квоты, версии и временную доступность; локально нельзя обещать атомарность с чужой системой.

- **API/модель.** API подключает tenant/account, scopes, mapping и настройки sync; job API возвращает operation ID/status. Есть канонические Product/Order/Inventory модели, отдельные adapter-ы на платформу и сохраняемые raw external IDs/версии. Secrets лежат в secret store и изолированы tenant/platform; конфигурация имеет audit trail.
- **Путь/очереди.** Изменение локального каталога пишет outbox; job partition-ится по tenant+connector, adapter переводит каноническую модель в API конкретной платформы. Входящий webhook сначала проверяет подпись и dedupe ID, фиксирует событие и только затем enqueue-ит обработку. Для каждой платформы/tenant действуют квоты и concurrency limit; large payload идут как reference в storage, не в очередь.
- **Надёжность/согласованность.** Внешний вызов может завершиться успешно при потерянном ответе — нужны idempotency key, reconciliation/poll и управляемый повтор. Учитываю rate limit headers, bounded retry/backoff/jitter, circuit breaker и DLQ с replay. Состояния sync явны: queued/running/succeeded/partial/failed; прогресс и ошибки доступны пользователю. Не предполагаю exactly-once или общий rollback через провайдера.
- **Безопасность.** Минимальные OAuth scopes, encrypted token storage/rotation/revocation, signature/timestamp/replay validation webhook-ов, tenant isolation и проверка ownership каждой операции. Защита от SSRF при любых callback/fetch URL, ограничение payload, скрытие токенов в logs и аудит администраторских действий обязательны.
- **Масштаб/observability/trade-offs.** Метрики по connector-у/tenant-у: queue age, sync lag, API quota, rate limit, error class, retries, DLQ, drift между локальной и remote state; trace/correlation ID проходит через job metadata. Canonical model упрощает общий продукт, но не должна стирать уникальные возможности платформ — оставляю versioned extension fields/adapter policy. Сильная локальная модель и eventual sync дают управляемость ценой временного расхождения с provider.
