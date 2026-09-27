# Mutations and optimistic UI

## Interview questions

### Mutation + cache invalidation.
<!-- question-id: 22-next-server-actions-q07 -->
#### Ответ
Надёжный порядок: аутентифицировать и авторизовать; валидировать вход; выполнить запись в транзакции; только после успешного commit инвалидировать данные; вернуть безопасный результат или redirect. В Cache Components Next 16 updateTag применяется из Server Action для немедленного read-your-own-writes, а revalidateTag(tag, 'max') подходит для stale-while-revalidate, когда небольшая задержка допустима. revalidatePath нужен для адресного route результата; один путь может затронуть больше зависимостей, чем tag. В previous caching model используйте её документированные API и не предполагайте одинаковую семантику с Cache Components. При неудаче БД кэш не трогайте; если инвалидатор упал после commit, запись уже сохранена — логируйте, делайте действие безопасным к retry или используйте outbox/повторную invalidation.

### Error handling.
<!-- question-id: 22-next-server-actions-q08 -->
#### Ответ
Ожидаемые ошибки — validation, permission, conflict — возвращайте как ограниченное сериализуемое состояние формы, чтобы UI мог показать конкретную причину. Неожиданное исключение логируйте на сервере с correlation/request ID и показывайте пользователю нейтральное сообщение; оно может попасть в ближайший error.tsx boundary. Не возвращайте stack, запросы БД, секреты или сырой exception. Для повторяемой мутации применяйте idempotency key/уникальное ограничение. Важно: Next redirect() использует control-flow exception; не поглощайте его широким catch — вызывайте после try/catch либо повторно выбрасывайте специальные ошибки. Клиент обязан показать pending/timeout и позволять безопасный retry только если операция идемпотентна.

### Optimistic UI.
<!-- question-id: 22-next-server-actions-q09 -->
#### Ответ
Optimistic UI заранее отражает вероятный результат, пока Server Action выполняется; React useOptimistic подходит для временного client overlay, а useActionState — для состояния результата формы. На ответ сервера подтвердите значение authoritative result или замените snapshot; на отклонение/ошибку откатите optimistic change и покажите причину. Это даёт быструю обратную связь, но не отменяет серверную валидацию и авторизацию. Для списков учитывайте конкурентные действия, изменение порядка и повторный клик; используйте временный ID, блокировку duplicate submit или idempotency key. Не оптимистично удаляйте необратимую/денежную запись без явного статуса ожидания и понятного восстановления.

