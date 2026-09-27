# Passport, Permissions, and Auth Flow

## Interview questions

### Passport.
<!-- question-id: 27-nestjs-authentication-authorization-q08 -->

#### Ответ

Passport — распространенная Node.js-библиотека, которая предоставляет стратегии для проверки credentials и интеграций с identity providers. Nest-интеграция @nestjs/passport связывает strategy с DI и guards: в strategy метод validate проверяет входные данные через сервис приложения и возвращает ограниченный объект пользователя; guard запускает нужную strategy и помещает результат в request.user. Входные ошибки должны быть нормализованы так, чтобы не раскрывать, существует ли конкретный email или какой именно фактор не прошел проверку.

Passport решает механику аутентификации, но сам по себе не проектирует lifecycle сессии, хранение refresh tokens, MFA, authorization конкретного ресурса или защиту от brute force. В production пароль сравнивают с современным адаптивным password hash, а не с plaintext; секреты JWT и OAuth client credentials приходят из конфигурации/secret store. Проверяйте, что объект, возвращенный из validate, не содержит password hash, recovery codes или другие внутренние поля.

### Guards.
<!-- question-id: 27-nestjs-authentication-authorization-q09 -->

#### Ответ

Guard в Nest реализует CanActivate и решает, передавать ли запрос route handler. В отличие от middleware, он получает ExecutionContext и может видеть handler/controller и их metadata; метод canActivate может вернуть boolean, Promise или Observable. Guard выполняется после middleware, но до interceptor и pipe. В типичном HTTP приложении middleware выполняет общую подготовку, authentication guard валидирует credentials и формирует principal, authorization guard применяет политику, а handler/service выполняет бизнес-операцию.

Guards можно привязать к методу, controller или всему приложению. Глобальный default-deny auth guard удобен для закрытой API: public routes явно помечаются metadata и guard обрабатывает это централизованно. Глобальные guards с зависимостями регистрируют через APP_GUARD provider в модуле. При объединении с Passport guard важно согласовать источник request.user и порядок authentication → authorization; не полагаться на то, что клиент прислал нужную роль в body/header.

Недействительные или отсутствующие credentials обычно дают 401, а отказ авторизованному субъекту — 403. Сам guard не заменяет проверку на уровне доменного сервиса: например, право «редактировать заказ» зависит от владельца, tenant, статуса заказа и текущего действия, поэтому бизнес-инвариант должен проверяться рядом с операцией/данными, а не только по route metadata.

### RBAC.
<!-- question-id: 27-nestjs-authentication-authorization-q10 -->

#### Ответ

RBAC (Role-Based Access Control) назначает пользователям роли, а ролям — наборы разрешений. Это проще поддерживать, чем перечислять права каждого пользователя в каждом route: например, роли viewer/editor/admin могут давать read, update и administration capabilities. В Nest роль часто задают decorator metadata на handler/controller, а guard через Reflector сравнивает требуемые и имеющиеся роли; правила объединения method/class metadata должны быть явными.

RBAC хорошо подходит для coarse-grained доступа, но не отвечает автоматически на вопрос «может ли этот editor изменить именно эту запись». Проверяйте ownership, tenant и состояние ресурса отдельно; не делайте глобальную роль admin способом обойти все tenant границы. Пользователь может иметь несколько ролей, поэтому заранее определите, означает ли список «любая» или «все» роли, и как работают deny/override.

Роли не должны разрастаться в комбинации вроде editor_eu_trial_billing. Если доступ зависит от ресурса, tenant, времени, региона или состояния workflow, используйте permission/policy check. При изменении назначений учитывайте устаревание claims в JWT: для быстрых отзывов перечитывайте актуальные права или применяйте короткую сессию/версию policy.

### ABAC.
<!-- question-id: 27-nestjs-authentication-authorization-q11 -->

#### Ответ

ABAC (Attribute-Based Access Control) принимает решение по атрибутам субъекта, действия, ресурса и контекста: например, пользователь состоит в tenant команды, пытается читать документ, документ классифицирован как internal, а запрос пришел из разрешенной среды. Такая модель точнее RBAC и избегает огромного числа ролей, когда правило зависит от принадлежности, владельца, статуса или времени.

Политика должна быть централизованной и тестируемой: формализуйте входные атрибуты и результат allow/deny, применяйте deny-by-default, логируйте reason code без чувствительных данных и пишите тесты для границ. Nest authorization docs показывают policy guard с metadata и CASL как один из возможных инструментов, но библиотека не является обязательной. Не кладите сложные текущие атрибуты в долго живущий JWT: данные могут устареть или измениться после выдачи.

Важно избежать TOCTOU и IDOR: если разрешение зависит от полей ресурса, загружайте ресурс в нужном tenant и проверяйте policy на сервере в той же бизнес-операции, а для выборок по возможности включайте ограничение в запрос. Guard может отклонить общий запрет до входа в handler, но не должен быть единственным местом для объектных правил.

### Permissions.
<!-- question-id: 27-nestjs-authentication-authorization-q12 -->

#### Ответ

Permission — конкретное действие над типом или экземпляром ресурса, например orders:read, orders:refund или users:invite. Это более точная единица, чем роль: роль обычно является удобной группировкой permissions, а не привилегией сама по себе. При проектировании фиксируют именование, scope (global/tenant/resource), условия и принцип deny-by-default.

Проверка должна включать и capability, и объектный контекст. Наличие orders:read не означает право прочитать любой заказ; условие может быть ownerId = principal.id или membership в организации заказа. Для Nest можно хранить declarative metadata на route и использовать общий policy guard, а внутри use-case выполнять объектную проверку, которая знает состояние домена. Проверки должны быть устойчивы к пропущенной metadata: закрытый endpoint не должен случайно стать public из-за отсутствующей настройки.

Избегайте жестко зашитых копий permission set в долгоживущих токенах. Если права меняются часто, проверяйте текущую membership/версию policy либо применяйте короткоживущие scopes с понятным окном устаревания. Audit log записывает субъект, действие, ресурс и решение, но не секреты или избыточные персональные атрибуты.

### Multi-tenant authorization.
<!-- question-id: 27-nestjs-authentication-authorization-q13 -->

#### Ответ

Tenant — security boundary, а не просто фильтр интерфейса. Tenant context извлекают из проверенной сессии/identity и подтвержденной membership; tenantId из path, header или request body сам по себе не доказывает доступ. Для каждого запроса проверяют членство и роль пользователя именно в выбранном tenant, учитывая, что одна учетная запись может иметь разные права в разных организациях.

На уровне данных tenant ограничение включают в каждый repository/service запрос: SELECT, UPDATE и DELETE должны выбирать tenantId вместе с resourceId, чтобы нельзя было сначала прочитать чужую запись по угадываемому ID. Полезны составные уникальные ключи/foreign keys с tenantId; PostgreSQL Row-Level Security может служить дополнительным слоем, но требует аккуратной настройки connection pooling и session context. Тестируйте cross-tenant IDOR для всех read/write paths, включая вложенные ресурсы и экспорт.

Tenant должен участвовать в cache key, поисковом индексе, idempotency key scope и ключах storage. Background job сохраняет доверенный tenant context и повторно применяет проверки; нельзя полагаться на request-scoped данные после очереди. Административный cross-tenant доступ — отдельное явное разрешение с аудитом и минимальным сроком, а не особый универсальный флаг в обычном пользовательском запросе.

### Cookies vs Authorization header.
<!-- question-id: 27-nestjs-authentication-authorization-q14 -->

#### Ответ

Cookie браузер прикладывает автоматически к подходящим запросам, что удобно для session ID, но создает CSRF-риск: атакующий сайт может инициировать запрос, а браузер приложит cookie. Для сессионной cookie обычно задают Secure, HttpOnly, узкие Domain/Path, осмысленный SameSite и защиту state-changing запросов через CSRF token и/или проверку Origin/Fetch Metadata. CORS сам по себе не предотвращает CSRF: он ограничивает доступ к ответу из браузерного JavaScript, но не обязательно отправку запроса.

Authorization: Bearer передает token явно, поэтому подходит мобильным, CLI и service-to-service клиентам, которым проще контролировать header. Браузер обычно не прикладывает такой header автоматически, что снижает классический CSRF сценарий, но XSS может прочитать токен из JavaScript-доступного storage или выполнить запрос от имени страницы. Bearer credentials требуют TLS, короткого TTL, аккуратного redaction в логах и защиты от утечки URL/telemetry.

Выбор зависит от клиента и границы приложения. Для web BFF часто практичен HttpOnly cookie с opaque server-side session; BFF сам добавляет access token к внутреннему запросу. Для публичной API cookie может быть неудобна из-за CSRF/CORS и доменных ограничений, поэтому используют явно передаваемый bearer token. Нельзя считать ни один транспорт полноценной authorization-проверкой.

### Спроектировать secure auth flow для Next + Nest.
<!-- question-id: 27-nestjs-authentication-authorization-task01 -->

#### Ответ

**Допущения:** Next App Router работает как BFF для web-клиента, Nest — отдельная API; браузеру не требуется напрямую вызывать Nest. Nest-примеры ориентированы на текущую официальную документацию, а встроенная CSRF-защита ниже предполагает NestJS 12.1+. Если выбрана другая версия или Express/Fastify адаптер с собственным middleware, конкретную конфигурацию нужно сверить с соответствующей документацией.

1. При входе Next принимает credentials по TLS, валидирует формат, применяет rate limit по IP и нормализованному account key, проверяет пароль через современный адаптивный hash с откалиброванными параметрами, опционально требует MFA. Ответ одинаков для неизвестного пользователя и неверного пароля; логируется событие без password/token. Session fixation предотвращается выдачей нового случайного session ID после login и повышения привилегий.
2. Браузеру выдается только непрозрачный session cookie с Secure, HttpOnly, Path=/ и подходящим SameSite; данные сессии и refresh state лежат в общем Redis/БД с idle и абсолютным TTL. Next проверяет сессию на каждой server-side границе, а при cookie-authenticated mutations — CSRF/origin. Не помещать секреты в client component, localStorage, URL или Server Action state, который сериализуется клиенту.
3. Next BFF вызывает Nest server-to-server по TLS, используя короткоживущий access token с узкой audience и scopes; токен хранится только на серверной стороне и не доверяет userId/tenantId из тела браузерного запроса. Nest guard проверяет подпись, issuer, audience, exp и допустимый алгоритм, после чего помещает минимальный principal в request context. Следующий policy/service слой проверяет permissions, membership и доступ к конкретной записи; tenant ограничивает сам DB query.
4. Refresh token хранится и ротируется серверно атомарно; повторное использование старого токена отзывает session family и создает security alert. Если Nest принимает cookie напрямую, CSRF должен проверяться и там; в NestJS 12.1+ можно рассмотреть app.enableCsrfProtection(), доверяя только конкретным origins и понимая правила Fetch Metadata. Для более ранней версии нужен документированный token-based подход. CORS разрешает только необходимые origins и методы, но не считается заменой CSRF или authorization.
5. Logout отзывает серверную сессию и refresh family и очищает cookie; password reset, account disable и подозрение на компрометацию инвалидируют все соответствующие сессии. Ключи подписи и database secrets идут из secret manager, поддерживаются ротация и ограниченный overlap ключей. Audit/metrics покрывают login success/failure, refresh replay, 401/403, rate-limit и cross-tenant denial; bearer/cookie values и пароли никогда не логируются.

Главный trade-off: BFF добавляет серверный hop и хранение сессий, зато не выдает браузеру долгоживущий bearer token и дает централизованный отзыв. Для SPA/mobile-клиента прямой Nest API возможен, но требует другой модели хранения token, CORS/CSRF решений и тех же server-side проверок authorization.
