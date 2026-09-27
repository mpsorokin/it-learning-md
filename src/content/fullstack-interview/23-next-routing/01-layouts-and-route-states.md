# Layouts and route states

## Interview questions

### App Router.
<!-- question-id: 23-next-routing-q01 -->
#### Ответ
App Router — маршрутизация в каталоге app/ на основе файлов и папок. Папки задают сегменты URL; page.tsx делает сегмент доступным как страницу, layout.tsx оборачивает вложенные страницы, а специальные файлы задают loading/error/not-found состояния или HTTP Route Handler. Layouts и pages по умолчанию Server Components, клиентская навигация работает с RSC tree, nested layouts и streaming. Группа в скобках и parallel slot не добавляют сегмент URL. App Router и Pages Router — разные модели; не переносите автоматически их API (например, next/router) друг в друга.

### Layout.
<!-- question-id: 23-next-routing-q02 -->
#### Ответ
layout.tsx — общий persistent shell для route segment и потомков. Он получает children (и при необходимости parallel slot props), может загружать общую серверную оболочку, а при переходе между дочерними страницами обычно сохраняется и не перемонтируется. Поэтому sidebar, nav и состояние общего UI удобно держать здесь. Из-за повторного использования layout нельзя читать в нём актуальный searchParams; для query state используйте Page prop или клиентский useSearchParams. Не размещайте в layout критичную авторизацию как единственную защиту: вложенные страницы/actions должны проверять доступ самостоятельно. [Layout API](https://nextjs.org/docs/app/api-reference/file-conventions/layout).

### Nested layout.
<!-- question-id: 23-next-routing-q03 -->
#### Ответ
Вложенные layouts композиционно складываются от root layout до layout текущего сегмента, оборачивая Page/children. Это даёт устойчивые границы: общий app shell → dashboard shell → конкретная страница, с независимыми loading/error областями на уровнях. При navigation сохраняются общие layouts и их client state, что уменьшает повторную работу, но означает, что локальный state может пережить смену страницы. Не рассчитывайте, что layout перезапустится ради обновления query string или текущего пользователя; request-sensitive проверки делайте там, где данные актуальны, и защищайте каждый data/action entry point.

### Template.
<!-- question-id: 23-next-routing-q04 -->
#### Ответ
template.tsx похож на layout и тоже оборачивает дочерний сегмент, но при переходе через этот уровень создаёт новый instance. Поэтому state сбрасывается и эффекты повторно запускаются там, где layout сохранился бы. Template полезен, если нужно намеренное повторное появление анимации, аналитического события или локального состояния при смене вложенного маршрута. Его не стоит использовать вместо layout как дефолт: remount может сбрасывать форму, фокус и expensive UI. Выбор должен соответствовать жизненному циклу нужного subtree.

### Loading.
<!-- question-id: 23-next-routing-q05 -->
#### Ответ
loading.tsx создаёт автоматическую Suspense boundary вокруг Page и потомков сегмента; он показывает лёгкий skeleton/fallback, пока сервер завершает рендер/поток. Fallback может быть prefetched, shared layouts остаются интерактивными, а навигация может быть прервана новым переходом. Размещайте boundary так, чтобы быстрые части UI не зависели от одного медленного fetch. Error boundary — отдельный механизм для ошибок. Для streaming production проверьте, что hosting/CDN не буферизует ответ; если notFound/HTTP 404 должен иметь статус 404, вызовите его до начала streaming. [loading convention](https://nextjs.org/docs/app/api-reference/file-conventions/loading).

### Error boundary.
<!-- question-id: 23-next-routing-q06 -->
#### Ответ
`error.tsx` — сегментный React Error Boundary для ошибок в дочернем render; обычно это Client Component с `error`, `reset()` и `retry()` props. В актуальном Next 16.3 `retry()` повторно получает данные и рендерит дочерний сегмент; `reset()` только сбрасывает состояние boundary и повторяет рендер без refetch. Для большинства случаев используйте `retry()` и не смешивайте семантику этих действий. Покажите безопасное сообщение и correlation ID, а причину/stack отправьте в серверный мониторинг. Boundary на сегменте не ловит ошибку из соответствующего `layout.tsx`, потому что layout выше boundary; для неё нужна граница уровнем выше. Ошибку root layout ловит `global-error.tsx`, который должен сам формировать `html/body`. Redirect/notFound — специальные управляющие сигналы Next, обрабатывайте их штатно и не превращайте все в generic 500. Не включайте детали backend exception в production UI. [Документация error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error).

### Not found.
<!-- question-id: 23-next-routing-q07 -->
#### Ответ
notFound() прерывает render текущего сегмента и ищет ближайший not-found.tsx; результат получает noindex метаданные. Вызывайте его при отсутствии ресурса после проверки/получения данных, а не возвращайте пустой div или обычную ошибку. Вложенный not-found позволяет сохранить общий layout, глобальный файл — fallback всего приложения. Есть streaming nuance: если ответ уже начал передавать Suspense fallback и HTTP headers отправлены, нельзя задним числом сменить статус на 404; Next может передать streamed not-found UI с soft-404 status и noindex. Если важен именно HTTP 404 для compliance/analytics, установите существование ресурса до первой streaming boundary. [notFound API](https://nextjs.org/docs/app/api-reference/functions/not-found).

