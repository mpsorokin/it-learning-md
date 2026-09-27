# User data and client cache

## Interview questions

### Где хранить user-specific data?
<!-- question-id: 21-next-data-fetching-cache-q18 -->
#### Ответ
Источник истины — серверная база/доменный API; идентичность пользователя получайте и проверяйте на сервере, затем ограничивайте запрос по tenant/user и разрешению. Server Component может отрендерить данные на сервере и передать клиенту только нужный минимум. Пользовательский ответ не должен попадать в shared cache по ключу только productId или route path: либо не кэшируйте его, либо включайте проверенную область пользователя/tenant в ключ и докажите изоляцию. Учитывайте CDN Cache-Control, Router Cache и клиентский кеш отдельно. Если использовать Cache Components, runtime identity читают снаружи cached scope; private cache — специальное осознанное решение, а не автоматическая защита.

### Когда React Query нужен поверх Next?
<!-- question-id: 21-next-data-fetching-cache-q19 -->
#### Ответ
React Query (TanStack Query) полезен, когда клиенту нужна собственная долговечная модель серверного состояния: polling, refetch при фокусе, offline/retry, согласование нескольких виджетов, богатые optimistic mutations или частые интерактивные обновления без полного route transition. Его можно сочетать с Next Server Components: сервер fetch/hydrate начальный snapshot, клиент продолжает работу query cache. Цена — дополнительный JS, hydration/dehydration, ещё один cache lifecycle и риск двух источников истины. Для маленького экрана выбирайте одну явную стратегию свежести, настраивайте query keys с tenant/user scope и инвалидируйте после мутаций.

### Когда он лишний?
<!-- question-id: 21-next-data-fetching-cache-q20 -->
#### Ответ
React Query обычно лишний для read-mostly маршрута, где серверная загрузка данных, Link-навигация, revalidation и форма/Server Action уже обеспечивают требуемую свежесть. Он также лишний, если вы не используете клиентские cache semantics: лишний provider, bundle и сложность инвалидации могут превысить выгоду. Сначала измерьте количество лишних запросов, задержки и требования к optimistic/offline поведению. Если интерактивный виджет требует live polling, примените query cache локально к нему, не превращая весь сайт в клиентский data layer.

