# Render-blocking resources and critical path

## Interview questions

### Какие ресурсы блокируют parsing?
<!-- question-id: 06-browser-internals-q12 -->
#### Ответ
Обычный parser-inserted classic script без async/defer блокирует продолжение HTML parsing: код должен иметь возможность менять следующий DOM. Inline classic script также выполняется на месте и может приостановить parser.

Stylesheets обычно блокируют первый render, а не сам parsing HTML, но могут задержать исполнение следующего синхронного скрипта. Async, defer и module scripts имеют отдельные правила; не смешивайте parser-blocking и render-blocking.

### CSS blocking behavior.
<!-- question-id: 06-browser-internals-q13 -->
#### Ответ
Stylesheet для текущего media обычно задерживает первый render, чтобы не показывать неоформленный или неверно оформленный кадр. Таблица стилей сама по себе обычно не останавливает HTML parser; stylesheets с неподходящим media могут не блокировать текущий render.

Stylesheet перед синхронным script может блокировать его выполнение, чтобы чтение getComputedStyle() увидело актуальные правила. Цепочки @import добавляют последовательные зависимости, поэтому проверяйте critical path в waterfall.

### JS blocking behavior.
<!-- question-id: 06-browser-internals-q14 -->
#### Ответ
Parser-inserted classic script без async/defer прерывает parser до загрузки и исполнения, поскольку может читать или менять документ. CSS, загруженный перед таким скриптом, может задержать само исполнение.

Долгая работа JS также блокирует main thread: события и часть rendering work ждут завершения задачи. Async/defer меняют момент и порядок выполнения, но не делают дорогой код бесплатным.

### async vs defer.
<!-- question-id: 06-browser-internals-q15 -->
#### Ответ
Для внешнего classic script атрибуты async и defer позволяют скачивать файл параллельно parsing. Async выполняет его сразу после готовности; порядок нескольких async-файлов не гарантирован, а выполнение может прервать parser. Это подходит для независимого кода.

Defer выполняет scripts после parsing в порядке появления в документе; DOMContentLoaded ждёт их. На обычном inline classic script эти атрибуты не дают такого поведения. Module scripts отложены по умолчанию, а async меняет их запуск. [HTML Standard](https://html.spec.whatwg.org/multipage/scripting.html).

### Порядок нескольких defer.
<!-- question-id: 06-browser-internals-q16 -->
#### Ответ
Внешние parser-inserted classic scripts с defer можно скачивать параллельно; выполняются они после завершения parsing и сохраняют порядок в документе. Это позволяет объявить последовательность зависимых scripts без блокировки парсера на время загрузки.

Это гарантия для такого набора defer-скриптов, не для async и не для динамически созданных scripts. Медленный ранний defer может задержать последующие и DOMContentLoaded.

### Module scripts.
<!-- question-id: 06-browser-internals-q17 -->
#### Ответ
type="module" загружает модуль и его import graph; по умолчанию module script отложен до завершения parsing. Модули имеют собственный scope и strict mode; cross-origin загрузка требует CORS. Атрибут defer для module script ничего не меняет.

С async модуль исполняется, когда готов он и его зависимости, потенциально до конца parsing; не рассчитывайте на порядок нескольких async modules. Top-level await может задержать выполнение зависимых модулей.

### Critical rendering path.
<!-- question-id: 06-browser-internals-q21 -->
#### Ответ
Critical rendering path — последовательность данных и работ, нужных для первого значимого кадра: HTML, DOM, CSS styles, необходимые blocking scripts, layout и paint. В общей модели DOM/CSS дают структуру и стиль, затем движок рассчитывает геометрию и рисует; реализации перекрывают и оптимизируют этапы.

Уменьшайте задерживающие ресурсы и сетевые цепочки, отправляйте важный HTML/CSS рано, откладывайте несущественный JS и помогайте браузеру рано найти LCP-ресурс. Измеряйте критическую цепь в trace/waterfall. [Руководство по LCP](https://web.dev/articles/optimize-lcp).

