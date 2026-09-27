# Rendering pipeline practice

## Interview questions

### Нарисовать и объяснить pipeline:
<!-- question-id: 20-next-rendering-task01 -->

```text
Request
→ Next Server
→ Server Components
→ RSC payload
→ HTML
→ Browser
→ Client Components JS
→ Hydration
→ Interactive page
```

#### Ответ
Для исходного App Router pipeline: запрос сопоставляется с маршрутом; сервер исполняет Server Components и получает данные, а клиентские границы остаются ссылками в RSC-дереве. React формирует RSC Payload и на первой загрузке вместе с ним HTML-предпросмотр. Ответ может стримиться по готовности Suspense-сегментов. Браузер сразу отображает HTML, загружает клиентские JS-модули, сверяет дерево по RSC Payload и гидратирует только Client Components; после этого появляются обработчики/state. Для последующей навигации вместо полного документа обычно приходит RSC-обновление сегментов, а общие layout остаются. На каждом этапе ошибки должны попасть в соответствующую loading/error boundary; приватные данные допускаются только в серверной части и не должны попасть в payload/props.

