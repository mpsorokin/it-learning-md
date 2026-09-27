# Streaming and navigation

## Interview questions

### Streaming.
<!-- question-id: 20-next-rendering-q17 -->
#### Ответ
Streaming — отправка серверного HTML/RSC ответа частями по мере готовности сегментов, обычно через Suspense. Shell и fallback могут прийти раньше медленного запроса, остальной интерфейс дорисовывается, когда данные готовы. Это уменьшает время до первого полезного отображения и позволяет другим областям страницы оставаться доступными, но не ускоряет сам медленный backend. Проверяйте TTFB, время до контента и buffering в CDN/reverse proxy; буферизация может отменить выигрыш. Размещайте границы осмысленно: слишком крупная граница задерживает весь экран, слишком мелкие создают визуально шумный интерфейс.

### Suspense boundaries.
<!-- question-id: 20-next-rendering-q18 -->
#### Ответ
Suspense обозначает границу, где React может временно показать fallback, пока дочерний компонент приостанавливает render — например, ожидая серверные данные. В Next.js loading.tsx создаёт такую границу для сегмента, а вложенные Suspense дают независимые состояния загрузки и потоковую отдачу. Граница также влияет на partial prefetch и визуальную группировку. Она не исправляет медленный источник и не превращает последовательные await в параллельные: параллелизуйте независимые запросы, иначе появится waterfall. Ошибки обрабатываются Error Boundary, не самим fallback; настройте понятное восстановление и не раскрывайте внутренние ошибки.

### Partial rendering.
<!-- question-id: 20-next-rendering-q19 -->
#### Ответ
Под partial rendering могут иметь в виду два близких, но разных свойства. При App Router navigation Next заменяет изменившиеся route segments и сохраняет общие layouts/их state вместо полного reload. В Next 16 с включёнными Cache Components partial prerendering строит статический shell и откладывает request-time участки за Suspense, которые затем стримятся. Это отдельная конфигурация и не следует путать её с любой клиентской навигацией. Проверьте, какой именно слой имеется в виду, иначе можно неверно объяснить кэширование. Ссылки: [навигация](https://nextjs.org/docs/app/getting-started/linking-and-navigating) и [Cache Components](https://nextjs.org/docs/app/getting-started/partial-prerendering).

### Navigation в App Router.
<!-- question-id: 20-next-rendering-q20 -->
#### Ответ
Внутренний переход через Link — клиентский transition: Next может заранее загрузить доступный маршрут, запросить RSC Payload, сохранить общие layouts и заменить нужные сегменты без полной перезагрузки. Dynamic route без готового ответа может показать loading.tsx/Suspense, а затем обновиться; back/forward сохраняют браузерную историю, а состояние некоторых клиентских сегментов — по правилам Router Cache. Для внешнего URL или полного обновления выполняется обычная навигация. Для imperative перехода используйте useRouter из next/navigation только когда Link не подходит. Prefetch и кэш сегментов зависят от версии и типа маршрута; актуально: [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating).

