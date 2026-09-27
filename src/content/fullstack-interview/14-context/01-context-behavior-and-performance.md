# Context behavior and performance

## Interview questions

### Как работает Context?
<!-- question-id: 14-context-q01 -->
#### Ответ

`createContext(defaultValue)` создаёт объект-канал с типом данных и fallback значением, но сам по себе не хранит состояние. Provider помещает `value` в React tree; `useContext(Context)` в потомке находит ближайший Provider выше себя и подписывает компонент на это значение. Если Provider нет, возвращается `defaultValue`; переданный `undefined` — не то же, что отсутствие Provider.

Когда `value` отличается от прежнего по `Object.is`, React обновляет consumers этого Context. Контекст проходит сквозь произвольное число компонентов и через Portal, потому что его топология — React tree. У Provider в одном render значение читается только теми компонентами, которые ниже Provider: если компонент сам возвращает Provider, его собственный `useContext` увидит более верхнего Provider.

В React 19.2.8 можно использовать `<ThemeContext.Provider value={theme}>` (совместимый явный синтаксис) или React 19 shorthand `<ThemeContext value={theme}>`; это не внешний store и не API выбора поля. [Официальная модель `useContext`](https://react.dev/reference/react/useContext).

### Что вызывает rerender consumer?
<!-- question-id: 14-context-q02 -->
#### Ответ

Consumer подписан на **весь value** конкретного Context. Он обновится, если ближайший Provider передаст новое значение по `Object.is`, даже когда компонент обёрнут в `memo` и props не менялись. Например, `value={{ user, setUser }}` создаёт новую object-ссылку при каждом render Provider, поэтому вызванный изменением unrelated state Provider рассылает context update всем consumers. При этом поля `user` могли остаться теми же.

Обычный render компонента выше consumer также может привести к стандартному reconciliation дерева; это отличается от context update. Если Provider передаёт идентичную ссылку, Context не стал источником update, хотя другие источники могут вызвать render. Собственный state consumer, новые props, смена `key`/remount также работают независимо от Context. Development Strict Mode может повторять вызовы render.

Для устранения фиктивных updates мемоизируйте Provider value относительно реальных полей или создавайте его в месте с подходящим жизненным циклом. Если меняется один из полей value, все consumers этого Context всё равно подписаны на whole value — разделите Context или используйте store selector, если это измеренный bottleneck. [Сравнение `Object.is` и `memo`](https://react.dev/reference/react/useContext).

### Context vs Redux/Zustand.
<!-- question-id: 14-context-q03 -->
#### Ответ

Это инструменты разных уровней. Context — React-механизм для доставки значения через дерево и подписки компонентов на изменение этого значения; он не определяет reducers, selectors, middleware, persistence, devtools или бизнес-правила. Redux/Zustand и другие state libraries являются моделями внешнего store с собственным API: обычно они добавляют централизованное состояние и более точную подписку/selection, но конкретные гарантии зависят от библиотеки, адаптера и версии.

Context хорошо подходит для редко/умеренно меняющихся cross-cutting dependencies: theme, locale, feature flags, текущая сессия или сервис. Один большой Context с быстро меняющимся state может обновлять много consumers при каждом изменении; отделение state и actions помогает, но native `useContext` не выбирает отдельные поля. Store selector может ограничивать render компонентами, чья выбранная проекция изменилась, однако добавляет API, devtools и debugging model, которые нужно поддерживать.

Не выбирайте Redux/Zustand только потому, что «Context медленный», и не стройте универсальный store из Context без необходимости. Сопоставьте частоту/объём обновлений, количество потребителей, требования к селекторам, SSR/hydration, persistence, тестированию и командному tooling. [Обязанности Context и consumers](https://react.dev/reference/react/useContext); поведение внешнего store для React-интеграции описано в [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore).

### Почему большой Context может быть performance problem?
<!-- question-id: 14-context-q04 -->
#### Ответ

Проблема не в размере объекта в байтах, а в области подписки и частоте изменений. Если один `AppContext` содержит session, cart, layout, toast, фильтры и каждую форму, update любого из этих полей требует передать новый value. Каждый consumer этого Context получает update — даже если он читает только `theme` и `theme` не менялся. В большой tree это запускает ненужную работу и может затруднить приоритизацию частых updates.

Мемоизация Provider object устраняет только фиктивную смену ссылки при неизменившихся полях. Она не селектит поля, когда изменился хотя бы один member value. Обернуть consumer в `memo` тоже недостаточно: context update проходит через memo boundary. Нельзя исправить корректность мутацией value с сохранением ссылки: тогда React может не уведомить consumers, а другие потребители увидят не согласованное состояние.

Решения по нарастающей: держать transient state рядом с UI; разделить Context по update domain/частоте; разделить часто читаемое state и стабильные actions; адаптером прочитать Context и передать выбранный primitive в memoized child; перейти на selector-based external store, если профилировщик показал, что context fan-out дорог. Измеряйте p95 interaction/render и количество обновившихся consumers, а не просто строки кода. [Как React уведомляет Context consumers](https://react.dev/reference/react/useContext).

### Splitting contexts.
<!-- question-id: 14-context-q05 -->
#### Ответ

Разделяйте Context по независимым семантическим и update boundaries, а не по каждому полю механически. Например, `ThemeContext` меняется редко, `SessionContext` при входе/выходе, `CartContext` может изменяться при каждой операции, а dispatch/actions почти всегда стабильны. Тогда компонент, читающий только theme, не подписывается на изменения корзины.

Полезный шаблон — отдельные contexts для состояния и действий: `StateContext` несёт изменяющееся значение, `ActionsContext` — стабильные функции/dispatch. `useReducer` даёт стабильный `dispatch`; wrapper object с action methods можно создать один раз/мемоизировать. Не включайте в state-context новый function или object, не относящийся к нему: это изменит identity value. Если consumer читает два contexts, он обновится при изменении любого из них.

Гранулярность — trade-off: слишком много provider компонентов повышают setup/тестовую сложность; слишком мало повышает число лишних subscriptions. Используйте композиционный provider на уровне route/domain, тестируйте consumers изолированно, сохраняйте читаемые custom hooks. Context splitting не заменяет selector API для сильно granular store. [Context values и `Object.is`](https://react.dev/reference/react/useContext).

### Context selectors.
<!-- question-id: 14-context-q06 -->
#### Ответ

Встроенный `useContext(Context)` подписывает компонент на весь Context value: у него нет аргумента-селектора вида `useContext(Ctx, state => state.user)`. Поэтому при изменении любой части переданного object все consumers именно этого Context обновляются, даже если их интересующая часть выглядит прежней.

Практические варианты: (1) разделить независимые данные по разным Context; (2) сделать тонкий Context consumer, выбрать primitive/объект нужной проекции и передать его в memoized компонент; (3) для большого частого state подключить external store с selector subscription. В случае внешнего store используйте React integration через `useSyncExternalStore` либо библиотечную интеграцию; нельзя просто читать mutable global variable из render и вручную подписываться в Effect, не решив гонку между render и subscription.

Проверяйте семантику equality selector результата и иммутабельность snapshot: новая ссылка на каждый вызов вызывает лишний render, а мутация со старой ссылкой скрывает update. Selector architecture полезна, когда профиль подтверждает context fan-out, но добавляет сравнения и store complexity. [API `useContext`](https://react.dev/reference/react/useContext), [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore).

### Context и React.memo.
<!-- question-id: 14-context-q07 -->
#### Ответ

`React.memo` сравнивает props, переданные от родителя; Context создаёт отдельную dependency. Если memoized компонент вызывает `useContext` и Provider value изменился, React обновляет его с новым value. Иначе memo случайно скрывал бы данные, которые компонент объявил необходимыми. Если Context value стабилен, а props не менялись, memo может отфильтровать обычный родительский render.

Если компонент нужен только чтобы выбрать часть контекста, вынесите Context-read в лёгкий wrapper:

```ts
const ThemeLabel = memo(function ThemeLabel({ theme }: { theme: string }) {
  return <span className={theme}>Current theme: {theme}</span>;
});

function ThemeLabelFromContext() {
  const theme = useContext(ThemeContext);
  return <ThemeLabel theme={theme} />;
}
```

Wrapper обновится при любом релевантном изменении theme value; дорогой `ThemeLabel` получит только узкий prop и пропустит update, если его значение равное. Это помогает только при действительно узком selector; передача всего объекта обратно в child устраняет эффект. [Официальный разбор `memo` + Context](https://react.dev/reference/react/memo).

### Context и Portal.
<!-- question-id: 14-context-q08 -->
#### Ответ

Portal меняет физическое место DOM-узла, но React-дерево оставляет дочерним того компонента, который вызвал `createPortal`. Поэтому Context-provider выше вызывающей ветки доступен portal-контенту; Provider, который DOM-wise находится «рядом» в другом месте, не становится ближайшим автоматически. Выбор значения определяется ancestry в React tree.

Это удобно для modal, tooltip и overlay: портал можно направить в `document.body`, чтобы уйти от `overflow: hidden` или локального stacking context, сохранив state и context application. Однако порядок React-событий и контекст дерева не равны DOM-родству; portal click будет всплывать по React tree. [Семантика `createPortal`](https://react.dev/reference/react-dom/createPortal).

### Если component находится DOM-wise вне parent через Portal — получает ли Context?
<!-- question-id: 14-context-q09 -->
#### Ответ

Да, если этот component в **React tree** является потомком соответствующего Provider. `createPortal(children, domNode)` переносит созданные DOM-узлы в заданный контейнер, но оставляет `children` на прежнем месте в React-иерархии. Поэтому `useContext` в portal-child находит ближайший Provider выше React-узла, а events также всплывают к React-предкам.

Термин «parent» тут нужно уточнить: DOM parent не определяет React Context. Portal, помещённый в `document.body`, всё равно может читать Context Provider из React application root; отдельный React root на DOM sibling не наследует этот Context. Модульный duplicate Context object (например, из-за дублирования пакета/симлинков) тоже нарушит совпадение provider-consumer. [Документация `createPortal`](https://react.dev/reference/react-dom/createPortal), [условия совпадения Context object](https://react.dev/reference/react/useContext).

### Сделать app-wide context, намеренно вызвать excessive rerenders и затем исправить архитектуру.
<!-- question-id: 14-context-task01 -->
#### Ответ

Если поместить `theme`, `session`, `cart`, `filters`, `actions` в один объект `AppContext` и каждый render делать `value={{...}}`, toggle любой части создаст новую ссылку и обновит каждого consumer AppContext. Это намеренный anti-pattern, который удобно показать Profiler-ом. Исправление ниже разделяет данные по области обновления и actions отдельно; actions используют функциональный updater, а их object имеет стабильную identity.

```ts
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Session = { userName: string } | null;
type SessionActions = { logOut: () => void };

const ThemeContext = createContext<"light" | "dark">("light");
const SessionContext = createContext<Session>(null);
const SessionActionsContext = createContext<SessionActions | null>(null);

function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [session, setSession] = useState<Session>({ userName: "Ada" });
  const logOut = useCallback(() => setSession(null), []);
  const actions = useMemo(() => ({ logOut }), [logOut]);

  return (
    <ThemeContext.Provider value={theme}>
      <SessionContext.Provider value={session}>
        <SessionActionsContext.Provider value={actions}>
          {children}
          <button onClick={() => setTheme((value) => value === "light" ? "dark" : "light")}>
            Toggle theme
          </button>
        </SessionActionsContext.Provider>
      </SessionContext.Provider>
    </ThemeContext.Provider>
  );
}

function Header() {
  const theme = useContext(ThemeContext);
  return <header data-theme={theme}>Application</header>;
}

function AccountBadge() {
  const session = useContext(SessionContext);
  return <span>{session?.userName ?? "Signed out"}</span>;
}

function LogOutButton() {
  const actions = useContext(SessionActionsContext);
  if (!actions) throw new Error("LogOutButton must be inside Providers");
  return <button onClick={actions.logOut}>Log out</button>;
}

export function App() {
  return (
    <Providers>
      <Header />
      <AccountBadge />
      <LogOutButton />
    </Providers>
  );
}
```

В реальной реализации вынесите `Providers` отдельно и экспортируйте custom hooks с явной ошибкой отсутствующего Provider; в примере theme setter остаётся внутри provider только ради демонстрации. Проверки: переключение theme не должно менять `SessionContext`/actions value; `AccountBadge` обновляется при logout; `LogOutButton` не обязан обновляться только из-за смены session, потому что его Context со стабильными actions прежний. Добавьте counters или `Profiler`, помня про Strict Mode double render. Если один state-context всё ещё содержит тысячи часто изменяемых элементов и многие consumers, Context splitting не даст field selector — измерьте и сравните с external store. [Уведомление Context consumers](https://react.dev/reference/react/useContext).
