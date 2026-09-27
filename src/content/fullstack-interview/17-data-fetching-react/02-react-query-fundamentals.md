# React Query fundamentals

## Interview questions

### Retry.
<!-- question-id: 17-data-fetching-react-q06 -->
#### Ответ

Предположение: примеры React Query используют TanStack Query v5; при другой версии надо сверить API и defaults. Query повторяется, когда queryFn завершилась ошибкой, а не когда функция вернула объект ошибки. У TanStack Query v5 по умолчанию на клиенте выполняются три retry после первой неудачи с exponential backoff; на серверном рендеринге default retry равен нулю. Это означает до четырёх попыток на клиенте, поэтому latency/error UI может быть заметно отложен. Fetch сам не бросает ошибку на HTTP 404/500: queryFn должна проверять response.ok, затем бросать типизированную ошибку. Повторять transient network/5xx/429 с уважением к Retry-After может быть разумно; постоянные 4xx, 401/403 до обновления credentials, validation errors и abort обычно повторять бессмысленно. Учитывайте jitter, общий deadline, число одновременных запросов и retry budget, чтобы клиентская буря не усилила outage. Повторы mutation опаснее: запрос мог успеть изменить сервер до потери ответа; включайте их только с идемпотентной операцией или idempotency key. См. [официальные defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) и [retry policy](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries).

### Refetching.
<!-- question-id: 17-data-fetching-react-q07 -->
#### Ответ

Query может refetch-иться при появлении нового observer, возврате фокуса вкладки, восстановлении соединения, по refetchInterval, вручную через refetch или после invalidation. В TanStack Query v5 cached data по умолчанию сразу считается stale; staleTime управляет тем, когда она считается свежей и должна ли срабатывать автоматическая stale-based проверка. Переход на stale не означает немедленный запрос сам по себе: нужен один из триггеров. Background refetch обычно сохраняет имеющиеся данные, поэтому UI отличает initial pending от isFetching и может показать неблокирующий индикатор. Для восстановления после успешной mutation чаще достаточно invalidateQueries, чем жёстко вызывать запрос из компонента. У polling должен быть явный интервал, условие остановки, нагрузочный бюджет и обработка скрытой вкладки/ошибок; не опрашивайте быстрее, чем источник способен отвечать. Настройка refetch зависит от допустимой устарелости и стоимости запроса, а не только от желания всегда видеть «самые новые» данные.

### Stale data.
<!-- question-id: 17-data-fetching-react-q08 -->
#### Ответ

Stale — состояние политики клиента: cache entry больше не считается fresh по staleTime или была явно инвалидирована. Это не утверждение, что серверные данные неверны, и staleTime не является сроком жизни записи. Stale query может всё ещё показывать предыдущее успешное значение и одновременно выполняться background refetch; отделяйте наличие data от isFetching, initial loading и refetch error, чтобы интерфейс не мигал пустым. В v5 default staleTime равен нулю, поэтому повторный mount/focus/reconnect обычно инициирует фоновую проверку; для редко меняющихся справочников staleTime можно увеличить. Infinity означает, что время само по себе не сделает данные stale, но ручная invalidation всё ещё действует; v5 значение static строже и блокирует invalidation-driven stale/refetch, поэтому его оставляют для действительно неизменяемых в течение сессии данных. Для денег, прав доступа или статусов, влияющих на действие, freshness клиентского cache не заменяет server-side authorization и version checks.

### React Query.
<!-- question-id: 17-data-fetching-react-q09 -->
#### Ответ

В этом ответе React Query — привычное название TanStack Query; предположение — API v5. Это клиентский слой server-state management: query key определяет запись cache, queryFn загружает её, observer связывает запись с React render, а mutation представляет команду записи с callbacks и invalidation. Библиотека управляет совместным чтением, deduplication, background refetch, stale time, retries, отменой по signal и обновлением UI при изменении query state; она не делает backend транзакционным и не валидирует произвольный JSON автоматически. UI всё равно отвечает за pending/error/empty states, API layer — за transport, HTTP semantics и runtime parsing, а сервер — за источник истины и права. QueryClient должен иметь осмысленный lifetime и provider scope; на SSR нужен request-local экземпляр и корректная hydration. Не стоит помещать все данные и всё UI state в query cache: модалка и несохранённый input не становятся server state лишь потому, что это удобно наблюдать через query.

### Query key.
<!-- question-id: 17-data-fetching-react-q10 -->
#### Ответ

Query key — сериализуемый top-level array, который одновременно является идентичностью cache entry и зависимостями queryFn. Включайте в него каждый параметр, меняющий ответ: например, resource, tenant, user scope, filters, sort и page; не включайте случайный object/function или тайный credential. Query keys с объектами сравниваются детерминированно по сериализуемому содержимому объекта; порядок элементов массива значим. Если queryFn читает переменную, но та отсутствует в key, изменение переменной способно показать старый cache или привязать observers к неверной записи. Иерархическая фабрика ключей упрощает согласованное invalidation: prefix вроде todos инвалидирует list/detail family, а более точный key адресует один ресурс. Не мутируйте объект ключа после создания и не храните в нём большие изменяемые структуры.
