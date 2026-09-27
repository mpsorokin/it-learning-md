# Server Action flow practice

## Interview questions

### Сделать:
<!-- question-id: 22-next-server-actions-task01 -->

```text
form
→ Server Action
→ validation
→ DB
→ revalidation
→ optimistic UI
```

#### Ответ
Предположения: форма создаёт объект, действие доступно только вошедшему пользователю, payload небольшой, React/Next App Router 16.3.x. UI: обычный form с именованными полями, Server Action и useActionState для ошибок/pending; при необходимости useOptimistic добавляет временную строку и откатывает её на ошибке. На сервере Action: получить сессию; parse FormData и schema-validate; проверить permission/tenant для целевого объекта; создать запись и audit event одной транзакцией; вернуть безопасные DTO/ошибки. Внутренний слой БД не экспортировать клиенту. После успешного commit вызвать updateTag для страницы, где нужен немедленный read-your-own-write, или revalidateTag('items','max') для терпимого к задержке списка; использовать revalidatePath только если он действительно отражает зависимость. Затем вернуть данные или redirect. Сервер должен выдерживать повторный POST и конкурентные запросы через idempotency/constraint. Для ошибочной формы не инвалидировать кэш; для неожиданной ошибки — безопасное сообщение + серверный лог. Встроенная Origin/Host защита не заменяет authz.

