# Tearing and external stores

## Interview questions

### Что такое tearing?
<!-- question-id: 16-react-concurrent-rendering-q11 -->
#### Ответ

Tearing — неконсистентный экран, в котором разные части UI отрисованы по разным версиям одного внешнего изменяемого состояния. Например, concurrent render начал читать внешний store с version A, store синхронно обновился до B, часть компонентов уже увидела B, а другая закоммитила вычисление по A. Пользователь может увидеть комбинацию, которая никогда не существовала как целостное состояние.

React state и Context обновляются в рамках React scheduling model; произвольная mutable global/store может измениться вне него в любой момент. Поэтому прямое чтение глобального значения в render плюс ручная подписка `useEffect` не гарантируют snapshot consistency. Это не просто лишний render, а нарушение целостности UI/data.

Для external store используйте `useSyncExternalStore` или интеграцию библиотеки, построенную на нём: React считывает snapshot и проверяет его перед commit; если store успел измениться во время transition render, React перезапускает обновление blocking, чтобы закоммитить единую версию. Snapshot должен быть immutable/cached. [React API для внешнего store](https://react.dev/reference/react/useSyncExternalStore).

### Почему external stores могут иметь tearing?
<!-- question-id: 16-react-concurrent-rendering-q12 -->
#### Ответ

В отличие от React-managed state, внешний store может мутировать и рассылать уведомления независимо от текущей render попытки React. При concurrent rendering React способен приостановить дерево между компонентами; если store поменялся за это время, ранние компоненты прочитали старый snapshot, поздние — новый. Наивный pattern `useEffect(() => store.subscribe(forceUpdate), [])` также имеет окно между render и effect-subscribe: изменение в нём может быть пропущено до следующей мутации.

Неправильно возвращать свежий object snapshot на каждый вызов: сравнение `Object.is` решит, что store менялся постоянно, и может возникнуть цикл render. Неправильно возвращать прежний object при мутации его внутренних полей: изменение не будет заметно React и snapshot уже не является immutable.

External-store API должен предоставлять `subscribe`/unsubscribe и `getSnapshot`, которые возвращает тот же snapshot пока данные логически не изменились. Для server rendering/hydration нужен согласованный `getServerSnapshot`. `useSyncExternalStore` координирует проверку snapshot с commit и может понизить concurrency update до blocking, когда требуется консистентность. [Caveats и snapshot rules `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore).

### useSyncExternalStore.
<!-- question-id: 16-react-concurrent-rendering-q13 -->
#### Ответ

`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)` — React Hook для чтения внешнего store с согласованной подпиской. `subscribe(callback)` регистрирует listener и возвращает unsubscribe; при изменении store он вызывает callback. `getSnapshot()` синхронно возвращает текущий immutable snapshot. React вызывает его при render и подписывается, а если новый snapshot отличается от предыдущего по `Object.is`, вызывает render.

Если store mutable, `getSnapshot` должен кешировать immutable representation до следующего реального изменения; создание нового object на каждый вызов приведёт к ложным updates, а возврат мутируемой ссылки скроет изменения. Стабильная `subscribe` функция избегает переподписок на каждый render. Для SSR/hydration `getServerSnapshot` должен совпадать с сериализованным начальным клиентским значением.

Во время Transition React может прочитать snapshot ещё раз непосредственно перед DOM commit. Если store менялся, update перезапускается как blocking, чтобы все visible consumers увидели одну версию; поэтому external-store mutation не становится non-blocking только от `startTransition`. Hook особенно нужен library adapters; обычный app state обычно проще хранить внутри React. [Официальный `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore).
