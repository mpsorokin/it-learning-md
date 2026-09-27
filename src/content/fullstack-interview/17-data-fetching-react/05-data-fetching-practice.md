# Data fetching practice

## Interview questions

### CRUD через React Query;
<!-- question-id: 17-data-fetching-react-task01 -->
#### Ответ

Предположение для примера: TanStack Query v5. Query key factory централизует cache identity; queryFn передаёт AbortSignal fetch-у; mutation проверяет HTTP status, а response следует валидировать как unknown на границе API. Создайте QueryClient один раз на приложение и оберните дерево в QueryClientProvider. Упрощённый API layer и hooks:

    // The API exposes each resource's server-issued strong ETag in the `etag`
    // JSON field (also sent as the detail response's ETag header), unchanged
    // and including its surrounding double quotes.
    type Todo = { id: string; title: string; completed: boolean; etag: string };
    type CreateTodo = { title: string };
    type UpdateTodo = Partial<Pick<Todo, "title" | "completed">> & { id: string; etag: string };

    const todoKeys = {
      all: ["todos"] as const,
      lists: () => ["todos", "list"] as const,
      detail: (id: string) => ["todos", "detail", id] as const,
    };

    class HttpError extends Error {
      constructor(readonly status: number) {
        super("HTTP " + status);
        this.name = "HttpError";
      }
    }

    function assertOk(response: Response): void {
      if (!response.ok) throw new HttpError(response.status);
    }

    async function checkedBody<T>(response: Response, parse: (value: unknown) => T): Promise<T> {
      assertOk(response);
      if (response.status === 204) throw new Error("Expected a response body, received 204");
      return parse(await response.json());
    }

    async function checkedVoid(response: Response): Promise<void> {
      assertOk(response);
    }

    function isStrongETag(value: unknown): value is string {
      return typeof value === "string" && /^\"[\x21\x23-\x7E]*\"$/.test(value);
    }

    function parseTodo(value: unknown): Todo {
      if (typeof value !== "object" || value === null) throw new Error("Invalid todo");
      const item = value as Record<string, unknown>;
      if (
        typeof item.id !== "string" ||
        typeof item.title !== "string" ||
        typeof item.completed !== "boolean" ||
        !isStrongETag(item.etag)
      ) throw new Error("Invalid todo");
      return { id: item.id, title: item.title, completed: item.completed, etag: item.etag };
    }

    async function listTodos(signal: AbortSignal): Promise<Todo[]> {
      return checkedBody(await fetch("/api/todos", { signal }), value => {
        if (!Array.isArray(value)) throw new Error("Invalid todo list");
        return value.map(parseTodo);
      });
    }

    async function createTodo(input: CreateTodo): Promise<Todo> {
      return checkedBody(await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }), parseTodo);
    }

    async function updateTodo(input: UpdateTodo): Promise<Todo> {
      return checkedBody(await fetch("/api/todos/" + encodeURIComponent(input.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Forward the opaque strong ETag exactly as received; the API
          // compares it atomically with the current resource representation.
          "If-Match": input.etag,
        },
        body: JSON.stringify({ title: input.title, completed: input.completed }),
      }), parseTodo);
    }

    async function deleteTodo(id: string, etag: string): Promise<void> {
      const response = await fetch("/api/todos/" + encodeURIComponent(id), {
        method: "DELETE",
        headers: { "If-Match": etag },
      });
      await checkedVoid(response);
    }

    function useTodos() {
      return useQuery({
        queryKey: todoKeys.lists(),
        queryFn: ({ signal }) => listTodos(signal),
      });
    }

    function useCreateTodo() {
      const client = useQueryClient();
      return useMutation({
        mutationFn: createTodo,
        onSuccess: async () => {
          await client.invalidateQueries({ queryKey: todoKeys.lists() });
        },
      });
    }

    function useUpdateTodo() {
      const client = useQueryClient();
      return useMutation({
        mutationFn: updateTodo,
        onSuccess: async todo => {
          client.setQueryData(todoKeys.detail(todo.id), todo);
          await client.invalidateQueries({ queryKey: todoKeys.lists() });
        },
        onError: async (error, input) => {
          if (error instanceof HttpError && error.status === 412) {
            await Promise.all([
              client.invalidateQueries({ queryKey: todoKeys.detail(input.id), exact: true }),
              client.invalidateQueries({ queryKey: todoKeys.lists() }),
            ]);
          }
        },
      });
    }

    function useDeleteTodo() {
      const client = useQueryClient();
      return useMutation({
        mutationFn: ({ id, etag }: { id: string; etag: string }) => deleteTodo(id, etag),
        onSuccess: async (_data, variables) => {
          client.removeQueries({ queryKey: todoKeys.detail(variables.id), exact: true });
          await client.invalidateQueries({ queryKey: todoKeys.lists() });
        },
        onError: async (error, variables) => {
          if (error instanceof HttpError && error.status === 412) {
            await Promise.all([
              client.invalidateQueries({ queryKey: todoKeys.detail(variables.id), exact: true }),
              client.invalidateQueries({ queryKey: todoKeys.lists() }),
            ]);
          }
        },
      });
    }

В компоненте query отображает isPending, isError, error и data; mutation запускается через mutate/mutateAsync и отдельно показывает своё состояние. API должен выдавать сильный opaque ETag каждой версии Todo: в detail response — как HTTP `ETag` и поле `etag`, а в элементах списка — в поле `etag`; клиент сохраняет и передаёт это значение целиком, включая кавычки. PATCH и DELETE отправляют его без преобразования в `If-Match`; backend сравнивает его с текущим представлением атомарно вместе с изменением/удалением, а несовпадение возвращает `412 Precondition Failed`. `HttpError` сохраняет статус, поэтому mutation распознаёт 412, инвалидирует detail и list, после чего UI показывает конфликт по `mutation.error`, не повторяя старый payload вслепую. `checkedBody` требует тело для операций, возвращающих Todo, а `checkedVoid` отдельно обрабатывает DELETE без тела. В production DTO и HTTP error следует вынести в API-модуль, добавить схемы для списка/ошибки и покрыть контрактными тестами.

### optimistic mutation;
<!-- question-id: 17-data-fetching-react-task02 -->
#### Ответ

Оптимистично обновлять shared cache имеет смысл, если тот же ресурс видят несколько consumers. Предположение — TanStack Query v5 и серверный API с server-issued strong ETag. Ниже optimistic update детали todo: refetch отменяется, старый cache снимается как snapshot, при ошибке он возвращается, серверный ответ затем устанавливает подтверждённое представление вместе с новым ETag, а invalidation синхронизирует производные списки.

    // `etag` is the opaque strong ETag exposed by the API in Todo.etag,
    // including its quotes; keep it unchanged for the next conditional write.
    type Todo = { id: string; title: string; completed: boolean; etag: string };
    type Completion = { id: string; completed: boolean; etag: string };
    const todoDetailKey = (id: string) => ["todos", "detail", id] as const;

    function useSetCompleted() {
      const client = useQueryClient();
      return useMutation({
        mutationFn: setTodoCompleted,
        onMutate: async input => {
          const key = todoDetailKey(input.id);
          await client.cancelQueries({ queryKey: key });
          const previous = client.getQueryData<Todo>(key);
          client.setQueryData<Todo>(key, current =>
            current ? { ...current, completed: input.completed } : current
          );
          return { key, previous };
        },
        onError: (_error, _input, rollback) => {
          if (rollback?.previous) client.setQueryData(rollback.key, rollback.previous);
        },
        onSuccess: serverTodo => {
          client.setQueryData(todoDetailKey(serverTodo.id), serverTodo);
        },
        onSettled: (_data, _error, input) => {
          return Promise.all([
            client.invalidateQueries({ queryKey: todoDetailKey(input.id) }),
            client.invalidateQueries({ queryKey: ["todos", "list"] }),
          ]);
        },
      });
    }

`setTodoCompleted` получает Todo из cache, переносит его `etag` в `If-Match` без преобразований и возвращает проверенный Todo из ответа; API публикует один и тот же сильный server-issued ETag в поле `Todo.etag` во всех Todo-представлениях (включая элемент списка), а для single-resource response — также в HTTP `ETag` header. Сервер атомарно сравнивает непрозрачный ETag с текущим представлением и применяет запись только при совпадении; иначе отвечает `412 Precondition Failed`. Приложение отображает конфликт, перечитывает запись и не повторяет старую команду вслепую. В этом примере контракт целиком основан на server-issued ETag; значение остаётся непрозрачным и не вычисляется из числовой версии на клиенте. Инвалидация списка нужна, если он сортирует/фильтрует по completed. Snapshot rollback при двух одновременных mutation одной сущности может стереть более новую операцию; для таких сущностей сериализуйте записи, сравнивайте revision, либо отображайте ожидающие операции поверх последнего подтверждённого cache. Для простого локального элемента зачастую безопаснее overlay из mutation variables без записи в cache. [RFC 9110: формат и семантика `If-Match`](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1), [схема onMutate/cancel/snapshot в руководстве TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates).

### rollback;
<!-- question-id: 17-data-fetching-react-task03 -->
#### Ответ

Rollback должен вернуть cache только к состоянию, которое изменял конкретный optimistic action, затем reconciliation снова сверяет его с сервером. Используйте snapshot из onMutate и передавайте его в mutation context; onError восстанавливает только при наличии snapshot, а onSettled возвращает Promise invalidateQueries, чтобы mutation оставалась pending до окончания синхронизации. Сначала await cancelQueries для затрагиваемого ключа — иначе ответ ранее начатого GET может перезаписать optimistic состояние. На успехе замените entity cache ответом сервера, а не оставляйте клиентское предположение. Важно не трактовать abort/timeout как доказательство, что команда не была применена: сервер мог закоммитить mutation, а ответ потерялся; нужен idempotency key, endpoint для сверки или refetch. Полный snapshot опасен при конкурентных изменениях: rollback старого снимка стирает чужую успешную операцию. Для одного resource блокируйте конкурентные mutation, применяйте обратные операции по operation ID или используйте версионирование с 409/412 и явным разрешением конфликта. Отдельно тестируйте success, definite rejection, lost response и две операции, завершившиеся в обратном порядке.

### query invalidation;
<!-- question-id: 17-data-fetching-react-task04 -->
#### Ответ

Держите query key factory и граф зависимостей рядом с API hooks. После создания/обновления todo cache detail можно установить из mutation response, а списки по всем фильтрам и агрегаты инвалидировать префиксом:

    const todoKeys = {
      all: ["todos"] as const,
      lists: () => ["todos", "list"] as const,
      list: (filters: { status?: string; page: number }) =>
        ["todos", "list", filters] as const,
      detail: (id: string) => ["todos", "detail", id] as const,
    };

    function useUpdateTodo() {
      const client = useQueryClient();
      return useMutation({
        mutationFn: updateTodo,
        onSuccess: async todo => {
          client.setQueryData(todoKeys.detail(todo.id), todo);
          await Promise.all([
            client.invalidateQueries({ queryKey: todoKeys.lists() }),
            client.invalidateQueries({ queryKey: ["todo-counts"] }),
          ]);
        },
      });
    }

Частичное prefix matching обновит активные подходящие observers, не затронув несвязанный cache; exact нужен только для конкретного ключа. Если серверный ответ не содержит всех полей, не заменяйте detail неполным объектом — либо дополняйте корректно, либо инвалидируйте его. Определите по продуктовым правилам, какие mutation меняют totals, сортировку, membership фильтра и permissions. Широкая invalidation приемлема как безопасный первый rollout, но её нагрузку надо измерить и затем сужать на основе реального графа, а не строить ручной bespoke patch для каждого списка.

### dependent queries;
<!-- question-id: 17-data-fetching-react-task05 -->
#### Ответ

Для последовательного запроса выражайте зависимость в query key и включайте его только после появления обязательного ID. Предположение — TanStack Query v5; isPending может быть true, пока fetchStatus равен idle, поэтому это не всегда означает активный сетевой запрос.

    function useUserProjects(email: string) {
      const userQuery = useQuery({
        queryKey: ["user", email],
        queryFn: ({ signal }) => fetchUserByEmail(email, signal),
      });
      const userId = userQuery.data?.id;
      const projectsQuery = useQuery({
        queryKey: ["projects", userId],
        queryFn: ({ signal }) => fetchProjectsByUser(userId!, signal),
        enabled: Boolean(userId),
      });
      return { userQuery, projectsQuery };
    }

Non-null assertion безопасна только если queryFn не выполняется при enabled=false; можно вместо неё передавать проверку в helper или моделировать аргумент guard-ом. Если email/userId может смениться, он обязан входить в ключ, иначе ответы разных пользователей смешаются. Зависимый запрос создаёт network waterfall: если backend может принимать email и возвращать проекты одним endpoint, это сокращает latency; если ID известен из route/session, используйте его напрямую и загружайте независимо; если после списка ID нужны N ресурсов, применяйте useQueries для параллели, а не цикл Hooks. Prefetch на route boundary помогает стартовать раньше. Пустое состояние «ещё не запущен» отличается от loading активного запроса, а ошибка родительской query не должна отображаться как бесконечное ожидание дочерней.
См. [руководство dependent queries](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries).

### pagination/infinite query.
<!-- question-id: 17-data-fetching-react-task06 -->
#### Ответ

Для numbered pagination номер страницы и все фильтры должны входить в query key; keepPreviousData в v5 позволяет показывать предыдущую страницу, пока следующая загружается, а isPlaceholderData не даёт случайно использовать старый hasMore как факт о новой странице.

    function useTodosPage(page: number, status: string) {
      return useQuery({
        queryKey: ["todos", { page, status }],
        queryFn: ({ signal }) => fetchTodosPage({ page, status, signal }),
        placeholderData: keepPreviousData,
      });
    }

    function TodosPager({ page, setPage }: {
      page: number;
      setPage: (update: (page: number) => number) => void;
    }) {
      const query = useTodosPage(page, "open");
      return (
        <section aria-busy={query.isFetching}>
          {query.data?.items.map(todo => <TodoRow key={todo.id} todo={todo} />)}
          <button
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage(current => Math.max(0, current - 1))}
          >Previous</button>
          <button
            disabled={query.isPlaceholderData || query.data?.hasMore !== true}
            onClick={() => setPage(current => current + 1)}
          >Next</button>
        </section>
      );
    }

Для cursor/infinite списка у каждой страницы должен быть server cursor, а не вычисленный offset; обработайте undefined nextCursor и защитите от повторного fetchNextPage по двойному нажатию. Минимальный v5 query:

    function useTodoFeed(status: string) {
      return useInfiniteQuery({
        queryKey: ["todos", "feed", { status }],
        initialPageParam: null as string | null,
        queryFn: ({ pageParam, signal }) => fetchTodoPage({ cursor: pageParam, status, signal }),
        getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
      });
    }

Рендерите data.pages, показывайте isFetchingNextPage отдельно от initial pending, и отключайте загрузку, когда нет next page или fetch уже идёт. Infinite cache растёт по мере скролла: задайте разумную политику max pages/удаления, виртуализируйте большой список и наблюдайте latency/ошибки. Backend должен обеспечивать стабильный порядок при изменении коллекции между страницами; offset pagination может пропускать или повторять элементы при конкурентных вставках. [Официальный пример pagination](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries).
