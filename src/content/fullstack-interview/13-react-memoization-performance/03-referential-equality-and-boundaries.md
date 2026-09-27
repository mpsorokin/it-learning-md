# Referential equality and memoization boundaries

## Interview questions

### Когда memoization бесполезна?
<!-- question-id: 13-react-memoization-performance-q09 -->
#### Ответ

Она бесполезна, если нет повторяющейся дорогой работы, которую можно пропустить. Типовые случаи: render дешёвый; компонент почти всегда получает действительно новые props; обновление нужно от Context/local state, а оптимизация относится только к props; результат `useMemo` нигде не использует стабильную идентичность; `useCallback` передаётся обычному компоненту, который не реагирует на identity; кэшируемое вычисление тривиально относительно overhead.

Прежде чем оптимизировать, зафиксируйте конкретный сценарий, снимите профиль и оцените частоту/время. Отсутствие render вызова не равно ускорению: compare function, dependency checks и память тоже имеют цену, а пользовательскую latency могут доминировать layout, paint, сеть или синхронный код вне React. `memo` особенно не поможет, если parent передаёт literal `config={{...}}` каждый раз.

Сначала проще уменьшить обновляемое поддерево: локализовать state, убрать лишний Effect, передавать менее изменчивые props или дать оболочке принимать `children`. Добавляйте ручную мемоизацию после измеренного узкого места и сохраняйте её только если профиль/UX улучшился. [Когда `memo` даёт эффект](https://react.dev/reference/react/memo), [когда нужен `useCallback`](https://react.dev/reference/react/useCallback).

### Когда она вредна?
<!-- question-id: 13-react-memoization-performance-q10 -->
#### Ответ

Мемоизация вредна, когда maintenance- и runtime-цена выше сэкономленной работы либо когда кешированную ссылку ошибочно используют как гарантию корректности. Примеры: сложный custom comparator с deep traversal при каждом обновлении; длинные и хрупкие dependency lists; `useCallback` с неполными dependencies и stale closure; `useMemo` вокруг дешёвых вычислений, усложняющий код; чрезмерная фиксация identities, которая мешает очевидно обновить данные.

Comparator может быть особенно опасен, если проигнорировать function prop: новая функция нередко несёт новый state/props в closure. Если comparator вернёт `true`, хотя поведение изменилось, компонент продолжит пользоваться старым обработчиком. А некорректное «всё immutable» изменение модели, где реально мутируется массив, может скрыть update.

Решение — сначала исправить модель данных, чистоту render и лишние цепочки Effect → state update; затем профилировать production-сценарий и проверить сравнение against cost render. React Compiler может изменить оптимизационный слой при отдельной конфигурации, поэтому не строите business correctness на количестве render или стабильности React-кеша. [Риски custom comparator и deep equality](https://react.dev/reference/react/memo), [кэш `useMemo` не является state](https://react.dev/reference/react/useMemo).

### Referential equality.
<!-- question-id: 13-react-memoization-performance-q11 -->
#### Ответ

Referential equality — равенство по идентичности ссылки, а не по структуре. Для object, array и function два независимо созданных значения различны: `Object.is({ a: 1 }, { a: 1 }) === false`. Для примитивов сравнение — по значению с нюансами `Object.is` (`NaN` равен самому себе, `+0` и `-0` различаются). React использует это сравнение в props `memo`, dependency arrays Hook и значениях Context.

Идентичность — часть модели обновлений: если immutable state получил новую ссылку, React может заметить изменение; если существующий объект мутировали, сохранив ту же ссылку, React может решить, что вход не изменился, и не пересчитать memoized ветку. Поэтому обновляйте данные иммутабельно и делайте structural sharing: новая ссылка для изменившихся узлов, прежние для неизменившихся.

Не пытайтесь сделать «deep equal» повсюду. Часто лучше передать минимальные примитивные props или выбрать нужные поля перед границей. `useMemo`/`useCallback` применяйте, только если consumer действительно использует стабильность identity. [Правила сравнения в `memo`](https://react.dev/reference/react/memo), [сравнение dependencies](https://react.dev/reference/react/useMemo).

### Stable reference.
<!-- question-id: 13-react-memoization-performance-q12 -->
#### Ответ

Stable reference — одно и то же значение-ссылка в последовательных render, пока изменившийся источник не требует новой. Например, функция из `useState` setter сохраняет identity; module-level constant не пересоздаётся на render; `useMemo` может вернуть прежний object, а `useCallback` — прежнюю функцию при равных dependencies.

«Стабильная ссылка» нужна не сама по себе, а как локальный контракт: memoized ребёнок может пропустить render; Effect не будет заново синхронизировать внешнюю систему из-за фиктивно новой dependency; consumer Context не получит update от прежнего value. Для value Provider, созданного inline, новый object вызовет обновление consumers даже при тех же полях.

Стабильность не должна скрывать реальное изменение: не мутируйте прежний объект; включайте все актуальные dependencies; не рассчитывайте, что React никогда не сбросит cache `useMemo`/`useCallback`. Если идентичность нужна для корректности долгоживущего изменяемого handle, чаще подходят `useRef` или state, а не оптимизационный cache. [React о стабильных значениях и memoization](https://react.dev/reference/react/useCallback).

### Memoization boundary.
<!-- question-id: 13-react-memoization-performance-q13 -->
#### Ответ

Memoization boundary — граница компонента/значения, через которую React может не пересчитывать неизменившуюся дорогую ветку. Хорошая граница соответствует самостоятельной UI-ответственности и имеет небольшой набор props, которые можно сравнить дёшево. Пример: таблица строк отделена от панели фильтров и получает immutable rows + primitive sort key; переключение панели не гоняет каждую строку, а изменение строки пересчитывает именно её.

Границу выбирают по профилю: где часто повторяется дорогое render/compute и почему. Сначала попробуйте локализовать state или извлечь ветку; затем `memo` для компонента, `useMemo` для вычисления/объекта, `useCallback` для callback — каждый решает свой уровень задачи. Стабильность одной зависимости не спасает всю ветку, если другие props каждый render новые. Если данные глубоко меняются, структурная модель и selector store могут быть лучше ручного deep compare.

Не следует строить boundary ради равномерного покрытия всей component tree: дополнительные компоненты, кэши и comparators усложняют отладку и могут ухудшить perf. Проверяйте bailout и стоимость commit на целевой нагрузке. [Как формировать memo boundary](https://react.dev/reference/react/memo).

### Почему:
<!-- question-id: 13-react-memoization-performance-q14 -->

```text
<Component config={{ foo: 1 }} />

ломает часть memoization?
```

#### Ответ

Каждый раз при выполнении JSX-выражения `config={{ foo: 1 }}` создаётся новый объект. Для `React.memo` значение prop сравнивается поверхностно по `Object.is`, поэтому ссылка изменилась, даже если единственное поле прежнее. Ребёнок увидит изменённый `config`, и bailout не сработает. Та же проблема есть у `onSave={() => save(id)}` и `[...items]`, если они создаются в render.

Предпочтительный порядок исправлений: передавайте минимальные примитивы (`foo={1}`); если объект нужен как неделимый контракт, создайте его через `useMemo` с полными dependencies; callback стабилизируйте `useCallback`, когда memoized consumer действительно выигрывает. Иногда стоит перенести формирование объекта в самого ребёнка или Effect, чтобы не создавать identity dependency вообще. Не используйте custom deep comparator как первую меру.

Проверьте в Profiler, что изменение unrelated state родителя больше не рендерит дорогую ветку, а обновление `foo` по-прежнему доходит до неё. [React: object/function props и `memo`](https://react.dev/reference/react/memo).
