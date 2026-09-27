# State and colocation

## Interview questions

### Prop drilling.
<!-- question-id: 19-react-application-architecture-q09 -->
#### Ответ

Prop drilling — это передача значения через промежуточные компоненты, которые сами его не используют. Само по себе это не дефект: явные props показывают data flow, сохраняют локальные зависимости и часто проще Context для двух-трёх уровней. Проблема появляется, когда много несвязанных слоёв постоянно меняют API из-за одного cross-cutting значения или feature сложно переиспользовать без цепочки посредников. Сначала проверьте composition: иногда можно передать уже собранный child, вместо того чтобы все промежуточные уровни знали его зависимости. Если значение действительно широко разделяется внутри стабильной области, Context/provider или подходящий store может быть яснее. Не используйте глобальный store только чтобы избавиться от пары строк props; передача entity ID часто лучше, чем дублирование целой изменяемой записи в нескольких слоях.

### Context.
<!-- question-id: 19-react-application-architecture-q10 -->
#### Ответ

Context предназначен для передачи значения через поддерево, где промежуточным компонентам не нужно его принимать вручную: theme, locale, session identity, scoped service или редко меняющиеся actions. Каждый потребитель useContext подписывается на value provider; новый object/function identity при каждом render способен обновить широкое поддерево, даже если поля выглядят прежними. Мемоизируйте value только когда это снимает измеренную работу, разделяйте state и write-only actions contexts, либо используйте store с selectors для high-frequency state. Держите provider на минимально подходящей route/feature границе и определяйте поведение вне provider. Context не добавляет cache, retries, persistence, invalidation или защиту доступа, поэтому не является заменой server-state library. Для SSR не храните пользовательский mutable Context value в глобальном singleton между запросами.

### Global store.
<!-- question-id: 19-react-application-architecture-q11 -->
#### Ответ

Глобальный client store полезен для состояния, которое действительно разделяют несколько route/feature и для которого важны централизованные переходы, selectors, undo, persistence или debugging: например, локальная очередь задач или комплексный cross-screen workflow. Сначала определите state owner и shape, избегайте второго представления server entities, если query cache уже управляет их свежестью. Селекторы должны ограничивать подписки, actions — задавать допустимые transitions, а persistence — иметь версию, миграции и правила очистки при logout. Выбирайте Redux Toolkit, Zustand или другой store по нужным гарантиям, экосистеме и командному опыту, а не по глобальной моде. Для SSR каждый пользовательский state container должен быть request-scoped, иначе возможно cross-request leakage. Миграция не должна переписывать весь store одномоментно: вводите facade и постепенно переводите владельцев состояния, наблюдая за ошибками и сохранением данных.

### Server state.
<!-- question-id: 19-react-application-architecture-q12 -->
#### Ответ

Server state изменяется вне текущего React приложения, может устареть между чтениями и часто нужен нескольким экранам. Поэтому его owner — backend, а frontend cache — replica с query key, freshness, refetch/invalidation, cancellation, retry и reconciliation semantics. Отделяйте этот cache от UI state и от unsaved form draft: каждое копирование в useState/global store требует явного правила, когда оно обновляется и кто выигрывает при конфликте. Ключ должен включать tenant/user/resource/filter scope; server всё равно обязан проверять authorization независимо от скрытия UI. Для записи используйте backend response/version и явно разрешайте concurrent update, не считая optimistic cache подтверждением. При SSR/streaming задайте границы cache на пользователя/запрос и согласуйте серверную revalidation с клиентским cache. Наблюдаемость должна различать query error, mutation conflict, отмену и обычный refetch.

### Colocation.
<!-- question-id: 19-react-application-architecture-q13 -->
#### Ответ

Colocation размещает state и связанный с ним код рядом с владельцем: форма с собственным draft, feature query hook рядом с feature, тест и схема рядом с модулем. Поднимайте состояние к наименьшему общему предку только когда несколько consumers действительно синхронно его используют. Это снижает неявные зависимости и позволяет удалить feature целиком; преждевременный shared/utils или app-wide store превращает локальный контракт в долгоживущий. Colocate не означает физически класть каждый файл в одну папку: границу выбирают по ответственности и изменению. Следите за размером файла и разделяйте чистую domain logic, adapter и rendering, когда они имеют независимые причины меняться. В больших командах закрепите ownership и импортную политику, чтобы перемещение кода не нарушало public API.
