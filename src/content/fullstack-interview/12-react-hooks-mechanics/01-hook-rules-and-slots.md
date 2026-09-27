# Hook rules and hook slots

## Interview questions

### Почему hooks нельзя вызывать условно?
<!-- question-id: 12-react-hooks-mechanics-q01 -->
#### Ответ

React связывает состояние не с именем локальной переменной, а с последовательностью Hook-вызовов внутри конкретного экземпляра компонента. Условный вызов сдвигает последовательность: на одном render слот №2 может принадлежать useState, а на следующем — другому Hook, после чего React связывает state/queue не с тем вызовом или обнаруживает «Rendered fewer/more hooks than expected». Поэтому useState, useEffect и custom Hooks вызываются на верхнем уровне до ранних return, в одинаковом порядке на каждом render. У React 19 есть специальный API use(), который разрешён в условии/цикле; это документированное исключение, он не делает условный useState допустимым. [Правила](https://react.dev/reference/rules/rules-of-hooks), [use API](https://react.dev/reference/react/use).

### Почему порядок hooks важен?
<!-- question-id: 12-react-hooks-mechanics-q02 -->
#### Ответ

Стабильный порядок позволяет сопоставить вызов Hook с его slot в состоянии Fiber между render-ами. В текущей реализации React хранит Hook-структуры для текущей и work-in-progress версии Fiber и обходит их в порядке вызовов; это implementation detail, а не API, на который следует писать приложение. Условие/цикл/ранний return меняют длину или соответствие списка, поэтому React теряет сопоставление. Custom Hook не получает отдельный «контейнер слотов»: его Hook-вызовы входят в упорядоченную последовательность вызывающего компонента. Keys определяют идентичность экземпляра компонента в дереве, а порядок Hook-вызовов — слот внутри этого экземпляра.

### Как React понимает, какому useState принадлежит значение?
<!-- question-id: 12-react-hooks-mechanics-q03 -->
#### Ответ

React знает связь по порядковому месту вызова во время render данного компонента, а не по имени переменной или стек-трейсу. Упрощённо: первый useState читает первый state Hook на Fiber, второй — следующий; setter замыкает очередь обновлений именно этого slot. Каждый экземпляр компонента имеет собственную цепочку/список Hook-данных; два одинаковых вызова Counter получают разные state, а стабильный key позволяет сохранить данные того же экземпляра при reorder. Реальная реализация сложнее простого глобального массива: она учитывает concurrent render, очередь/lane обновлений, batching и повторный render. Эти internals могут меняться, поэтому приложение полагается на Rules of Hooks, а не на конкретную структуру Fiber.

### Rules of Hooks.
<!-- question-id: 12-react-hooks-mechanics-q04 -->
#### Ответ

Базовые Rules of Hooks: вызывайте обычные Hooks только на верхнем уровне function component или custom Hook, в одинаковом порядке; не вызывайте условно, в циклах, после условного return, в event handlers, обычных helper-функциях или callback-е useEffect/useMemo. Custom Hook — функция с именем use..., которая может вызывать другие Hooks, но сама также вызывается на верхнем уровне. Не вызывайте component function напрямую как обычную функцию: рендерите компонент JSX, чтобы React владел его идентичностью и слотами. Исключение в React 19 — API use(context/promise): его разрешено вызывать условно и в циклах, но внутри компонента/Hook и вне try/catch; он не отменяет правила для useState/useEffect. См. [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks).

### Реализовать очень упрощённый useState самому, чтобы понять механизм hook slots.
<!-- question-id: 12-react-hooks-mechanics-task01 -->
#### Ответ

Ниже — педагогическая модель для одного компонента: cursor сбрасывается перед render, а каждый вызов useStateDemo занимает следующий слот. Setter хранит индекс, применяет updater к текущему slot и запускает упрощённый повторный render:

```ts
type StateAction<S> = S | ((previous: S) => S);
type Dispatch<S> = (action: StateAction<S>) => void;

const slots: unknown[] = [];
const setters = new Map<number, (action: unknown) => void>();
let cursor = 0;
let currentComponent: (() => unknown) | null = null;
let lastOutput: unknown;

function renderForDemo(component: () => unknown): unknown {
  currentComponent = component;
  cursor = 0;
  lastOutput = component();
  return lastOutput;
}

function useStateDemo<S>(initial: S | (() => S)): [S, Dispatch<S>] {
  const slot = cursor++;
  if (!Object.hasOwn(slots, slot)) {
    slots[slot] =
      typeof initial === "function" ? (initial as () => S)() : initial;
  }

  let setter = setters.get(slot);
  if (!setter) {
    setter = action => {
      const previous = slots[slot] as S;
      slots[slot] =
        typeof action === "function"
          ? (action as (value: S) => S)(previous)
          : action as S;
      if (currentComponent) renderForDemo(currentComponent);
    };
    setters.set(slot, setter);
  }

  return [slots[slot] as S, setter as Dispatch<S>];
}
```

Это не React-совместимая реализация: состояние глобальное, поддерживается только один плоский component render, нет update queue/batching, render phase validation, concurrent/aborted renders, effects, context или reset по component key; и setter синхронно перерисовывает демо. Для function value initial передают lazy wrapper, иначе она будет воспринята как initializer. Пример показывает только идею стабильного порядка slot-ов; реальные React internals не следует воспроизводить в приложении.
