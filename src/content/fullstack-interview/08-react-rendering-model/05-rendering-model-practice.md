# Rendering model practice

## Interview questions

### предсказать количество renders;
<!-- question-id: 08-react-rendering-model-task01 -->
#### Ответ

В условии нет кода, поэтому точное число render calls определить нельзя. Для разбора сначала уточняю React version, root API (`createRoot` или legacy), dev/production, Strict Mode, начальное состояние и последовательность событий. Затем строю timeline: какие setters вызываются синхронно в одном event, какие приходят из Promise/timer, применяются ли functional updaters, и меняются ли props/context/store у каждого компонента.

React 18+ с `createRoot` автоматически batching-ит большинство updates из React и внешних callbacks; отдельные intentional user events обычно образуют разные границы. Strict Mode development может вызывать render logic повторно, а concurrent work — повторяться/отбрасываться. `memo`/compiler могут добавить bailout, но точное число вызовов — implementation detail, не контракт.

Чтобы ответить на конкретный кейс, посчитайте изменения состояния и предполагаемые commit-ы, а затем подтвердите React Profiler-ом; отдельно различайте вызовы component function, commit и DOM mutations.

### найти лишние renders;
<!-- question-id: 08-react-rendering-model-task02 -->
#### Ответ

Поскольку компонентный код не дан, сначала измеряю React DevTools Profiler на конкретном interaction: какой компонент render-ился, сколько времени занял render, что запустило update и какие props/context/state изменились. Console logs не всегда годятся: Strict Mode и interrupted/retried renders могут создавать вызовы без commit-а.

Проверяю, действительно ли лишняя работа видима пользователю. Частые причины: state хранится слишком высоко; широкий context меняется на каждый input; inline object/function мешают `memo`; родитель передаёт несвязанные props; derived state синхронизируется через Effect. Первые меры обычно — colocate state, разделить границы компонентов, вычислять derived values напрямую и передавать минимальные props.

`memo`, `useMemo` и `useCallback` добавляю только при измеренной пользе: они имеют стоимость и не гарантируют предотвращение всех render-ов. После изменения повторяю тот же profiler-сценарий и проверяю функциональную эквивалентность, включая handler behavior и cleanup.

### разобраться с неправильными keys;
<!-- question-id: 08-react-rendering-model-task03 -->
#### Ответ

Без списка и его операций нельзя указать конкретную ошибочную строку. Проверяю, откуда берётся key и меняются ли insert/delete/reorder/filter/sort; key должен быть стабильным уникальным идентификатором сущности среди текущих siblings, а не текущим индексом и не случайным числом.

Уточняю симптом на дочернем компоненте с локальным state или uncontrolled input: переставляю записи, меняю одну сущность, проверяю, не переехали ли state, focus, draft или animation. Заменяю index/random key на `item.id`, а для элементов без естественного id генерирую стабильный id при создании данных, не во время render-а. `key` не доступен внутри компонента как prop.

Тестирую reorder, insertion в начало, delete и одинаковые labels с разными IDs. Если позиция сама по смыслу идентичность и список неизменяемый, index допустим, но это должно быть зафиксированным инвариантом.

### восстановить/сбросить state через key;
<!-- question-id: 08-react-rendering-model-task04 -->
#### Ответ

Key является частью identity компонента, поэтому новый key у того же типа на той же позиции заставляет React размонтировать прежнюю ветку и смонтировать новую: local state и refs сбрасываются, cleanup-ы выполняются, DOM/Effects создаются заново. Это правильный способ начать форму с чистого состояния при смене сущности, если никаких данных старого editor-а переносить не нужно.

    function ProfileEditor({ userId }: { userId: string }) {
      return <Editor key={userId} userId={userId} />;
    }

Если нужно восстановить draft позже, сохраняйте draft выше по дереву или в отдельном store, индексированном `userId`; key-reset намеренно уничтожает state ветки. Не используйте `Math.random()` или меняющийся key на каждом render-е — это постоянно теряет ввод, focus и работу Effects. Проверьте переход A→B и обратно, cleanup запроса и отсутствие непреднамеренного reset-а при обычном rerender-е.

### объяснить render → reconciliation → commit.
<!-- question-id: 08-react-rendering-model-task05 -->
#### Ответ

Объяснение делю на три этапа. **Render**: событие/state/props/context запускает React работу; React вызывает компоненты, получает новые React elements и строит предполагаемое дерево. Это расчёт, он должен быть pure и может повториться/быть отменён до commit-а.

**Reconciliation**: React сопоставляет новое дерево с текущим по типу, позиции и keys, решает, что сохранить, обновить, переместить или удалить. Именно тут корректные stable keys удерживают идентичность списка и локальное состояние; props-компонента обычно не сравниваются глубоко без специального bailout.

**Commit**: готовые host changes применяются к DOM, обновляются refs и запускаются lifecycle/effects. Только этот этап отображает результат React reconciliation в host tree; отсутствие изменения DOM не означает, что render-функция не вызывалась. Браузерный paint идёт отдельно после этого. Для диагностики Profiler различает render и commit, а Performance panel помогает найти layout/paint bottleneck.
