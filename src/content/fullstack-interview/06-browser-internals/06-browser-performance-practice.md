# Browser performance practice

## Interview questions

### оптимизировать animation;
<!-- question-id: 06-browser-internals-task01 -->
#### Ответ
Запишите trace анимации на целевом устройстве и определите bottleneck: JS long task, layout, paint, raster или пропущенные кадры. Если позиция постоянно меняется через top/left, попробуйте transform/opacity или Web Animations API; вынесите расчёты из каждого кадра.

    const element = document.querySelector<HTMLElement>(".item");
    if (!element) throw new Error("Animation element not found");

    element.animate(
      [
        { transform: "translateY(8px)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 180, easing: "ease-out" },
    );

Это кандидат на composited animation, не гарантия. Повторите тот же профиль, проверьте frame drops, main-thread work и layer memory, сравните до/после.

### найти layout thrashing;
<!-- question-id: 06-browser-internals-task02 -->
#### Ответ
Ищите чередование layout reads (`getBoundingClientRect`, `offsetWidth`) и DOM/style writes. Performance trace показывает Forced reflow insight и stack trace. Поскольку исходный фрагмент не задан, ниже конкретный сценарий: у карточек текущая высота `auto`, `box-sizing: border-box`, и перед анимацией нужно зафиксировать уже показанную высоту. Сначала считываем все размеры, затем записываем те же border-box высоты:

    const items = Array.from(document.querySelectorAll<HTMLElement>(".item"));
    const heights = items.map((item) => item.getBoundingClientRect().height);

    heights.forEach((height, index) => {
      const item = items[index];
      if (!item) return;
      item.style.height = `${height}px`;
    });

Так измерения не чередуются с записями, а заданная высота совпадает с исходной геометрией карточки в момент фиксации. После анимации верните `height: auto`, иначе размер останется замороженным и может устареть при смене контента или viewport. Для другого целевого layout сначала рассчитайте все новые значения из общего snapshot измерений, затем примените их отдельной write-фазой. Повторите trace и проверьте, что forced layouts уменьшились и поведение интерфейса осталось ожидаемым.

### оптимизировать страницу с плохим LCP;
<!-- question-id: 06-browser-internals-task03 -->
#### Ответ
Подтвердите проблему по реальным пользователям: route, устройство, сеть и p75. В лаборатории зафиксируйте сценарий и найдите финальный LCP element. Разложите задержку на TTFB, discovery delay, загрузку ресурса и render delay: уменьшение картинки не поможет, если URL обнаруживается поздно или кадр задержан CSS/JS.

Для LCP image: не загружайте его лениво, сделайте URL видимым в HTML рано, отдавайте подходящий responsive size/format и используйте fetchpriority="high" только при конкуренции; preload полезен, когда HTML parser не может рано увидеть ресурс. Для TTFB исследуйте backend/cache; для render delay — CSS, fonts и main-thread tasks. Измерьте фазу до и после каждого изменения. [LCP optimization](https://web.dev/articles/optimize-lcp).

### разобрать waterfall loading.
<!-- question-id: 06-browser-internals-task04 -->
#### Ответ
В Network/Performance waterfall проследите цепочку: redirects, DNS/connect/TLS, TTFB документа, обнаружение CSS/JS/images/fonts, их приоритеты, загрузку и блокирующие зависимости. Найдите поздно стартующий критический ресурс, long waits, повторные запросы, render-blocking CSS и parser-blocking JS. Сопоставьте сеть с main-thread trace: быстрый download не гарантирует быстрый render.

Сформулируйте гипотезу о конкретном звене — например, LCP image доступен только после JS — и сделайте одно адресное изменение. Повторите тот же сценарий с теми же условиями и сравните нужную фазу, общий LCP и пользовательский результат.

