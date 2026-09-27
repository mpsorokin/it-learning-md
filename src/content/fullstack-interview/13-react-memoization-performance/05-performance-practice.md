# Memoization performance practice

## Interview questions

### профилирование списка;
<!-- question-id: 13-react-memoization-performance-task01 -->
#### Ответ

В условии нет исходного списка, размера данных или сценария, поэтому точный bottleneck без кода определить нельзя. Рабочий senior-процесс: воспроизвести конкретное действие, отделить React render от layout/paint, найти дорогую ветку, сформулировать гипотезу и измерить baseline. React DevTools Profiler показывает component renders/commits; browser Performance trace показывает scripting, style, layout, paint и input delay. Dev build с Strict Mode может вызывать render повторно и содержит дополнительные проверки; сравнивайте одинаковый production-сценарий, а для программного `<Profiler>` в production включайте специальную profiling build.

Минимальный profiling harness для списка:

```ts
import { Profiler, useState, type ProfilerOnRenderCallback } from "react";

type Row = { id: number; label: string };
const rows: Row[] = Array.from({ length: 2_000 }, (_, id) => ({
  id,
  label: `Record ${id}`,
}));

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
) => {
  console.table({ id, phase, actualDuration, baseDuration });
};

function List({ items }: { items: Row[] }) {
  return <ul>{items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>;
}

export function ProfileList() {
  const [unrelatedCount, setUnrelatedCount] = useState(0);
  return (
    <>
      <button onClick={() => setUnrelatedCount((n) => n + 1)}>
        Unrelated update: {unrelatedCount}
      </button>
      <Profiler id="catalog-list" onRender={onRender}>
        <List items={rows} />
      </Profiler>
    </>
  );
}
```

Профилируйте initial mount отдельно от обновлений; включите нужное число строк, тот же device/CPU throttle, тот же scroll/filter interaction и одинаковый cache state. Затем проверьте, занимает ли время React reconciliation/компоненты или браузерная отрисовка; число строк 2 000 само по себе ещё не доказывает, что нужен virtualization. Проверочные сценарии: unrelated state должен быть контрольной точкой; изменение фильтра должно пересчитать/показать новый набор; первый render не сравнивают с update. Если commit React быстрый, а frame всё ещё дорогой, `memo` не устранит paint/layout bottleneck. [Profiler callback и значения `actualDuration`/`baseDuration`](https://react.dev/reference/react/Profiler).

### убрать unnecessary renders;
<!-- question-id: 13-react-memoization-performance-task02 -->
#### Ответ

Без исходного компонента нельзя назвать конкретный лишний render; ниже — самостоятельный пример: открытие help-панели перерисовывает родителя, но не должно повторно фильтровать и строить неизменившийся product grid. Статические исходные данные лежат вне render, а дорогая ветка получает узкие props и memoized boundary.

```ts
import { memo, useState } from "react";

type Product = { id: string; name: string; price: number };
const products: Product[] = [
  { id: "a", name: "Keyboard", price: 80 },
  { id: "b", name: "Monitor", price: 300 },
  { id: "c", name: "Mouse", price: 25 },
];

const ProductGrid = memo(function ProductGrid({
  items,
  query,
}: {
  items: Product[];
  query: string;
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = items.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
  return (
    <ul>
      {visible.map((item) => (
        <li key={item.id}>{item.name}: ${item.price}</li>
      ))}
    </ul>
  );
});

export function Catalog() {
  const [query, setQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <>
      <label>
        Search <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <button onClick={() => setHelpOpen((open) => !open)}>Toggle help</button>
      {helpOpen && <aside>Catalog help</aside>}
      <ProductGrid items={products} query={query} />
    </>
  );
}
```

Проверка: при toggle help `Catalog` обновится, но `ProductGrid` получит те же ссылку `products` и строку `query`, поэтому сможет пропустить render; ввод в поле меняет `query`, и grid обязан обновиться. Если `products` создаётся как `items.map(...)` внутри Catalog, граница снова сломается — сначала исправьте место создания данных/модель. В большом коде дополнительно проверьте Context, local state и Effect-цепочки; `memo` не блокирует их. Сравните Profiler до/после: если grid и так занимает доли миллисекунды, дополнительную мемоизацию можно не оставлять.

### найти useless useMemo;
<!-- question-id: 13-react-memoization-performance-task03 -->
#### Ответ

Типичный бесполезный случай — дешёвое склеивание двух строк, результат которого нужен только текущему render:

```ts
import { useMemo } from "react";

function UserName({ first, last }: { first: string; last: string }) {
  const fullName = useMemo(() => `${first} ${last}`, [first, last]);
  return <span>{fullName}</span>;
}
```

Исправление проще и обычно дешевле: `const fullName = `${first} ${last}`;`. Здесь нет дорогого вычисления, value не передаётся memoized child и его identity не влияет на Effect/API. Hook хранит dependencies/result, сверяет их и усложняет чтение, не ускоряя заметно render.

Не удаляйте `useMemo` только по названию. Он может быть оправдан для дорогой сортировки/фильтрации, стабильного object prop для memoized child или identity-sensitive Effect dependency, если профиль подтвердил выигрыш. Для поиска useless cases проверьте: сколько занимает calculation; меняются ли dependencies; нужен ли referential stability downstream; не упрощается ли это переносом object/function внутрь Effect; есть ли реальное снижение `actualDuration`/input latency. Тест после удаления: props, UI и side effects должны оставаться корректными; state не должен зависеть от сохранения memo cache.

### найти useless useCallback;
<!-- question-id: 13-react-memoization-performance-task04 -->
#### Ответ

Типичный лишний `useCallback` — handler для обычного DOM-кнопки, где никто не сравнивает identity функции и функция не является dependency другого Hook:

```ts
import { useCallback, useState } from "react";

function PanelToggle() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  return <button onClick={toggle}>{open ? "Hide" : "Show"}</button>;
}
```

Удалите Hook: `onClick={() => setOpen(value => !value)}` или обычная локальная `toggle` здесь эквивалентны для получателя; DOM event handler не делает React shallow comparison callback prop. Functional updater сохраняет корректность при повторных событиях и не читает устаревший `open`.

Ищите `useCallback` по месту использования, а не только по отсутствию dependencies: он оправдан для callback prop memoized child, для зависимости другого Hook или для стабильного API custom Hook, если profiling/контракт этого требуют. Проверяйте, нет ли одной изменчивой dependency, например inline object; все прочитанные state/props должны быть зависимостями, иначе легко оставить stale closure. После удаления проверьте действие кнопки, rapid clicks и профиль родительского render. [Ограничения и полезные сценарии `useCallback`](https://react.dev/reference/react/useCallback).

### сравнить оптимизированную и неоптимизированную версии.
<!-- question-id: 13-react-memoization-performance-task05 -->
#### Ответ

Чтобы сравнение было честным, зафиксируйте одинаковые данные/сценарии, включите одну оптимизацию за раз и измеряйте mount отдельно от обновления. Этот пример сравнивает обычный список с `memo`-версией при обновлении только счётчика родителя:

```ts
import { memo, Profiler, useState, type ProfilerOnRenderCallback } from "react";

type Row = { id: number; label: string };
function makeRows(): Row[] {
  return Array.from({ length: 1_000 }, (_, id) => ({ id, label: `Row ${id}` }));
}

function PlainList({ rows }: { rows: Row[] }) {
  return <ul>{rows.map((row) => <li key={row.id}>{row.label}</li>)}</ul>;
}
const MemoList = memo(PlainList);

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  console.log({ id, phase, actualDuration, baseDuration });
};

export function Comparison() {
  const [rows] = useState(makeRows);
  const [count, setCount] = useState(0);
  const [optimized, setOptimized] = useState(false);
  const List = optimized ? MemoList : PlainList;

  return (
    <>
      <button onClick={() => setCount((n) => n + 1)}>Parent update: {count}</button>
      <button onClick={() => setOptimized((value) => !value)}>
        Mode: {optimized ? "memo" : "plain"}
      </button>
      <Profiler id={optimized ? "memo-list" : "plain-list"} onRender={onRender}>
        <List rows={rows} />
      </Profiler>
    </>
  );
}
```

После mount нажимайте `Parent update` несколько раз в каждом режиме; данные имеют стабильную ссылку, поэтому PlainList рендерится повторно, а MemoList может выполнить bailout. Затем отдельно измените rows, чтобы проверить обязательный путь обновления. Усредните достаточно повторов, используйте тот же браузер/устройство, не сравнивайте dev Strict Mode с production. React Profiler добавляет overhead; для production нужна profiling build. Сверьте `actualDuration` с `baseDuration`, а браузерным Performance trace — paint/layout и responsiveness. Оптимизация считается полезной только если пользовательская latency/ресурсы улучшились без stale UI; меньше render calls само по себе не цель. [React Profiler](https://react.dev/reference/react/Profiler), [условия эффективности `memo`](https://react.dev/reference/react/memo).
