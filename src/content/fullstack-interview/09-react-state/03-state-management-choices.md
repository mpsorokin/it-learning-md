# State management choices

## Interview questions

### Когда использовать useReducer?
<!-- question-id: 09-react-state-q14 -->
#### Ответ

`useReducer` удобен, когда изменения образуют набор связанных переходов состояния: форма с validation/submission, сложный editor, workflow или transitions, где важны пред- и пост-условия. Reducer принимает текущее состояние и action и возвращает новое; reducer должен быть pure, а сеть/таймеры выполняют снаружи — например, в event handler или effect. Action описывает намерение (`fieldChanged`, `submitted`), что упрощает тесты и аудит.

Reducer не является автоматической оптимизацией и сам по себе не делает state глобальным. Для дорогого initial state есть lazy initializer `useReducer(reducer, initialArg, init)`. `dispatch` стабилен по identity. Когда переходы просты и независимы, несколько `useState` читаются легче.

### useReducer vs multiple useState.
<!-- question-id: 09-react-state-q15 -->
#### Ответ

Несколько `useState` хорошо подходят независимым значениям с простыми обновлениями: например, `isOpen` и строке фильтра. Их локальные setters коротки, и компонент не обязан создавать action/reducer boilerplate. Связанные поля при этом могут обновиться отдельными вызовами и требуют внимательности к инвариантам.

`useReducer` собирает логику transition в одном pure месте, удобен для состояний, которые меняются несколькими согласованными полями и множеством действий. Он облегчает unit-тестирование reducer-а и представление state machine, но reducer с огромным switch или action-ом на каждое присваивание может стать лишней абстракцией.

Выбирайте по сложности переходов и связности данных, а не по количеству полей. Можно комбинировать: reducer для доменного editor state и отдельный `useState` для локального раскрытия панели.

### Local vs global state.
<!-- question-id: 09-react-state-q16 -->
#### Ответ

Local state принадлежит компоненту/ближайшей ветке и уместен для ephemeral UI: открыт ли dropdown, текущий draft, hover, временный selection. Он естественно сбрасывается вместе с owner-ом, ограничивает область влияния и часто сохраняет ясный поток props.

Shared/global client state нужен, когда множество несоседних частей интерфейса действительно читают или изменяют одно значение, оно переживает переходы по экрану либо имеет application-level lifecycle. Сначала поднимите state к минимальному общему ancestor; Context подходит для редких широких изменений, внешний store/selectors — для богатых/high-frequency подписок или интеграций. Сам Context не является кешем, router или полноценной моделью записи.

Слишком глобальный state создаёт связанность, сложный reset и широкие rerenders. URL, form state и server cache могут иметь отдельные владельцы и часто лучше оставить в соответствующих подсистемах.

### Server state vs client state.
<!-- question-id: 09-react-state-q17 -->
#### Ответ

Client state описывает локальные пользовательские намерения/интерфейс: выбранная вкладка, раскрытый фильтр, несохранённый draft. Приложение обычно является его владельцем и может менять его синхронно. Server state — удалённые данные, для которых сервер остаётся authority: у них есть latency, loading/error, freshness, refetch, invalidation, cache sharing, pagination и race/cancellation.

Наивно копировать ответ API в React state через Effect вынуждает вручную решать дублирование, повторную загрузку, гонки, stale cache и очистку; для сложных случаев query/cache library управляет этим lifecycle, а React хранит UI-состояние отдельно. React Server Components/`use` меняют способ загрузки и передачи данных в поддерживаемом фреймворке, но не превращают удалённый ресурс в обычный локальный state.

Разделяйте ответственность: например, entity данные — server cache, фильтр страницы — URL/client state, несохранённые input значения — form state. Кеширование не отменяет authorization или валидацию на сервере.
