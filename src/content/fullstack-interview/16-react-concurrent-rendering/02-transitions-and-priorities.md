# Transitions and priorities

## Interview questions

### Что такое transition?
<!-- question-id: 16-react-concurrent-rendering-q06 -->
#### Ответ

Transition — помеченное как non-urgent обновление React state, для которого React может подготовить следующую версию UI в фоне, не блокируя более срочные действия. Пример: пользователь выбирает другой tab/route или вводит запрос, а тяжёлый список результатов строится по отложенному значению, пока input показывает каждый символ сразу.

Transition — про scheduling render, а не про CSS transition, сеть или debounce. Она может быть прервана новым urgent update; старая незакоммиченная версия не должна мигнуть на экране. Если работа suspends и уже есть отображённый контент, Transition помогает сохранить старый экран до готовности следующего. Она не гарантирует точное время выполнения и не устраняет стоимость самого расчёта.

API: `startTransition` для обёртывания state update или `useTransition` для pending state + функции запуска. Не помечайте обновление value текстового поля как Transition — поле обязано отражать ввод без задержки. [Transition в React](https://react.dev/reference/react/useTransition), [React 18 overview](https://react.dev/blog/2022/03/29/react-v18).

### startTransition.
<!-- question-id: 16-react-concurrent-rendering-q07 -->
#### Ответ

`startTransition(action)` — импортируемая функция, которая синхронно вызывает callback и помечает синхронно запланированные во время его выполнения state updates как Transition. Она полезна вне компонента (например, в router/data library), когда есть доступ к setter-у. В отличие от `useTransition`, standalone API не предоставляет `isPending`.

```ts
import { startTransition } from "react";

function selectTab(nextTab: string, setTab: (tab: string) => void) {
  startTransition(() => {
    setTab(nextTab);
  });
}
```

Action вызывается сразу, поэтому сетевой запрос внутри неё не становится «параллельным». В React 19.2.8 асинхронные Actions доступны, но state update после `await` следует отдельно пометить `startTransition`, чтобы он получил transition priority. `setTimeout`/callback, выполнившийся уже после synchronous action, сам собой в неё не входит. Нельзя использовать для контролируемого text input.

Результат — удобная классификация работы, не cancellation сети и не guarantee конкретного scheduler. Если разные запросы могут завершиться out of order, отдельно обеспечьте request id/abort/order semantics в data layer. [Справочник `startTransition`](https://react.dev/reference/react/startTransition).

### useTransition.
<!-- question-id: 16-react-concurrent-rendering-q08 -->
#### Ответ

`const [isPending, startTransition] = useTransition()` — Hook для запуска Transition из компонента и отображения её pending состояния. `startTransition` помечает setter-вызовы как non-urgent; `isPending` становится true, пока соответствующая transition работа не будет показана/закончена по контракту React. Используйте его, чтобы оставлять существующее содержимое и показывать локальный progress на переключаемой кнопке/tab, а не заменять весь экран спиннером.

Hook вызывается на верхнем уровне компонента; если запуск нужен вне React, применяйте standalone `startTransition`. Async Action можно await-ить, но в проектной версии 19.2.8 setter после `await` следует снова обернуть; pending не означает, что любой сетевой запрос приложения автоматически отслеживается. Text input нельзя контролировать transition update-ом.

Pending indicator должен сохранять доступную обратную связь, `aria-busy` размещайте на реально обновляемой области, а кнопку блокируйте только если это соответствует бизнес-сценарию. React может объединять несколько активных transitions; не используйте `isPending` как счётчик отдельных запросов. [API `useTransition` и ограничения](https://react.dev/reference/react/useTransition).

### useDeferredValue.
<!-- question-id: 16-react-concurrent-rendering-q09 -->
#### Ответ

`useDeferredValue(value)` возвращает версию значения, которая при urgent update может временно отставать. Родитель и контролируемый input получают новое значение сразу, а тяжёлый subtree рендерится с предыдущим deferred value; когда React может выполнить фоновую работу, subtree обновится. Это удобно, когда у вас есть prop/value, но нет setter-а, чтобы обернуть его update в `startTransition`.

`useDeferredValue` не делает network debounce и не задаёт фиксированную паузу; фоновой render стартует по scheduler и прерывается более срочными обновлениями. Он не ускоряет один долгий sync-алгоритм и не предотвращает сетевые запросы сам по себе. Дорогой child обычно должен быть обёрнут в `memo`, чтобы не пересчитываться на urgent render, где deferred prop ещё старый. Значение-object следует создавать стабильно, иначе новая ссылка вызывает фоновой update каждый render.

Полезный UX — показать, что результаты временно устарели (например, `aria-busy`/визуальную метку), но не блокировать ввод. Для серверного поиска нужны отдельно отмена/дедупликация запросов и debounce policy, если она нужна продукту. [Справочник `useDeferredValue`](https://react.dev/reference/react/useDeferredValue).

### Urgent vs non-urgent update.
<!-- question-id: 16-react-concurrent-rendering-q10 -->
#### Ответ

Urgent update напрямую отражает действие пользователя и должно показать немедленное подтверждение: controlled input, checkbox, раскрытие краткого menu или нажатая кнопка. Non-urgent update обновляет тяжёлую/производную область: фильтрацию тысяч строк, большой chart, переход контента или navigation, который может подождать, пока пользователь продолжает взаимодействовать.

Критерий — что пользователь считает непосредственной обратной связью. В search UI state текста input оставляют urgent, а выдачу строят из `useDeferredValue(query)` или transition. Если откладывать input state, caret/символы будут «отставать». Если не отложить огромный список, синхронная работа может блокировать typing; transition позволяет React прервать работу между render units, но не произвольную JS функцию.

Не всё, что «дорого», автоматически неurgent: подтверждение оплаты, сохранения или ошибки должно сразу сообщить результат, даже если крупная область обновляется позже. Сочетайте правильный приоритет с оптимизацией CPU и понятной pending/stale обратной связью. [React 18: urgent vs transition updates](https://react.dev/blog/2022/03/29/react-v18).
