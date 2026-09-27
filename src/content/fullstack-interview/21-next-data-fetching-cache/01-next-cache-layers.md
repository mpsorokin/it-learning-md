# Next.js cache layers

## Interview questions

### Где fetch выполняется в RSC?
<!-- question-id: 21-next-data-fetching-cache-q01 -->
#### Ответ
В App Router Server Component исполняется на сервере, поэтому fetch к upstream можно выполнить прямо из компонента или вынесенной серверной функции. Next расширяет стандартный fetch опциями кэширования/ревалидации, но не следует думать, что один факт вызова из RSC всегда сохраняет ответ: политика зависит от версии, опций и включённого режима Cache Components. Для собственной базы обычно вызывайте data-access слой напрямую, а не HTTP Route Handler этого же приложения: внутренний HTTP-hop добавляет сеть, обработку и иногда проблемы во время build. Секреты остаются в серверном модуле; в UI передавайте только нужный сериализуемый результат.

### Request memoization.
<!-- question-id: 21-next-data-fetching-cache-q02 -->
#### Ответ
Request memoization устраняет повторные одинаковые GET fetch внутри одного React server render: несколько компонентов могут запросить один URL с одинаковыми параметрами, а Next/React переиспользует результат в рамках этого рендера. Это дедупликация работы, а не постоянное хранилище: она не обещает reuse между разными HTTP-запросами или пользователями и сама по себе не задаёт свежесть. Если данные читаются из ORM, можно вынести общий loader/использовать React cache по подходящей версии, явно определив ключ. Не полагайтесь на memoization для консистентности мутаций или изоляции секретных данных; отдельно настраивайте persistent cache.

### Data Cache.
<!-- question-id: 21-next-data-fetching-cache-q03 -->
#### Ответ
Data Cache — серверный persistent cache результатов запросов/функций в прежней модели App Router. У кэшированной записи есть срок revalidation и/или теги; она может обслуживать разные запросы и маршруты, поэтому персональные результаты нельзя класть в общий ключ. В Next 16.3 надо сначала указать режим: в previous model fetch по умолчанию не кэшируется, его можно явно сделать force-cache; Cache Components — opt-in через cacheComponents и использует use cache/cacheLife/cacheTag. Это разные политики, их имена похожи, но нельзя переносить предположения между ними. [Next.js описывает обе модели отдельно](https://nextjs.org/docs/app/guides/caching-without-cache-components).

### Full Route Cache.
<!-- question-id: 21-next-data-fetching-cache-q04 -->
#### Ответ
Full Route Cache в прежней модели хранит готовые HTML и RSC результаты статически отрендеренных маршрутов, чтобы не выполнять render для каждого запроса. Dynamic routes/request-time APIs обычно требуют динамического ответа, хотя явно кэшированные данные могут сохраняться независимо. Revalidate данных может заново построить затронутый маршрут. Не кладите в общий route output содержимое, зависящее от текущего пользователя, и проверьте CDN/reverse proxy на корректный Cache-Control. В Next 16 с opt-in Cache Components основная идея меняется: prerendered shell сочетается с динамическими Suspense-участками, а не обязательно один бинарный cache hit/miss для всего маршрута.

### Router Cache.
<!-- question-id: 21-next-data-fetching-cache-q05 -->
#### Ответ
Router Cache — клиентское хранилище RSC payload по route segment, применяемое при prefetch и навигации, чтобы не запрашивать весь интерфейс повторно и сохранять shared layouts. Это не серверный Data Cache и не browser HTTP cache: очистка одного слоя не очищает автоматически остальные. Кэшированные сегменты могут обновиться после Server Action/revalidation или router.refresh; точные TTL и что именно сохраняется менялись между версиями. В Next 15 по умолчанию перестали кэшировать page segments так, как это делалось раньше, оставив отдельное поведение layouts/loading. Проверяйте текущую документацию и пользовательский поток, а не рассчитывайте на Router Cache как на источник свежих данных.

### Какие caches существуют в Next?
<!-- question-id: 21-next-data-fetching-cache-q06 -->
#### Ответ
Для App Router полезно различать: request memoization на время одного server render; persistent Data Cache в прежней caching model; Full Route Cache для готового статического маршрута; Router Cache в браузере для RSC-сегментов; отдельно HTTP/CDN/browser caches, которые управляются своими заголовками. Вопрос «какие кэши в Next» без версии неполон. Предположение здесь — стабильная ветка Next.js 16.3.x на 27.09.2026, App Router. В ней Cache Components — opt-in через cacheComponents, с use cache, cacheLife и cacheTag; без этой настройки действует separate previous model, где fetch defaults другие. Начинайте диагностику с каждого слоя и его ключа/срока/инвалидации. [Официальная карта моделей](https://nextjs.org/docs/app/guides/caching-without-cache-components).

