# Concurrent rendering practice

## Interview questions

### expensive filtering;
<!-- question-id: 16-react-concurrent-rendering-task01 -->
#### Ответ

Практическое допущение: есть массив с миллионами/тысячами записей и повторяющийся unrelated state update, а фильтр вычисляется во время render. `useMemo` устранит повторный расчёт при неизменных `items` и query, но не ускорит сам проход при новом query. Индексирование поискового текста отделяет нормализацию данных от фильтра; если фильтрация на каждом символе блокирует input, примените `useDeferredValue` (следующая задача), virtualization или Web Worker по результатам профиля.

```ts
import { useMemo, useState } from "react";

type Item = { id: string; title: string; summary: string };

function SearchableItems({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const index = useMemo(
    () => items.map((item) => ({
      item,
      text: `${item.title} ${item.summary}`.toLocaleLowerCase(),
    })),
    [items],
  );

  const matches = useMemo(
    () => normalizedQuery
      ? index.filter((entry) => entry.text.includes(normalizedQuery)).map((entry) => entry.item)
      : items,
    [index, items, normalizedQuery],
  );

  return (
    <>
      <label>
        Search <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <p>{matches.length} results</p>
      <ul>{matches.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
    </>
  );
}
```

При изменении `items` индекс строится один раз за O(total text length) времени/памяти; каждый новый query фильтрует index за O(total indexed text scanned) и строит результат. Unrelated render с прежними ссылками пропускает оба `useMemo`. Проверки: пустой query возвращает все items; query case-insensitive; изменение items обновляет результаты; repeated unrelated update не повторяет индекс/фильтр. Не создавайте новый массив items в родителе без причины. Для огромного результата рендер списка может доминировать — memoization не заменяет virtualization/worker. [`useMemo` как кэш расчёта, не ускоритель алгоритма](https://react.dev/reference/react/useMemo).

### поиск с useDeferredValue;
<!-- question-id: 16-react-concurrent-rendering-task02 -->
#### Ответ

Ввод хранит актуальную строку синхронно, а тяжёлая выдача потребляет `deferredQuery`. Выделите её в memoized child, иначе child всё равно пересчитается при urgent render родителя, хотя deferred prop пока старый. Для реального приложения `items` должны сохранять identity между render, а фильтр/отображение следует профилировать отдельно.

```ts
import { memo, useDeferredValue, useMemo, useState } from "react";

type Item = { id: string; title: string };

const Results = memo(function Results({ items, query }: { items: Item[]; query: string }) {
  const normalized = query.trim().toLocaleLowerCase();
  const matches = useMemo(
    () => items.filter((item) => item.title.toLocaleLowerCase().includes(normalized)),
    [items, normalized],
  );
  return <ul>{matches.map((item) => <li key={item.id}>{item.title}</li>)}</ul>;
});

export function Search({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <section aria-busy={isStale}>
      <label>
        Search <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {isStale && <span role="status">Updating results…</span>}
      <Results items={items} query={deferredQuery} />
    </section>
  );
}
```

Проверки: input показывает каждую набранную букву сразу; быстрое `a` → `ab` не обязано коммитить устаревший промежуточный список; `aria-busy` отражает рассинхронизацию; новый `items` identity обновляет список. `useDeferredValue` не задаёт время ожидания и не предотвращает запросы; для удалённого поиска отдельно реализуйте отмену/дедупликацию/debounce, если это требование продукта. O(n) фильтр может всё ещё блокировать main thread внутри одного прохода — при очень больших наборах индексируйте или переносите compute в Worker. [`useDeferredValue` и `memo`](https://react.dev/reference/react/useDeferredValue).

### navigation с transition;
<!-- question-id: 16-react-concurrent-rendering-task03 -->
#### Ответ

Выбор панели — non-urgent, а контролы остаются немедленно интерактивными. Ниже настоящий Tabs pattern с `useTransition`: активная вкладка обновляется в Transition, а клавиатурная модель поддерживает ArrowLeft/ArrowRight и Home/End с автоматической активацией. Это пример локальных вкладок, не router: URL/history здесь не меняются. Если выбор должен быть навигацией, используйте ссылки с URL и `aria-current="page"` либо полноценный router; не выдавайте локальные tabs за навигацию.

```ts
import { useRef, useState, useTransition, type KeyboardEvent } from "react";

type Page = "overview" | "activity" | "settings";

export function Tabs() {
  const [page, setPage] = useState<Page>("overview");
  const [isPending, startTransition] = useTransition();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pages = ["overview", "activity", "settings"] as const;

  function navigate(nextPage: Page) {
    startTransition(() => setPage(nextPage));
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % pages.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + pages.length) % pages.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = pages.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    navigate(pages[nextIndex]);
  }

  return (
    <main aria-busy={isPending}>
      <div role="tablist" aria-label="Account sections">
        {pages.map((tab, index) => (
          <button
            key={tab}
            type="button"
            ref={(node) => { tabRefs.current[index] = node; }}
            role="tab"
            id={`tab-${tab}`}
            aria-controls={`panel-${tab}`}
            aria-selected={page === tab}
            tabIndex={page === tab ? 0 : -1}
            onClick={() => navigate(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab}
          </button>
        ))}
      </div>
      {isPending && <p role="status">Updating page…</p>}
      {pages.map((tab) => (
        <section
          key={tab}
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          hidden={page !== tab}
        >
          {tab === "overview" && <Overview />}
          {tab === "activity" && <Activity />}
          {tab === "settings" && <Settings />}
        </section>
      ))}
    </main>
  );
}
```

Проверки: Tab входит в tablist на активную вкладку и выходит из него к следующему control; ArrowLeft/ArrowRight циклически перемещают фокус и активируют панель, Home/End выбирают первую/последнюю; `aria-selected`, `aria-controls` и `aria-labelledby` всегда соответствуют видимой панели. Проверьте быстрые переключения, pending state и сохранение интерактивности. Автоматическая активация уместна, потому что панели локальные и показываются без заметной задержки; если активация станет медленной, разделите перемещение фокуса и активацию через Enter/Space. Не используйте transition для ввода поискового текста или не await-енного server mutation, статус которого нужен отдельно. [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [`useTransition`](https://react.dev/reference/react/useTransition).

### Suspense boundary architecture.
<!-- question-id: 16-react-concurrent-rendering-task04 -->
#### Ответ

Границы Suspense следует размещать по пользовательским единицам reveal, а не по каждому компоненту. Быстрые критичные части страницы (navigation, title, текущий layout) должны оставаться доступными. Медленный route body может иметь route-level fallback; независимые dashboard panels — nested boundaries с fallback соответствующей формы, чтобы одна медленная панель не заменяла весь экран. Для data suspending это требует framework/resource, интегрированного с Suspense, а для кода подходят `lazy` chunks.

```ts
import { Suspense, lazy } from "react";

const RevenuePanel = lazy(() => import("./RevenuePanel"));
const ActivityPanel = lazy(() => import("./ActivityPanel"));

export function DashboardRoute() {
  return (
    <main>
      <header>
        <h1>Dashboard</h1>
        <AccountNavigation />
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSummary />
        <div className="dashboard-grid">
          <Suspense fallback={<PanelSkeleton label="Revenue" />}>
            <RevenuePanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton label="Activity" />}>
            <ActivityPanel />
          </Suspense>
        </div>
      </Suspense>
    </main>
  );
}
```

Route boundary задаёт безопасный общий fallback; вложенные boundaries дают отдельный reveal, если они должны быть независимы. Для navigation transition можно сохранить предыдущую страницу, пока новая suspends. У fallback зарезервируйте ожидаемую геометрию, добавьте accessible status для длительной операции, а для ошибки загрузки chunk используйте Error Boundary отдельно. Проверки: быстрый/медленный panel, отказ одного chunk, повторный navigation, отменённый transition, keyboard focus и CLS между skeleton/готовым содержимым. Не создавайте фальшивый Promise в render: source должен кешировать данные. [`Suspense` boundaries](https://react.dev/reference/react/Suspense), [React streaming SSR](https://react.dev/reference/react-dom/server/renderToPipeableStream).
