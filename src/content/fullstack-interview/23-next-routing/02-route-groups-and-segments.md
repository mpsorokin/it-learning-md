# Route groups and segments

## Interview questions

### Route group.
<!-- question-id: 23-next-routing-q08 -->
#### Ответ
Route Group — папка в круглых скобках, например (marketing) или (app), которая помогает разделить layout/team/concern, но исключается из URL. Можно иметь разные root layouts без общей оболочки, но navigation между ними даст полный document reload; у разных групп нельзя определять одинаковый конечный path, иначе сборка встретит конфликт. Группы не являются security boundary и сами по себе не влияют на route access. Используйте их для организации структуры и применения нужного layout, а права проверяйте в data/action слое. [Route Groups docs](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups).

### Dynamic segment.
<!-- question-id: 23-next-routing-q09 -->
#### Ответ
Dynamic segment задаётся именем папки в квадратных скобках: app/blog/[slug]/page.tsx соответствует /blog/a и /blog/b, а значение приходит в params. В текущем App Router params — Promise, поэтому на Next 16 нужно await params (или использовать подходящий React use в Client Component); старый синхронный пример устарел. Любой URL может содержать произвольное значение, поэтому валидируйте slug, ограничивайте запрос и вызывайте notFound для отсутствующей записи. generateStaticParams позволяет предварительно построить известные значения; без него путь может вычисляться в runtime. [Dynamic Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes).

### Catch-all.
<!-- question-id: 23-next-routing-q10 -->
#### Ответ
[...slug] — catch-all segment: принимает один и более остаточных сегментов и даёт params.slug как массив строк; например, /docs/a/b. [[...slug]] — optional catch-all: также совпадает с родительским URL, при котором параметр отсутствует/undefined. Это полезно для дерева документации или маршрутизации файлов, но требует явно валидировать длину и допустимые значения, иначе один handler становится слишком широким. Планируйте precedence со статическими и обычными dynamic segments и тестируйте корневой случай. Для Next 16 params асинхронны. См. [Dynamic Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes).

### Parallel routes.
<!-- question-id: 23-next-routing-q11 -->
#### Ответ
Parallel Routes позволяют одному layout одновременно отрендерить named slots из папок @slot вместе с children; сами @slot не добавляют URL сегмент. Это удобно для dashboard, где аналитика и команда имеют самостоятельные состояния/loading/error. При soft navigation Next сохраняет active page каждого slot, даже если новый URL его прямо не адресует; при hard load неизвестное состояние восстанавливается через `default.tsx`, иначе может быть 404. `default.tsx` необязателен: добавьте его для явного fallback, например `null` для `@modal`; на hard load unmatched slot без fallback приводит к 404. Явно определяйте, когда slot должен возвращать null, иначе предыдущая панель/модалка останется открыта. [Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes).

### Intercepting routes.
<!-- question-id: 23-next-routing-q12 -->
#### Ответ
Intercepting Route позволяет при клиентском переходе показать маршрут в контексте текущего layout — типичный пример: фото открывается как modal над gallery, URL при этом остаётся shareable. При прямом открытии URL или refresh отображается полная целевая страница, поэтому deep link тоже работает. Префиксы (.), (..), (..)(..) и (...) считают route segments, не число папок; @slot не считается сегментом. Обычно это сочетают с Parallel Routes: slot для modal, default.tsx и маршрут, возвращающий null при закрытии/переходе. Проверяйте back/forward, refresh и прямой URL отдельно. [Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes).

