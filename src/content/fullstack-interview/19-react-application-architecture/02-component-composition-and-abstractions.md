# Component composition and abstractions

## Interview questions

### Smart/dumb components — актуально ли?
<!-- question-id: 19-react-application-architecture-q05 -->
#### Ответ

Термин smart/dumb больше не является обязательной структурой React приложения, но разделение ответственности остаётся полезным. Компонент-владелец может координировать запросы, route state и команды; презентационный компонент получает данные и callbacks и фокусируется на разметке, accessibility и визуальных состояниях. Custom Hooks позволяют вынести stateful logic, поэтому нет необходимости делать отдельный «container» для каждого view. Жёсткая бинарность приводит к лишним wrapper-ам, когда даже простейший компонент не может владеть локальным toggle, и не гарантирует правильные dependency boundaries. Решайте по reuse и тестируемости: форма может разумно владеть своим draft state, а чистый DataTable — быть управляемым через props. Компонент должен иметь один ясный контракт и не смешивать транспорт, business rule и presentation без необходимости.

### Composition.
<!-- question-id: 19-react-application-architecture-q06 -->
#### Ответ

Composition собирает поведение из небольших компонентов и явных slots/children вместо компонента с растущим набором взаимоисключающих flags. Она позволяет потребителю управлять содержимым, сохраняет локальную ответственность и облегчает разные layout-ы одного поведения. Например, Dialog может предоставить trigger/content slots или compound API, но должен определить, кто владеет open state: controlled value + onChange либо внутренний uncontrolled state с defaultValue, без двусмысленного смешения. Context полезен для внутренних compound children, но его scope должен быть узким, а пустое использование вне provider — обнаруживаться. Сохраняйте семантику HTML, keyboard navigation, focus management и accessible name на уровне API, а не надейтесь, что consumer всё доделает. Composition не всегда проще: сложный coordination protocol может быть яснее как один opinionated component или workflow hook. Оцените API на реальном use case и проверьте его потребителями, прежде чем делать его общим.

### Hooks as abstraction.
<!-- question-id: 19-react-application-architecture-q07 -->
#### Ответ

Custom Hook абстрагирует повторно используемое состояние и синхронизацию с React runtime, но не создаёт singleton: два вызова одного hook имеют отдельные state/effects, если явно не читают общий Context/store/cache. Назовите и спроектируйте hook по capability/use case, передавайте меняющиеся входы параметрами, возвращайте небольшой устойчивый набор data/actions/status и документируйте cleanup и ошибки. Hook не должен прятать важную сетевую или навигационную политику за универсальными опциями. Обычные Hooks должны вызываться на верхнем уровне компонента/custom Hook и в одинаковом порядке; цикл/условие превращает соответствующие state slots в неверные. В React 19.2.8 это базовое правило сохраняется; экспериментировать с новыми API без версии проекта нельзя. Тестируйте hook через наблюдаемое поведение компонента, а reusable чистое правило — обычным unit test. Не извлекайте хук только ради уменьшения строки компонента, если новое API хуже читается.

Официальное ограничение и rationale: [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks).

### Component API design.
<!-- question-id: 19-react-application-architecture-q08 -->
#### Ответ

Хороший component API выражает допустимые состояния, а не просто набор HTML-like props. Для изменяемого value выберите controlled contract value/onChange либо uncontrolled defaultValue; определите синхронное поведение, reset, disabled/loading, error, callback ordering и кто владеет состоянием. Для взаимоисключающих вариантов используйте явные discriminated unions вместо нескольких boolean, которые допускают невозможные комбинации. Composition/slots подходят, если потребителю нужно менять внутреннее содержимое; единый компонент проще, если важны единообразие и accessibility. Не протаскивайте backend DTO и транспортные детали прямо в базовый UI primitive; feature adapter может преобразовать их в view props. Стабильность API важна для миграции: deprecate старое поле через понятный путь, не меняйте semantics незаметно, добавьте tests и usage examples. Балансируйте гибкость, bundle/runtime стоимость и понятность: универсальный компонент на 40 props не обязательно более переиспользуемый.
