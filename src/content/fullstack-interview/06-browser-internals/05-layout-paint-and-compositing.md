# Layout, paint and compositing

## Interview questions

### Что такое layout/reflow?
<!-- question-id: 06-browser-internals-q23 -->
#### Ответ
Layout рассчитывает размеры и положение элементов; reflow обычно называют повторную раскладку после изменения DOM, стилей или viewport. Изменение ширины может поменять переносы, высоту блоков и геометрию соседей.

Движок может локализовать пересчёт, но зависимости от flex/grid, текста и размеров расширяют работу. При профилировании ищите конкретные Layout события, их invalidation и длительность, а не делайте вывод только по факту DOM update.

### Что такое repaint?
<!-- question-id: 06-browser-internals-q24 -->
#### Ответ
Repaint — повторная подготовка видимого содержимого после визуального изменения, которое само по себе не меняет геометрию, например цвета текста или фона. Затем изменившаяся область должна быть растеризована и включена в кадр.

Изменение геометрии часто требует также paint, поэтому layout и repaint могут происходить вместе. Размер repaint area и сложность эффектов влияют на цену; смотрите trace или Paint flashing.

### Что такое compositing?
<!-- question-id: 06-browser-internals-q25 -->
#### Ответ
Compositing комбинирует rasterized content/layers в окончательный кадр с нужным порядком, transform, opacity и clipping. Отдельно перемещаемый слой может обновиться без полного повторного рисования его содержимого.

Compositor layerization и GPU use зависят от движка, устройства и контента; большое количество слоёв расходует память. Поэтому composite не означает «всегда бесплатно» и не обещает одинаковый thread model во всех браузерах.

### Почему transform обычно лучше top/left для animation?
<!-- question-id: 06-browser-internals-q26 -->
#### Ответ
top/left часто меняют layout geometry и поэтому могут требовать layout и paint. transform не меняет место элемента в потоке и часто позволяет анимировать уже растеризованный слой на compositor thread; opacity тоже часто имеет такой путь.

Это эвристика, не гарантия: фильтры, эффекты и layerization способны вернуть paint/raster работу, а множество слоёв увеличивает память. Снимите trace и проверьте целевое устройство. [Chrome: non-composited animations](https://developer.chrome.com/docs/lighthouse/performance/non-composited-animations).

### Какие CSS properties вызывают layout?
<!-- question-id: 06-browser-internals-q27 -->
#### Ответ
Обычно layout вызывают свойства, влияющие на геометрию или ограничения раскладки: width, height, margin, padding, display, font metrics, line-height, grid/flex параметры и позиционирование в потоке. Изменения родителя могут изменить layout многих потомков.

Это не закрытый универсальный список: стоимость зависит от значения, DOM, текущих invalidations и движка. Смотрите Performance trace и проверяйте, какое именно изменение привело к Layout на целевой странице.

### Какие только paint?
<!-- question-id: 06-browser-internals-q28 -->
#### Ответ
Изменения без влияния на геометрию часто требуют paint, но не layout: например color, background-color, box-shadow и border-color, если размеры рамки не меняются. Браузер должен обновить визуальные пиксели затронутой области.

«Только paint» — распространённый путь, не гарантия по названию свойства: эффекты, clipping, SVG и слои влияют на работу. Проверяйте paint flashing/trace.

### Какие можно выполнить compositor-only?
<!-- question-id: 06-browser-internals-q29 -->
#### Ответ
Часто compositor-only анимируются transform и opacity, если браузер вынес элемент в composited layer. Тогда обновляются параметры слоя без нового layout и paint его содержимого.

Проверьте trace: эффекты, фильтры, текстуры и устройство могут потребовать raster/paint, а чрезмерный will-change расходует память. Важен факт наблюдаемого pipeline, а не обещание, что свойство всегда compositor-only.

### Может ли getBoundingClientRect() вызвать forced synchronous layout?
<!-- question-id: 06-browser-internals-q30 -->
#### Ответ
Да, если перед вызовом изменили DOM или styles, и layout ещё не обновлён: getBoundingClientRect() должен вернуть актуальную геометрию, поэтому браузер может синхронно выполнить style/layout flush внутри JS. Если состояние уже актуально, чтение может вернуть готовый результат без нового layout.

Проблемный цикл — write → geometry read → write → read: каждый read может принудительно пересчитать геометрию. Группируйте измерения до writes. [Chrome: forced reflow](https://developer.chrome.com/docs/performance/insights/forced-reflow).

### Что такое layout thrashing?
<!-- question-id: 06-browser-internals-q31 -->
#### Ответ
Layout thrashing — многократные forced layout из-за чередования DOM/style writes и геометрических reads в одном цикле. Например, менять style.width, затем читать offsetHeight и повторять для каждого элемента: перед каждым чтением браузеру приходится обновить layout.

В DevTools найдите Forced reflow/Layout события и stack trace, который указывает место записи и последующего чтения. Исправление — собрать measurements в один этап, вычислить значения в JS, затем сделать batch writes; для анимации часто подходит transform. Сравните trace после рефакторинга. [Документация Chrome](https://developer.chrome.com/docs/performance/insights/forced-reflow).

