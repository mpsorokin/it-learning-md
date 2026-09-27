# Validation, authorization and security

## Interview questions

### Validation.
<!-- question-id: 22-next-server-actions-q04 -->
#### Ответ
Валидация выполняется на сервере до бизнес-операции: извлеките поля FormData, проверьте типы, формат, диапазон, обязательность, ограничения длины и допустимые enum; нормализуйте только по ожидаемому правилу. Схема (например, Zod) должна валидировать фактический вход, а не доверять клиентскому TypeScript или браузерной форме. Проверяйте relation IDs и бизнес-инварианты в транзакции/БД, чтобы не было TOCTOU race. Возвращайте ошибки полей понятным и безопасным DTO, не отдавайте stack/SQL. Клиентская проверка остаётся только для UX; защита от дублей, rate limits и ограничения размера нужны отдельно для дорогостоящих операций.

### Authorization.
<!-- question-id: 22-next-server-actions-q05 -->
#### Ответ
В каждой Action сначала получайте серверную сессию из доверенного cookie/token, проверяйте, что пользователь аутентифицирован, затем авторизуйте конкретное действие над конкретным ресурсом: роль, tenant, ownership, статус workflow. Проверку встраивайте в запрос/транзакцию, а не только в UI или layout, которые можно обойти прямым POST. Любой ID из формы проверяйте как недоверенный: пользователь может заменить его на чужой. Для чувствительных операций загружайте актуальные права с источника истины; не полагайтесь на давно устаревающую роль из client state. Ошибку формулируйте безопасно, не раскрывая существование чужого объекта, если это важно. [Руководство Next.js](https://nextjs.org/docs/app/guides/authentication) требует проверять каждую Server Action.

### CSRF/security considerations.
<!-- question-id: 22-next-server-actions-q06 -->
#### Ответ
В Next Server Actions есть встроенная CSRF-защита: по умолчанию Origin сравнивается с Host (или X-Forwarded-Host); доверенные proxy origins при необходимости перечисляют в allowedOrigins. В Next 16.3.x это полезная защита transport-уровня, но не авторизация: Action IDs не секрет, endpoint считается публичным, и каждый вызов всё равно требует authz, проверки входа, rate limiting и ограничения side effects. За прокси убедитесь, что forwarded headers подставляет доверенная инфраструктура; иначе списки origin можно настроить неверно. Не возвращайте токены/PII без необходимости, ставьте защищённые cookie и учитывайте default 1 MB body limit. [Официальная конфигурация](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) и [Data Security](https://nextjs.org/docs/app/guides/data-security).

