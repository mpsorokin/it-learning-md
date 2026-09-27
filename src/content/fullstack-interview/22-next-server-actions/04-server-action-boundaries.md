# Server Action boundaries

## Interview questions

### Когда route handler лучше Server Action?
<!-- question-id: 22-next-server-actions-q10 -->
#### Ответ
Route Handler предпочтительнее для HTTP API как самостоятельного контракта: интеграция с мобильным/внешним клиентом, webhook, произвольные HTTP methods/status/headers, CORS, streaming/webhook signature или взаимодействие с клиентом без Server Component UI. Он напрямую принимает Request и возвращает Response и должен рассматриваться как публичный endpoint со своей authz. Server Action удобнее для мутации, тесно связанной с формой/кнопкой этого Next UI, progressive enhancement и server-rendered revalidation. Не стройте Route Handler только для того, чтобы Server Component вызвал внутренний HTTP endpoint; серверный loader часто может читать доменный слой напрямую. Кэширование GET Route Handler в современных версиях тоже проверьте отдельно, не считайте его автоматически статичным.

### Когда отдельный Nest backend лучше Server Action?
<!-- question-id: 22-next-server-actions-q11 -->
#### Ответ
Отдельный Nest backend уместен, когда серверный домен нужен нескольким независимо развёртываемым клиентам/командам, требуется общий стабильный API/SDK, отдельное масштабирование, отдельный runtime или сложное Nest module/guard/event ecosystem уже оправданы. Тогда Next остаётся BFF/SSR/UI и вызывает backend по явному контракту. Для приложения, где мутации нужны только собственному App Router UI, Server Action обычно убирает лишний hop и дублирование схемы/авторизации. Не делайте выбор по абстрактному правилу «backend всегда лучше»: учитывайте границы ответственности, deployment, observability, auth propagation, latency и ownership API. Доменную бизнес-логику в любом случае держите в тестируемом server-only service, который можно вызвать из Action и отдельного API слоя.

