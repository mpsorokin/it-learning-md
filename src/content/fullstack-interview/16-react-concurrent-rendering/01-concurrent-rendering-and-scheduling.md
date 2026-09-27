# Concurrent rendering and scheduling

## Interview questions

### Что такое concurrent rendering?
<!-- question-id: 16-react-concurrent-rendering-q01 -->
#### Ответ

В React concurrent rendering — возможность renderer подготовить обновлённую версию UI в render phase так, чтобы работу можно было приостанавливать, продолжать, перезапускать или отбросить до изменения DOM. В React 19.2.8 это не отдельный режим, который приложение вручную переключает на каждый render: concurrent renderer используется возможностями вроде transitions/Suspense, а обычные срочные обновления остаются приоритетными. Современный root создаётся через `createRoot`/`hydrateRoot`.

Ключ к корректности — render должен быть чистым и повторяемым: React вправе вызвать компонент несколько раз или не закоммитить его результат. DOM mutations и layout/passive Effects привязаны к commit после успешной подготовки согласованного дерева, а не к каждой попытке render. Поэтому нельзя отправлять запрос, мутировать глобальное состояние, логировать бизнес-событие или изменять props прямо в render.

Пользовательская ценность — React может позволить браузеру обработать urgent input и подготовить тяжёлое неurgent обновление в фоне. Это не автоматически ускоряет любую функцию и не заменяет оптимизацию чрезмерной синхронной работы. [Официальное описание Concurrent React](https://react.dev/blog/2022/03/29/react-v18), [render/commit phases](https://react.dev/learn/render-and-commit).

### Concurrent ≠ parallel — почему?
<!-- question-id: 16-react-concurrent-rendering-q02 -->
#### Ответ

`Concurrent` означает, что React умеет иметь незавершённую работу нескольких версий UI, выбирать её приоритет и уступать main thread между render units. `Parallel` означало бы одновременное вычисление JavaScript на нескольких CPU threads. React-компоненты обычно исполняются в main thread и обычный JS function call остаётся run-to-completion: браузер/React не прервёт произвольный цикл внутри компонента в середине инструкции.

Поэтому длинный `items.map(veryExpensiveSynchronousFunction)` в одном render всё ещё может заблокировать ввод, пока эта синхронная функция не вернётся. Concurrent renderer может уступить между частями дерева и отменить работу при появлении более приоритетного update; для CPU-параллелизма нужны Web Workers или другие browser APIs, а для гигантских списков — алгоритмическое сокращение, индексация и virtualization. Это различие важно: `startTransition` меняет приоритет React update, но не перемещает пользовательский код на worker/thread.

Сам термин также не обещает предсказуемый fixed time slice или параллельное исполнение. Не привязывайте correctness к внутреннему scheduler. [React Team: concurrent не меняет JavaScript threading model](https://react.dev/blog/2022/03/29/react-v18).

### Interruptible rendering.
<!-- question-id: 16-react-concurrent-rendering-q03 -->
#### Ответ

Interruptible значит, что concurrent render может быть приостановлен между render units, уступить браузеру, а затем продолжиться; более срочный update может прервать его, после чего React перезапустит актуальную работу или отбросит устаревшую попытку. Например, пока React готовит результаты фильтрации как Transition, новое нажатие клавиши для input должно обработаться раньше старой выдачи.

Незавершённое дерево ещё не видно пользователю: React не применяет частичные DOM изменения до commit, поэтому экран остаётся на предыдущей согласованной версии. Если render бросает error/suspends, результаты текущей попытки не коммитятся и управление получает соответствующий boundary. Сторонние мутации/запросы внутри render недопустимы именно потому, что попытка может быть повторена или отменена.

Нельзя рассчитывать на прерывание внутри одной длительной CPU-bound функции; React должен дойти до точки, где может уступить. Разбейте алгоритм, уменьшите объём данных или перенесите CPU работу в Worker, если profiler показывает именно этот блок. [Объяснение interruptible rendering из релиза React 18](https://react.dev/blog/2022/03/29/react-v18).

### Scheduling.
<!-- question-id: 16-react-concurrent-rendering-q04 -->
#### Ответ

React получает updates от state, props и Context и планирует работу для render/commit. В concurrent render он может уступать main thread и возвращаться к подготовке дерева позже; batching позволяет объединить подходящие updates. Urgent пользовательский input должен обрабатываться раньше тяжёлой transition работы. Scheduling — внутренний механизм: публичный контракт состоит в поведении API вроде `startTransition`, `useTransition` и `useDeferredValue`, а не в точном time slice, количестве кадров или порядке каждого компонента.

Сам callback `startTransition(action)` выполняется сразу; только state updates, синхронно поставленные внутри него, помечаются Transition. `setTimeout` внутри action создаст update за её пределами; после `await` update следует снова обернуть в `startTransition` согласно текущим caveats. React может отменить render устаревшего низкого приоритета и начать новый, но уже committed state/DOM остаётся корректным.

Для отладки отделите scheduler от bottleneck: Chrome Performance покажет длинную синхронную JS-функцию, React Profiler — какие компоненты и commit дороги. Не используйте внутренние lane/priority names как стабильный application API и не полагайтесь на задержку в миллисекундах. [Официальные caveats `startTransition`](https://react.dev/reference/react/startTransition), [React 18 concurrent rendering](https://react.dev/blog/2022/03/29/react-v18).

### Priorities.
<!-- question-id: 16-react-concurrent-rendering-q05 -->
#### Ответ

Практически разделяйте updates на urgent и non-urgent по пользовательскому последствию. Ввод, cursor/selection и непосредственное подтверждение клика должны быстро отражаться; expensive results, смена крупного view или route могут быть Transition. Urgent update может прервать подготовку non-urgent UI, чтобы пользователь продолжал управлять интерфейсом.

`startTransition`/`useTransition` понижают приоритет updates, которые вы контролируете через set function; `useDeferredValue` позволяет отложить значение, пришедшее от props/родителя. Transition нельзя использовать для controlling text input — input должен обновляться сразу, а вычисляемый subtree может потреблять deferred value. `isPending` — сигнал о transition work, не универсальная загрузочная метрика.

Публичные APIs задают UX-категории, но не дают программе назначить точное числовое priority или SLA исполнения. Не маркируйте urgent action как non-urgent ради того, чтобы скрыть медленный ответ; используйте pending state, сохраняйте доступность/последовательность действий и подтверждайте отзывчивость на слабом устройстве. [Документация Transition priorities](https://react.dev/reference/react/useTransition), [запрет Transition для text inputs](https://react.dev/reference/react/startTransition).
