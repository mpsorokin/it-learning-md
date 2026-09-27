# Performance diagnostics

## Interview questions

### Как найти performance bottleneck?
<!-- question-id: 07-browser-performance-web-vitals-q08 -->
#### Ответ

Начинайте с наблюдаемой проблемы и поля: определите затронутые маршруты, пользовательские сценарии, устройства, браузеры, регионы, сети и сегменты продукта. Смотрите распределения и p75/p95, а не только среднее; проверьте объём и свежесть выборки. CrUX полезен как независимый ориентир по Chrome, но агрегирует и не всегда содержит достаточно деталей; собственный RUM позволяет привязать метрику к URL, LCP-элементу или interaction. Сравните сегменты, чтобы не улучшить среднее ценой мобильных пользователей.

Затем зафиксируйте гипотезу и воспроизводимый lab-сценарий: конкретная навигация или действие, одинаковые данные/cache state, viewport, CPU/network throttling и версия браузера. В DevTools записывайте trace, сопоставляйте Web Vitals и пользовательские метки с main thread, network waterfall, layout/paint и long tasks. Для загрузки ищите, где теряется время до FCP/LCP; для INP — input delay, обработчик или presentation; для CLS — какая существующая область сдвигается и после какого события. Различайте корреляцию и причину: например, большой bundle может совпадать с плохим INP, но trace должен подтвердить parse/evaluate work в момент задержки.

Меняйте один существенный фактор или выпускайте контрольный эксперимент, затем повторяйте lab-сценарий и проверяйте RUM по тем же сегментам. Проверяйте guardrails: ошибка загрузки, конверсия, визуальное качество, расход данных, cache hit и стоимость сервера. Лабораторные измерения дают локальную причинную подсказку, поле — результат у реальных пользователей; CrUX является rolling 28-day выборкой и не подходит для мгновенной проверки релиза. [Полевые и лабораторные измерения](https://web.dev/articles/vitals-tools), [работа с Performance panel](https://developer.chrome.com/docs/devtools/performance).

### CPU-bound vs network-bound.
<!-- question-id: 07-browser-performance-web-vitals-q09 -->
#### Ответ

Network-bound означает, что критический путь в основном ждёт сеть: установку соединения, ответ сервера, передачу больших ресурсов или цепочку зависимых запросов. В waterfall видны поздний старт, значимое ожидание ответа/скачивание и блокирующие зависимости; проверьте cache, размер, регион, protocol и Resource Timing. CPU-bound означает, что поток выполнения занят parsing/compiling/evaluating JavaScript, обработчиками, style/layout или paint; trace показывает длинные участки main thread и время между готовностью ресурса и отрисовкой.

Сравните одинаковый сценарий при раздельном изменении условий: network throttling помогает проявить сетевую чувствительность, CPU throttling — стоимость клиентских вычислений. В реальном поле сопоставляйте device class, effective network/регион, TTFB, LCP subparts и INP. «Медленно» само по себе не определяет bottleneck: ресурс может быстро скачаться, но долго обрабатываться CPU; наоборот, свободный CPU ничего не исправит, если HTML или API ждёт сервер.

Границы не всегда чистые. Сеть и CPU могут конкурировать одновременно: большой JavaScript создаёт и transfer cost, и main-thread cost; более мелкие chunks уменьшают initial work, но могут добавить RTT-зависимую цепочку. Оптимизируйте участок, на который указывает trace, а потом проверьте итоговую метрику и стоимость решения у реальных пользователей. [Chrome DevTools показывает main-thread trace и network timing](https://developer.chrome.com/docs/devtools/performance/reference), [ограничения lab-данных](https://web.dev/articles/vitals-tools).

### PerformanceObserver.
<!-- question-id: 07-browser-performance-web-vitals-q17 -->
#### Ответ

`PerformanceObserver` подписывает код на записи Performance Timeline, например `resource`, `paint`, `largest-contentful-paint`, `layout-shift`, `event` или `longtask`. Callback вызывается браузером для накопленного списка записей, поэтому это предпочтительнее регулярного polling: меньше дедупликации и гонок за общий timeline. Параметр `buffered: true` позволяет получить часть уже созданных записей после поздней подписки; поддержка конкретного типа зависит от браузера. API наблюдения не гарантирует, что каждая запись доступна в каждом контексте или что её атрибуция полна.

Минимальный пример для long tasks (запускайте только в браузере; сначала проверьте поддержку):

```ts
if (
  typeof PerformanceObserver !== "undefined" &&
  PerformanceObserver.supportedEntryTypes.includes("longtask")
) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log({
        type: entry.entryType,
        startTime: entry.startTime,
        duration: entry.duration,
      });
    }
  });

  observer.observe({ type: "longtask", buffered: true });
}
```

Callback должен быстро складывать компактные данные в очередь; тяжёлая аналитика внутри него сама создаст нагрузку. Не отправляйте каждую запись синхронно и не считайте этот пример реализацией INP/CLS: метрики требуют агрегации, корректного окончания жизненного цикла, учёта background/BFCache и ограничений iframe. Для RUM используйте поддерживаемую версию `web-vitals`, а сырой observer — для собственных диагностических записей и attribution. [Performance Timeline, W3C](https://www.w3.org/TR/performance-timeline/), [Long Tasks API, W3C](https://www.w3.org/TR/longtasks-1/).

### Chrome Performance panel.
<!-- question-id: 07-browser-performance-web-vitals-q18 -->
#### Ответ

Performance panel записывает trace навигации или runtime-сценария, позволяя увидеть хронологию main thread, network, rendering/paint и взаимодействий. Используйте её не просто ради «красной метрики», а чтобы привязать задержку к работе: длинный JS task, style recalculation, layout, поздний запрос, blocking CSS или third-party script. Во вкладках/insights конкретный набор дорожек меняется с версией Chrome; актуальная документация Chrome DevTools показывает Live Metrics для CWV и возможность после воспроизводимого симптома записать trace.

Практический порядок: зафиксируйте сценарий и начальное состояние кеша; откройте DevTools Performance; при необходимости включите CPU и network throttling; запишите загрузку или действие; отметьте целевой интервал; изучите Web Vitals/Interactions, network waterfall и Main flame chart, затем провалитесь в событие и исходный стек. Сравнивайте до/после при одинаковых условиях; для animation/runtime профилируйте соответствующее действие, а не только reload.

Это лабораторное наблюдение на текущей машине, сборке, данных и версии браузера. CPU/network throttling помогают воспроизводить ограничения, но не моделируют все реальные телефоны, сети, cache state и расширения. Поэтому trace объясняет потенциальный механизм, а результат фиксируйте через RUM/CrUX на соответствующих сегментах; не переносите цифру lab-прогона напрямую в production SLA. [Официальный гайд Performance panel](https://developer.chrome.com/docs/devtools/performance), [справочник дорожек и Live Metrics](https://developer.chrome.com/docs/devtools/performance/reference).

### Получаем страницу:
<!-- question-id: 07-browser-performance-web-vitals-task01 -->

```text
LCP = 4.7s
INP = 390ms
CLS = 0.21

И пошагово диагностируем, почему.
```

#### Ответ

Сначала уточните, откуда пришли цифры: field или один lab-прогон; p75 ли это; одинаковы ли URL/template, устройство, окно данных и версии. По порогам web.dev (обновлены 7 мая 2025 года), если это именно p75 одного сопоставимого сегмента, LCP 4,7 с — poor, INP 390 мс — needs improvement, CLS 0,21 — needs improvement. Если это отдельные значения без контекста, такой рейтинг условен: агрегаты могут описывать разные визиты, и один успешный лабораторный запуск не является полевым p75.

1. В RUM/CrUX разбейте значения по шаблону и устройству; проверьте распределение, объём выборки и релиз. Добавьте диагностические измерения: LCP-element и его URL, этапы LCP, конкретное взаимодействие и CLS source. Используйте CrUX как тренд/сигнал, а собственный RUM — как инструмент объяснения причин.
2. Для LCP 4,7 с запишите одинаковый lab trace. Установите фактический кандидат. Разделите время на TTFB, resource load delay, duration и render delay. Если hero запрашивается поздно — сделайте его обнаруживаемым из HTML, пересмотрите client rendering/CSS background и только при подтверждённой критичности примените preload/high priority. Если долго скачивается — проверьте responsive source, размер, CDN/cache. Если ресурс готов, но нет paint — найдите блокирующий CSS/JS или занятый main thread.
3. Для INP 390 мс найдите в RUM проблемный тип взаимодействия и сегмент. В trace установите, где latency: input delay указывает на занятой main thread до обработчика; processing — на его код; presentation — на последующий render/layout/paint. Проверьте сценарий во время начальной загрузки и после неё. Оптимизируйте конкретную тяжёлую работу (разделение задач, уменьшение списка/рендера, deferred work), а не откладывайте ответ интерфейса ради красивого числа.
4. Для CLS 0,21 исследуйте конкретные сдвиги и их временные метки: в trace включите layout shift records и воспроизведите загрузку, async-контент, consent/ads и шрифты. Резервируйте размеры медиа/слотов, сохраняйте место под динамический контент, корректируйте font fallback. Lab может не заметить shift после загрузки; подтвердите источники в RUM и учтите iframe-ограничение API.
5. Выпускайте исправления небольшими экспериментами. Сравнивайте те же сегменты до/после и контролируйте ошибки, визуальную корректность, конверсию, payload и серверные затраты. Недельная тенденция RUM полезна быстрее, чем rolling 28-day CrUX; для этого случая не следует ждать CrUX как единственный критерий.

Исправления независимы, но могут конфликтовать: например, eager-loading всех изображений конкурирует за сеть, а aggressive code splitting добавляет запросы. Приоритизируйте по пользовательскому эффекту и подтверждённому bottleneck, затем перепроверьте все три CWV. [Пороги и p75](https://web.dev/articles/defining-core-web-vitals-thresholds), [LCP subparts](https://web.dev/articles/optimize-lcp), [field vs lab](https://web.dev/articles/vitals-tools), [диагностика CLS](https://web.dev/articles/cls).
