# Route handlers, navigation and search

## Interview questions

### Route handlers.
<!-- question-id: 23-next-routing-q13 -->
#### Ответ
Route Handler — файл route.ts внутри app, который реализует HTTP endpoint через Web Request/Response API; доступны GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS. На том же сегменте нельзя объявить и page.tsx, и route.ts. Используйте Handler для API, webhook, нестандартных заголовков/статусов, CORS или интеграции с внешним клиентом; считайте его публичной границей: валидация, authn/authz, rate limit и безопасные ответы обязательны. На актуальном Next GET Route Handlers не кэшируются по умолчанию; opt-in зависит от режима, а остальные методы не кэшируются. При Cache Components GET следует её render model. [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).

### Middleware/proxy layer в актуальном Next.
<!-- question-id: 23-next-routing-q14 -->
#### Ответ
В Next.js 16 файл convention middleware переименован в proxy.ts (Middleware deprecated). Proxy выполняется перед завершением запроса и может быстро redirect/rewrite, менять заголовки/cookies или вернуть Response; matcher ограничивает затрагиваемые маршруты. По актуальной документации runtime по умолчанию Node.js, но настраиваемого runtime в Proxy нет; не рассчитывайте на shared mutable globals между развертываниями. Используйте его для дешёвой оптимистичной проверки/перенаправления, а не для медленного DB lookup или единственной авторизации: Server Actions/Route Handlers и доступ к данным проверяйте сами. До Next 16 используйте имя Middleware. [Proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).

### Navigation.
<!-- question-id: 23-next-routing-q15 -->
#### Ответ
Для обычной внутренней навигации используйте next/link Link: он сохраняет общие layouts, выполняет client-side transition, может prefetch маршрут и получает RSC Payload для обновляемых сегментов. Next синхронизирует адрес и history/back-forward; loading UI обеспечивает быстрый отклик на медленном серверном рендере. useRouter из next/navigation нужен для imperative перехода/refresh/replace по результату действия, а не как замена Link в каждой ссылке. Перемещение через window.location вызывает полный reload и может сбросить состояние. Динамический переход без loading boundary иногда ждёт server response до показа следующего экрана; добавляйте осмысленный loading.tsx. [Навигация](https://nextjs.org/docs/app/getting-started/linking-and-navigating).

### Search params.
<!-- question-id: 23-next-routing-q16 -->
#### Ответ
Search params — query string после ?, например ?q=react&page=2; это состояние фильтров/сортировки, которое можно сохранить в URL и передать другому пользователю. Server Page получает searchParams как Promise; Client Component может использовать useSearchParams. Layout не получает актуальные query values, потому что сохраняется и не ререндерится при navigation. Значения не доверенные: валидируйте, ограничивайте page size, приводите типы и учитывайте повторяющиеся ключи (URLSearchParams.getAll). Доступ в Server Page динамически зависит от запроса; в Cache Components поместите runtime участок в Suspense. В статической странице useSearchParams в Client Component требует Suspense boundary на production build. [API reference](https://nextjs.org/docs/app/api-reference/functions/use-search-params).

