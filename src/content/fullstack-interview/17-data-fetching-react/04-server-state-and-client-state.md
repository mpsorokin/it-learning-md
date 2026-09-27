# Server state and client state

## Interview questions

### Server state.
<!-- question-id: 17-data-fetching-react-q15 -->
#### Ответ

Server state — данные, владельцем и источником истины которых является внешний сервер: они асинхронно загружаются, могут измениться без участия текущего клиента и совместно читаются компонентами. Поэтому клиенту нужны идентичность cache, freshness/invalidation, pending/error, retry, отмена и reconciliation после mutation. Query cache — управляемая реплика, не authoritative store; при конфликте окончательное решение принимает сервер. Примеры — каталог, профиль, permissions и результаты поиска; все эти данные должны быть изолированы по tenant/user и заново синхронизированы после изменения. Размещение копии в useState или Redux без политики синхронизации создаёт второй источник истины, устаревшие дубликаты и неясное поведение при переключении аккаунта.

### Client state.
<!-- question-id: 17-data-fetching-react-q16 -->
#### Ответ

Client state живёт и изменяется внутри текущего интерфейса: открытая вкладка, видимость модалки, черновик формы, временный выбор и локальный interaction state. Его жизненный цикл обычно принадлежит компоненту, route или специализированному store; он не требует cache invalidation с backend, пока пользователь явно не сохраняет его. Выбирайте минимальную область владения: локальный state, если один владелец, Context для ограниченного дерева и глобальный store, если нужны сложные общие переходы/derived selectors. Не копируйте query data в local state на каждом refetch: это расходящиеся реплики. Исключение — редактируемый draft: при открытии формы он создаёт осознанный снимок серверной версии, а при submit сравнивает version/ETag или показывает конфликт при параллельном изменении.

### Когда React Query не нужен?
<!-- question-id: 17-data-fetching-react-q17 -->
#### Ответ

Он не обязателен для статичного build-time контента, простого локального значения, одноразового request без повторного использования, нативного route loader с уже заданным cache contract или когда server framework сам загружает/переиспользует данные и клиенту не нужны интерактивные revalidation и mutations. Для запроса в Effect можно не вводить полноценную библиотеку, если небольшой компонент изолирован и требования к cache/retry/race явно малы. Но стоимость зависит не от числа запросов, а от нужных гарантий: конкурентные observers, offline, retry, optimistic update, invalidation, pagination и SSR быстро делают ручное управление дороже. Не добавляйте query-клиент только ради fetch в одной форме, если архитектура уже задаёт другой owner. И наоборот, не экономьте зависимость, если команда затем создаёт собственный хрупкий cache. При выборе учитывайте bundle, сборку, SSR и навыки команды, а решение фиксируйте в API boundary, чтобы случайные подходы не смешивались.

### React Query vs RSC.
<!-- question-id: 17-data-fetching-react-q18 -->
#### Ответ

Это разные слои. React Server Components позволяют выполнять часть дерева и читать данные на сервере, формируя результат/stream без отправки серверного кода в браузер; они сами по себе не заменяют полноценный клиентский cache для интерактивного повторного refetch, mutations, offline и общего client subscription. TanStack Query хранит client-side server-state cache и координирует observers и mutations; данные можно prefetch/dehydrate на сервере и hydrate в браузере, если нужны обе модели. В Next App Router, например, Server Component часто подходит для route data с низкой интерактивностью, а Query для данных, которые меняются на клиенте или синхронно используются в нескольких виджетах; это не правило одного фреймворка. Сочетание требует согласовать два cache layer, freshness/revalidation, authentication, request-scoped QueryClient и сериализуемый payload, иначе появятся двойные запросы и несовпадающие версии. Сначала определите owner данных и consistency boundary, затем выбирайте место загрузки. Документация [TanStack Query SSR/hydration](https://tanstack.com/query/latest/docs/framework/react/guides/ssr) описывает передачу prefetch cache в клиент.
