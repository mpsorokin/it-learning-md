# Scopes and Module Boundaries

## Interview questions

### Почему forwardRef часто architecture smell?
<!-- question-id: 25-nestjs-architecture-q19 -->

#### Ответ
forwardRef часто показывает, что два компонента взаимно знают об обязанностях друг друга. Такая связь затрудняет независимое изменение и тестирование; Nest также предупреждает о неопределённом порядке создания, а циклы с request-scoped providers могут давать undefined-зависимости. Лучше выделить общий контракт, поднять координацию уровнем выше или передавать событие в одном направлении. forwardRef оставляют для редких случаев, когда взаимная ссылка действительно часть модели.

### Provider scopes.
<!-- question-id: 25-nestjs-architecture-q20 -->

#### Ответ
Scope задаёт время жизни provider-а: DEFAULT (singleton на жизнь приложения), REQUEST (экземпляр на входящий запрос) или TRANSIENT (свой экземпляр для каждого потребителя). Это не определяет видимость между модулями. Request scope поднимается вверх по цепочке зависимостей; transient-зависимость сама по себе не делает потребителя transient.

### Singleton/default scope.
<!-- question-id: 25-nestjs-architecture-q21 -->

#### Ответ
DEFAULT — scope по умолчанию: Nest создаёт singleton при bootstrap и делит экземпляр между его потребителями и запросами. Это подходит stateless-сервисам, репозиториям, пулам соединений и клиентам, рассчитанным на конкурентные вызовы. Singleton общий в пределах одного экземпляра приложения, а не между отдельными процессами или репликами.

### Request scope.
<!-- question-id: 25-nestjs-architecture-q22 -->

#### Ответ
REQUEST создаёт отдельный provider на запрос и освобождает его после обработки. Он нужен, когда объекту действительно требуется request-bound состояние; в HTTP-приложении токен REQUEST уже request-scoped. Этот scope распространяется на зависящие от provider-а сервисы и контроллеры. Для GraphQL Nest предоставляет контекст через CONTEXT, поскольку форма запроса отличается.

### Transient scope.
<!-- question-id: 25-nestjs-architecture-q23 -->

#### Ответ
TRANSIENT не делит экземпляр между потребителями: каждый потребитель получает отдельный provider. Это не означает новый объект при каждом вызове его метода — новый экземпляр выдаётся при разрешении зависимости. В отличие от REQUEST, transient не поднимает scope потребителя: singleton-сервис остаётся singleton, даже если получил transient logger.

### Почему request-scoped providers дорогие?
<!-- question-id: 25-nestjs-architecture-q24 -->

#### Ответ
При REQUEST-scope Nest создаёт экземпляр provider-а для каждого запроса. Если такой provider стоит внизу общей цепочки, scope распространяется на его потребителей и может сделать request-scoped большой участок приложения; это увеличивает создание объектов и нагрузку на GC, ухудшая latency и throughput. Не включайте scope только ради доступа к user/tenant: явная передача контекста или request-local store на AsyncLocalStorage часто сохраняют singleton-граф; эффект нужно измерить профилированием.

### Что будет, если хранить user/request state в singleton provider?
<!-- question-id: 25-nestjs-architecture-q25 -->

#### Ответ
Singleton разделяется конкурентными запросами внутри процесса. Если записать в его поле текущего пользователя, tenant или request, другой запрос может перезаписать значение до чтения и получить чужие данные — это гонка и утечка. Request-specific состояние передают параметром, хранят в локальном контексте запроса или используют подходящий request scope, но не в поле общего сервиса.

### Спроектировать модуль:
<!-- question-id: 25-nestjs-architecture-task01 -->

Users
Auth
Billing
Notifications

без circular dependencies.

#### Ответ
Пусть AppModule собирает UsersModule, AuthModule, BillingModule и NotificationsModule. UsersModule владеет профилем и хранилищем пользователей и экспортирует узкий UserReader; AuthModule импортирует UsersModule для проверки credentials и выпуска токенов, но обратной зависимости нет. BillingModule использует UserReader только для нужных проверок и публикует события оплаты через нейтральный event contract/outbox. NotificationsModule подписывается на UserRegistered/BillingEvent и отправляет сообщения, не вызывая напрямую Billing или Auth. Граф остаётся направленным: Auth → Users, Billing → Users и event contract, Notifications → event transport; обратные вызовы заменены событиями. HTTP-доступ можно подключить guard-ом из AuthModule или DI-enabled APP_GUARD в composition root, не заставляя UsersModule импортировать AuthModule.
