# Next.js cache practice

## Interview questions

### сделать cached product page;
<!-- question-id: 21-next-data-fetching-cache-task01 -->
#### Ответ
Предположения: публичный каталог товаров, карточка допустимо слегка устарела, App Router на Next 16.3.x и включён Cache Components. Вынесите loader getProduct(id) в серверный модуль; пометьте область директивой use cache, задайте подходящий cacheLife и cacheTag с конкретным ID, например product:42, чтобы detail и связанные представления инвалидировались адресно. Страница динамического slug получает params и вызывает loader; неизвестный товар превращается в notFound(). Для исходного shell добавьте loading/Suspense вокруг действительно медленных зависимых фрагментов. После mutation обновляйте тег: updateTag для мгновенного read-your-own-writes в Server Action, revalidateTag(tag, 'max') для каталога, где допустима фоновая свежесть. Если Cache Components не включён, используйте явно fetch cache/next.revalidate/tags по previous-model docs, не копируйте use cache. Тестируйте build, повторные запросы, срок, invalidation и поведение нескольких инстансов.

### invalidation после mutation;
<!-- question-id: 21-next-data-fetching-cache-task02 -->
#### Ответ
После валидированной и авторизованной мутации сначала коммитьте транзакцию БД; при внешних side effects используйте outbox/идемпотентный job, чтобы повтор запроса не создавал дубликаты. Затем инвалидируйте минимальную область. В Cache Components прикрепите cacheTag к функциям чтения и вызовите updateTag в Server Action, если пользователь должен немедленно увидеть собственную запись; для публичного каталога с допустимой задержкой используйте revalidateTag(tag, 'max'). revalidatePath подходит, если нужно обновить конкретный path и вы не оперируете тегами. Для webhook в Route Handler доступен revalidateTag/path, но не updateTag. Ошибка БД — не запускать revalidation; ошибка инвалидатора после commit требует повторяемой стратегии, логирования/метрик и понимания, какой stale window допустим. При прежней модели следуйте отдельной документации API и проверяйте, что тег действительно привязан к fetch.

### user-specific dashboard;
<!-- question-id: 21-next-data-fetching-cache-task03 -->
#### Ответ
Сделайте page серверной: await cookies(), проверьте подпись/сессию, загрузите субъект, затем авторизуйте tenant и запросите dashboard data с userId/tenantId ограничением в самом SQL/ORM запросе. Общие справочники и публичные метрики можно кэшировать отдельно; персональные числа и permissions не кладите в общий cache, CDN или tag с ключом только 'dashboard'. Runtime часть оберните в Suspense, если используется Next 16 Cache Components, чтобы статичная оболочка не ждала весь dashboard. Передавайте в Client Components минимум сериализуемых полей и не считайте скрытие кнопок авторизацией. Ответ должен иметь private/no-store cache-control там, где он может иначе попасть в общий HTTP cache; проверьте multi-tenant isolation тестами и Router/React Query cache keys.

### объяснить stale data bug.
<!-- question-id: 21-next-data-fetching-cache-task04 -->
#### Ответ
Симптом «после сохранения показываются старые данные» требует найти, где устарело значение. Сопоставьте запись в БД с прямым свежим чтением и фактическим RSC/API ответом; проверьте ключ и срок Next cache, route output, Route Handler/CDN Cache-Control, Router Cache после перехода и клиентский query cache. В previous model fetch defaults и route caching отличаются от Next 16 Cache Components; первым делом запишите точную версию/config и все cache options. Проверьте, что mutation закоммичена раньше invalidation, а tag совпадает с tag при чтении. Для немедленного подтверждения после server action в Cache Components примените updateTag; revalidateTag('max') может намеренно отдать stale при фоне. Воспроизведите две сессии/инстанса, логируйте cache hit, возраст и invalidation, добавьте тест обновления; не обходите проблему глобальным no-store, пока не определили источник. [Revalidation semantics](https://nextjs.org/docs/app/getting-started/revalidating).

