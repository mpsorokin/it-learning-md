# Memoization hooks

## Interview questions

### useMemo.
<!-- question-id: 13-react-memoization-performance-q06 -->
#### Ответ

`useMemo(calculate, deps)` вызывает чистую функцию расчёта во время render и кэширует её результат между render одного экземпляра компонента. На следующем render зависимости сравниваются по `Object.is`: если все прежние, возвращается прежнее значение; если хотя бы одна изменилась, расчёт выполняется снова. В массив входят все reactive values, прочитанные функцией — props, state и локальные переменные/функции. Список фиксированной длины, записанный inline; exhaustive-deps помогает не пропустить зависимость.

Польза появляется при дорогом вычислении или когда стабильная идентичность результата нужна memoized child/зависимости другого Hook. Для `1 + 2` и других дешёвых расчётов hook может добавить больше сложности, чем экономии. Расчёт должен быть pure: не запускайте внутри запросы, мутации, подписки или иные side effects. В Strict Mode development он может вызываться дважды для выявления impurity. Сам кэш не является state/semantic guarantee: React может сбросить его при, например, suspend на первом mount; если значение должно сохраняться как состояние или mutable handle, используйте state/ref с нужной семантикой.

В React 19.2.8 API есть независимо от compiler. При настроенном React Compiler ручная мемоизация часто избыточна, но не следует удалять её из существующего кода без проверки с production build и тестами. [Справочник `useMemo`](https://react.dev/reference/react/useMemo).

### useCallback.
<!-- question-id: 13-react-memoization-performance-q07 -->
#### Ответ

`useCallback(fn, deps)` кэширует идентичность самой функции между render, пока все зависимости не изменились по `Object.is`. React не вызывает `fn` — он возвращает функцию вызывающему компоненту. Это полезно, когда идентичность имеет значение: callback передаётся как prop memoized child, является dependency другого Hook/Effect или входит в публичный contract custom hook.

Функция всё равно создаётся при выполнении компонента; `useCallback` не экономит стоимость её объявления. Hook добавляет dependency tracking и риск устаревшего closure. В список зависимостей нужно включить каждое reactive значение, которое callback читает. Если callback строит новый state из предыдущего, часто можно использовать functional updater и убрать state из closure: `setItems(items => [...items, newItem])`.

Не оборачивайте каждый handler автоматически. Если получатель не проверяет идентичность функции, нет memoized consumer и нет Hook dependency, кеширование обычно ничего не меняет. А если хотя бы одна dependency каждый render новая, callback тоже будет новым. [Назначение, зависимости и ограничения `useCallback`](https://react.dev/reference/react/useCallback).

### useCallback(fn, deps) по смыслу относительно useMemo.
<!-- question-id: 13-react-memoization-performance-q08 -->
#### Ответ

Оба Hook кэшируют значение между render экземпляра компонента и сравнивают dependency list через `Object.is`. Разница в том, какое именно значение кешируется:

- `useMemo(() => compute(x), [x])` вызывает переданный расчёт во время render и возвращает закешированный результат `compute(x)` — например массив или объект.
- `useCallback(handle, [x])` возвращает саму функцию `handle` и не исполняет её; вызов произойдёт позже из события/Effect/получателя.

Их удобно отличать по коду: если нужен результат вычисления, `useMemo`; если важно, чтобы ссылка на обработчик менялась только при изменении зависимостей, `useCallback`. Концептуально `useCallback(fn, deps)` похож на `useMemo(() => fn, deps)`, но специальный API избегает лишней вложенной функции.

В обоих случаях соблюдайте Rules of Hooks, полный dependency list и pure-render семантику. Кеш оптимизационный и не должен быть условием корректности. [Сравнение в официальной документации](https://react.dev/reference/react/useCallback).
