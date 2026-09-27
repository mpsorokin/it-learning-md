# NestJS Request Lifecycle

## Interview questions

### В каком порядке идут:
<!-- question-id: 26-nestjs-request-lifecycle-q01 -->

middleware
guards
interceptors
pipes
controller
service
interceptor response
exception filters

И зачем каждый слой.

#### Ответ
Для обычного HTTP-запроса последовательность такова: middleware; guards; входная часть interceptors; pipes; метод controller и вызываемый им service; обратная часть interceptors; server response. На каждом уровне guards/interceptors/pipes проходят global → controller → route; response-часть interceptor-ов разворачивается route → controller → global. Service не отдельный автоматический hook Nest, а обычный вызов из handler-а. Exception filters — ветка для непойманного исключения: route filter, затем controller и global; после ошибки обычная цепочка прекращается.

### Guard vs middleware.
<!-- question-id: 26-nestjs-request-lifecycle-q02 -->

#### Ответ
Middleware запускается до выбора route handler-а и подходит для общей HTTP-работы: request ID, базовое логирование, нормализация заголовков. Оно не знает metadata будущего handler-а. Guard получает ExecutionContext и принимает route-aware решение о доступе; он идёт после middleware, но до interceptor-ов и pipes. Middleware продолжает цепочку через next(), guard разрешает обработку или отклоняет её.

### Guard vs interceptor.
<!-- question-id: 26-nestjs-request-lifecycle-q03 -->

#### Ответ
Guard решает, может ли запрос попасть в handler, обычно проверяя аутентификацию, роли или permissions. Interceptor оборачивает вызов handler-а: выполняет код до него, получает Observable результата и может измерить время, кэшировать, преобразовать результат или обработать ошибку. Guards выполняются раньше; если guard отклоняет запрос, interceptor маршрута не запускается.

### Pipe vs DTO validation.
<!-- question-id: 26-nestjs-request-lifecycle-q04 -->

#### Ответ
DTO-класс описывает форму запроса и может хранить runtime-декораторы class-validator; сама TypeScript-аннотация не проверяет HTTP JSON, а интерфейс исчезает после компиляции. Pipe — механизм Nest на границе параметра: он преобразует значение, валидирует и возвращает результат или бросает исключение. ValidationPipe запускает проверку DTO; для внешнего ввода часто включают transform, whitelist и forbidNonWhitelisted, выбирая преобразования осознанно.

### Exception filter.
<!-- question-id: 26-nestjs-request-lifecycle-q05 -->

#### Ответ
Exception filter преобразует непойманное исключение в протокольный ответ и может централизовать безопасное логирование и стабильный формат ошибки. Встроенный HTTP-фильтр обрабатывает HttpException и возвращает 500 для неизвестных исключений; пользовательский фильтр ограничивают нужными типами и не раскрывают клиенту stack trace или внутренние детали. Фильтры применяются от ближайшего уровня к широкому: route → controller → global; если локальный фильтр поймал ошибку, глобальный её повторно не получает.

### Global interceptor.
<!-- question-id: 26-nestjs-request-lifecycle-q06 -->

#### Ответ
Global interceptor оборачивает обработчики всего приложения: на входе может начать tracing или измерение времени, на выходе — преобразовать результат и записать метрики. Ответная часть выполняется после route-level и controller-level interceptors. Для DI-зависимостей регистрируйте его как provider с APP_INTERCEPTOR; экземпляр, созданный напрямую через useGlobalInterceptors вне контейнера, не получает DI.

### Metadata/reflection.
<!-- question-id: 26-nestjs-request-lifecycle-q07 -->

#### Ответ
Декораторы прикрепляют runtime metadata к controller-ам, методам и параметрам; Nest использует metadata для маршрутизации и DI, а Reflector позволяет приложению прочитать собственные правила. Например, SetMetadata хранит roles на классе или handler-е, после чего guard читает их и явно задаёт приоритет metadata метода относительно класса. Metadata — описание, а не проверка: её должен использовать guard, pipe или другой компонент.

### Custom decorators.
<!-- question-id: 26-nestjs-request-lifecycle-q08 -->

#### Ответ
createParamDecorator позволяет извлечь из ExecutionContext текущего пользователя или tenant и передать его обработчику как понятный параметр. Для авторизационных правил можно создать декоратор на SetMetadata и читать его в guard через Reflector; applyDecorators объединяет повторяющийся набор декораторов. Не прячьте в декораторе бизнес-логику; если ValidationPipe должен валидировать custom param decorator, включите validateCustomDecorators.

### Сделать:
<!-- question-id: 26-nestjs-request-lifecycle-task01 -->

JWT auth
→ roles guard
→ validation
→ logging
→ controller
→ response transformation
→ exception handling

#### Ответ
Разделите ответственность по шагам. JWT guard проверяет подпись, срок действия и нужные claims, строит principal и прикрепляет его к request context; при отсутствии или ошибке токена возвращается 401. Roles guard читает роли/permissions handler-а и проверяет доступ к конкретной операции и tenant/resource; отказ — 403. Logging interceptor оборачивает вызов и записывает request ID, маршрут, actor ID, результат/ошибку и длительность, не включая токен или чувствительное тело; по lifecycle его входная часть начинается до pipes. ValidationPipe преобразует и проверяет DTO до handler-а. Controller вызывает use case/service, где находятся бизнес-правила и транзакция. На обратном пути interceptor формирует публичный response shape. Exception filter нормализует непойманные ошибки и добавляет correlation ID; ожидаемые 4xx сохраняют статус, неизвестные ошибки становятся 500 и остаются в server-side logs.
