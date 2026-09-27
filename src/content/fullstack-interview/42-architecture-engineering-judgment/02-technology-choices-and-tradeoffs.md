# Technology Choices and Trade-offs

## Interview questions

### Когда SQL лучше NoSQL?
<!-- question-id: 42-architecture-engineering-judgment-q10 -->

#### Ответ

SQL обычно лучше, когда данные имеют чёткие отношения и ограничения, нужны транзакции между сущностями, ad hoc запросы, joins, уникальность и эволюция схемы с контролируемыми миграциями. PostgreSQL даёт strong relational constraints и гибкие запросы, но schema design и write contention требуют осмысленного проектирования. Если инвариант важен, закрепляю его constraint-ом, а не только приложением.

NoSQL имеет смысл при подходящем access pattern и измеренных требованиях: например, key-value lookup с горизонтальным масштабированием, документ с естественной атомарной границей или большие распределённые записи с выбранной моделью консистентности. Нужно заранее учитывать дублирование данных, ограничения query/index, eventual consistency и миграцию формата. Не выбираю тип БД только по словам «масштаб» или «гибкая схема»; сравниваю реальные запросы, объём, consistency, failure model и эксплуатационную зрелость команды.

### Когда React Query лучше Redux?
<!-- question-id: 42-architecture-engineering-judgment-q11 -->

#### Ответ

React Query/TanStack Query подходит для server state: удалённые сущности, запросы, кэш по ключу, refetch, invalidation, retries и mutation lifecycle. Redux — общий предсказуемый client state, где нужны единая модель переходов, сложные coordinated updates, middleware, devtools или существующая экосистема. Это не взаимоисключающие роли: server state часто остаётся в query cache, локальный draft/selection — локально или в Redux.

Не дублирую одну сущность в Redux и query cache без чёткой синхронизации: иначе непонятно, какой источник истинен. Выбор зависит от частоты обновлений, offline/optimistic требований, количества общих потребителей и знакомой команде модели. [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) описывает кэширование server state; Redux Toolkit рекомендует RTK Query для fetching/caching, если проект использует Redux. [Redux Toolkit Query](https://redux-toolkit.js.org/rtk-query/overview).

### Когда Context лучше Zustand?
<!-- question-id: 42-architecture-engineering-judgment-q12 -->

#### Ответ

Context подходит для относительно стабильных значений, нужных многим потомкам: тема, locale, зависимости или auth snapshot, если чтение/обновление частота невысока. Он встроен в React и не добавляет внешнее состояние. При изменении Provider value consumers, читающие этот context, могут перерендериться; большой объект, часто обновляемый или содержащий несвязанные поля, расширяет стоимость обновления. Разделение контекстов по ответственности и стабильная ссылка помогают, но не превращают Context в селекторный store.

Zustand или другой store полезен при независимых подписках на slices, частых updates, действиях вне React и требуемых middleware/devtools. Он добавляет зависимость и собственные соглашения. Для небольшой настройки не нужен отдельный store; для сложного взаимосвязанного состояния Context может стать самодельным неудобным state manager. [React useContext](https://react.dev/reference/react/useContext) описывает обновление consumers по context value.

### Когда NestJS лучше plain Fastify?
<!-- question-id: 42-architecture-engineering-judgment-q13 -->

#### Ответ

NestJS полезен команде, которой нужны conventions и структурные primitives: modules, dependency injection, guards/interceptors, pipes, testing integration, WebSocket/transport abstraction и единый способ организовать крупный backend. Это уменьшает число архитектурных решений и облегчает onboarding, но имеет learning curve, framework overhead и часть DI/runtime indirection.

Plain Fastify подходит для небольшого сервиса или команды, которая хочет напрямую контролировать plugin lifecycle, encapsulation и HTTP слой без opinionated application framework. Он не означает «без архитектуры»: boundaries, validation, authorization, logging и testing всё равно надо установить. Nest может использовать Fastify adapter, если нужны Nest conventions с другим HTTP platform adapter; benchmark следует проводить на реальной нагрузке, а не принимать теоретический overhead как решающий. [Nest first steps](https://docs.nestjs.com/first-steps) и [Fastify](https://fastify.dev/docs/latest/Reference/).

### Когда Next backend достаточно?
<!-- question-id: 42-architecture-engineering-judgment-q14 -->

#### Ответ

Next backend достаточно, когда задача — server-side composition/BFF для одного web-приложения: читать данные для Server Components, проксировать ограниченный API, выполнять мутации и управлять веб-сессией в рамках общего deploy/release. Это уменьшает hop и дублирование frontend/backend моделей, если доменная граница невелика. Route Handlers и Server Actions имеют разные роли; Action — mutation boundary, а не универсальная замена API для произвольных клиентов.

Проверяю deployment runtime: в serverless окружении процесс может завершаться после запроса, поэтому нельзя рассчитывать на долговечный in-memory state, постоянное соединение или WebSocket gateway. Документация Next отдельно предупреждает об ограничениях некоторых lambda deployment для WebSockets; durable background work выносится в queue/worker. Проверяю current docs именно выбранной версии App Router: API и cache model менялись. [Next backend for frontend](https://nextjs.org/docs/app/guides/backend-for-frontend) и [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).

### Когда нужен отдельный Nest backend?
<!-- question-id: 42-architecture-engineering-judgment-q15 -->

#### Ответ

Отдельный Nest backend оправдан, когда есть несколько клиентов (web/mobile/partners), публичный стабильный API, отдельное доменное владение, фоновые workers, долгоживущие WebSocket соединения, независимые scaling/security/deploy требования или backend release cadence расходится с Next приложением. Nest также может задать единый transport/domain слой и DI/testing conventions для большой команды.

Разделение имеет стоимость: второй deployable, сеть и auth между сервисами, versioned contracts, observability, дополнительная инфраструктура, failure/retry/timeout handling и риск дублировать одну бизнес-логику. Я бы не выносил backend только чтобы «слои были правильнее». Сначала отмечаю конкретные constraints Next deployment и измеряю скорость/нагрузку; если Next остаётся BFF, он вызывает доменный API через явный контракт, не создавая второй слой без ответственности.

### Как принимать решение при неполных требованиях?
<!-- question-id: 42-architecture-engineering-judgment-q16 -->

#### Ответ

Сначала разделяю неизвестное, которое меняет архитектуру, от деталей реализации. Спрашиваю про пользователей/клиентов, основные workflows, data ownership, latency/availability, security/compliance, ожидаемую нагрузку и дату/команду поддержки. На неизвестные ставлю явные assumptions и диапазоны, а не выдаю одно значение за факт. Затем называю самое рискованное предположение и дешёвый способ проверить его: spike, нагрузочный тест, прототип или интервью с владельцем процесса.

При высокой неопределённости предпочитаю обратимое решение с небольшим blast radius: ясный модульный контракт и возможность заменить implementation без миграции всех потребителей. Сравниваю минимум две реалистичные альтернативы по стоимости владения и failure modes. Фиксирую decision record с контекстом, выбранным вариантом, причинами, что может изменить решение и сигналами пересмотра. Это позволяет двигаться, не маскируя неизвестность.

### Как оценивать trade-offs?
<!-- question-id: 42-architecture-engineering-judgment-q17 -->

#### Ответ

Я перечисляю критерии, связанные с требованиями: correctness/consistency, p95 latency, availability, security, team delivery speed, cost, operational burden и reversibility. Для каждого варианта указываю, что выигрываем, что ухудшаем и кто принимает цену. Затем ранжирую критерии по важности для конкретного сценария и подкрепляю спорные оценки прототипом или production-метрикой. Не складываю несопоставимые вещи в псевдоточный score без весов и доказательств.

Отдельно называю failure modes и переходную стоимость: миграции, rollback, обучение команды и observability. Указываю допущения, временные горизонты и точку пересмотра. Хорошее решение не обязано быть универсально оптимальным — оно должно удовлетворять жёстким ограничениям и обеспечивать самый приемлемый компромисс для текущей команды/продукта. Если trade-off затрагивает безопасность или корректность данных, это guardrail, а не просто ещё один балл.

### Как уменьшать complexity budget?
<!-- question-id: 42-architecture-engineering-judgment-q18 -->

#### Ответ

Уменьшать complexity budget стоит там, где поддержка уже дороже измеримой пользы. Сначала нахожу причины: лишние сервисы/брокеры/cache, дублирующее состояние, абстракции с одним клиентом, флаги без владельца, повторные ручные процессы. Для каждого оцениваю не только строку кода, но и deploy, monitoring, upgrade, incident path и mental load команды. Не удаляю единственную защиту надёжности только ради упрощения диаграммы.

Упрощаю поэтапно: зафиксировать поведение и метрики, определить владельца и migration/rollback plan, убрать одну границу/зависимость, затем измерить результат. Сохраняю инварианты и audit/security checks. Приоритет — снижение числа движущихся частей и failure modes без ухудшения SLO. Завершённая simplification удаляет неиспользуемый код, dashboards, alerts и документацию, иначе формальная сложность останется в процессе.
