# Suspense and streaming

## Interview questions

### Suspense.
<!-- question-id: 16-react-concurrent-rendering-q14 -->
#### Ответ

`<Suspense fallback={...}>` — boundary в React tree, которая декларативно задаёт, что показать, пока поддерживаемый источник внутри поддерева не готов. Это может быть код из `lazy()`, Promise, прочитанный через `use`, или data source/framework, интегрированный с Suspense. Когда child при render suspends, ближайшая boundary показывает fallback, а затем React может показать готовое содержимое.

Выбирайте границу по UX-единице reveal: route shell может оставаться видимым, пока одна панель загружается; nested boundaries позволяют независимо показать sidebar и основной блок. Одна boundary вокруг всего приложения часто заменяет полезный экран большим spinner при любом дочернем suspend. При первоначальном mount state в незавершившемся дереве не сохраняется: React повторит render после готовности ресурса.

Suspense — не автоматический data-fetching framework и не общее ловление ошибок. Он не замечает произвольный `fetch` в `useEffect` или event handler; для runtime ошибок нужны Error Boundaries. [Справочник `<Suspense>` и поддерживаемые источники](https://react.dev/reference/react/Suspense).

### Что именно Suspense “ловит”?
<!-- question-id: 16-react-concurrent-rendering-q15 -->
#### Ответ

Suspense реагирует не на любое «ожидание», а на suspend сигнал от источника, который интегрирован с Suspense: например, `React.lazy` загрузка module, `use(promise)` в React 19, либо framework/data layer, который бросает/reuses cached Promise во время render. Ближайшая родительская `<Suspense>` boundary переключается на fallback для приостановленной части.

Обычный `fetch()` в `useEffect`, promise, запущенный из event handler, таймер или произвольная async-функция не активируют boundary сами. Error Boundary также отдельна: rejection/error при render требует error handling; Suspense fallback — это loading/reveal state, не catch-all. Плохо кешированный Promise, созданный заново при каждом render, может привести к бесконечным повторным suspend.

Проверяйте работу конкретного framework/data source: он отвечает за кеширование, revalidation, отмену и согласование сервер/клиент данных. React API определяет границы reveal, а не storage или request lifecycle. [Что активирует `<Suspense>`](https://react.dev/reference/react/Suspense), [`use` с Promise](https://react.dev/reference/react/use).

### Streaming.
<!-- question-id: 16-react-concurrent-rendering-q16 -->
#### Ответ

Streaming SSR позволяет серверу отправить готовый HTML shell рано, а затем дополнять поток markup для Suspense-boundaries по мере готовности их содержимого, вместо того чтобы ждать готовность всей страницы перед первым byte. В Node используется `renderToPipeableStream`; для runtime с Web Streams — `renderToReadableStream`. На клиенте `hydrateRoot` может гидратировать доступные части, когда приходят код/данные; Suspense позволяет React приоритизировать участки экрана.

Архитектурно разделяйте быстрый shell (navigation, заголовок, базовый layout) и действительно независимые медленные области. Boundary fallback должен быть полноценным skeleton для своей геометрии, чтобы не создавать CLS. Нужно согласовать HTTP headers/cache policy, abort/timeout server rendering, ошибок chunk и клиентскую hydration; раннее flush header ограничивает возможности позже изменить status code/headers. Server stream не отменяет клиентские bundles, accessibility и real-user monitoring.

Не смешивайте streaming SSR с React Server Components: это связанные, но разные механизмы и deployment APIs. Выбор render API зависит от Node/edge платформы. [React streaming server APIs](https://react.dev/reference/react-dom/server/renderToPipeableStream), [React 18 Suspense streaming](https://react.dev/blog/2022/03/29/react-v18).

### Transition + Suspense.
<!-- question-id: 16-react-concurrent-rendering-q17 -->
#### Ответ

Если update помечен Transition и новый UI suspends, React может подготовить его в фоне, сохраняя уже показанное содержимое вместо немедленного возврата к ближайшему fallback. Когда готовность достигнута, React commit-ит новую версию согласованно. Это полезно для route/tab navigation: текущая страница остаётся интерактивной, пока следующая boundary ждёт код/данные. `useDeferredValue` обеспечивает похожее поведение для устаревающего значения.

На первоначальном mount предыдущего контента нет, поэтому fallback показывается нормально. Transition не означает, что все nested boundaries должны завершиться до первого обновления; границы reveal и UX остаются важны. Сохраняемый экран должен по-прежнему ясно показывать pending/selection и не создавать видимость завершённого действия. Используйте `useTransition().isPending` для локального статуса, если нужен.

Suspense должен действительно получать suspend от интегрированного источника; fetch в effect или handler не становится Suspense-aware из-за обёртки `startTransition`. Не блокируйте urgent input и проверьте, что новый route не использует state, который нужно сбросить/очистить немедленно. [Transitions предотвращают нежелательные fallback](https://react.dev/reference/react/useTransition), [ограничения Suspense](https://react.dev/reference/react/Suspense).
