# Server Actions and serialization

## Interview questions

### Что такое Server Action?
<!-- question-id: 22-next-server-actions-q01 -->
#### Ответ
Server Action (в терминологии React — Server Function) — асинхронная функция с директивой 'use server' на уровне функции или файла, которая выполняется в серверной среде и может быть вызвана из клиентского UI. Обычно её используют для form submission и мутаций: валидация, авторизация, запись, инвалидирование кэша и ответ форме. Это удобный React/Next transport между UI и сервером, но не приватный локальный вызов: экспортированную Action нужно считать доступным HTTP endpoint, защитить аутентификацией и авторизацией. Server Actions стабильны и включены по умолчанию в Next 14+; для Next 16.3.x смотрите [use server](https://nextjs.org/docs/app/api-reference/directives/use-server).

### Как Action вызывается?
<!-- question-id: 22-next-server-actions-q02 -->
#### Ответ
Функцию можно передать в form action — браузер/React отправляет FormData — или вызвать из Client Component обработчиком события/useEffect. Next передаёт сериализуемые аргументы на сервер через POST/RSC-механизм, находит действие по внутренней ссылке, запускает его и возвращает сериализуемый результат и при необходимости обновлённое UI/RSC tree. Это сетевой roundtrip, с latency, ошибками сети и повторными отправками, а не прямое исполнение функции в браузере. В текущей реализации Server Functions из клиента диспетчеризуются последовательно; это implementation detail, поэтому параллельную работу проектируйте явно внутри одной серверной функции или другого API. [Как обновлять данные](https://nextjs.org/docs/app/getting-started/updating-data).

### Что сериализуется?
<!-- question-id: 22-next-server-actions-q03 -->
#### Ответ
Между клиентом и сервером передаются аргументы и возвращаемое значение, которые поддерживает сериализация React для Server Functions; Form передаёт FormData. Безопасная практика — DTO/простые значения, идентификаторы, массивы, ограниченные поля и ожидаемый результат, а не ORM-модель с методами, сокет, замыкание или произвольный объект с секретными полями. Поддержка конкретных типов определяется протоколом React/версией, поэтому не рассчитывайте на JSON.stringify как полный перечень. Любое client-provided значение, включая hidden input и bound аргумент, подделываемо и должно быть проверено заново на сервере. Учитывайте лимит тела Server Action (по умолчанию 1 MB в актуальной конфигурации Next) и не используйте Action для больших загрузок без явной настройки/прямого upload flow. См. [use server](https://nextjs.org/docs/app/api-reference/directives/use-server) и [serverActions config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions).

