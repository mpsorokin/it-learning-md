# Dependency boundaries and modules

## Interview questions

### Dependency boundaries.
<!-- question-id: 19-react-application-architecture-q14 -->
#### Ответ

Dependency boundary ограничивает, кто может знать о реализации другого модуля и в каком направлении это знание течёт. Определите стабильные public exports feature/domain, запретите импорт внутренних путей соседней feature, держите shared нейтральным и ниже по зависимостям, а application composition пусть соединяет крупные части. Для внешних API/database UI зависит от собственного port/контракта, а адаптер реализует его; не заставляйте весь проект имитировать enterprise ports, если нет сменяемой реализации/тестового seam. Границу проверяйте ESLint import rules, dependency-cruiser или аналогичной проверкой графа в CI; цикл и глубокий импорт — повод пересмотреть направление. При изменении контракта добавьте deprecation window или adapter, migration test и метрику adoption. Архитектурное правило должно объяснять конкретный риск — coupling, slow tests, leakage или owner ambiguity — иначе оно станет формальной бюрократией.

### Barrel files.
<!-- question-id: 19-react-application-architecture-q15 -->
#### Ответ

Barrel — модуль, который публично re-export-ит API других файлов. На границе feature он может дать стабильный import path и упростить рефакторинг, но индекс, экспортирующий всё подряд, прячет реальный граф зависимостей и упрощает случайный импорт внутренностей. Циклы через barrels сложнее заметить, а side effects любого транзитивного импорта могут усложнить tree-shaking; итоговый bundle зависит от bundler, package sideEffects metadata и статичности exports, поэтому нельзя считать barrel всегда бесплатным или всегда вредным. В framework с server/client границами транзитивный import также может затянуть модуль в другую среду; public entry должен сохранять эти ограничения. Используйте barrels осознанно для небольшого документированного API, избегайте реэкспорта всего feature namespace и проверяйте фактический bundle analyzer. Внутри одного feature прямые relative imports нередко яснее.

### Circular dependencies.
<!-- question-id: 19-react-application-architecture-q16 -->
#### Ответ

При цикле A импортирует B, а B импортирует A; ESM поддерживает live bindings, но модули инициализируются в порядке графа, поэтому чтение значения до его инициализации может дать undefined-подобное состояние или ReferenceError из temporal dead zone. Результат зависит от точки чтения, типа binding и преобразований bundler; это не всегда очевидный compile error. Распространённые причины — взаимные imports между features и barrel, который скрывает ребро. Исправляйте направление графа: вынесите общий контракт/тип в низкоуровневый модуль, переместите orchestration в composition root, примените dependency inversion через port или передавайте callback/данные сверху. Type-only import может убрать runtime edge в TypeScript, но только если реальная runtime зависимость также исчезла. Добавьте проверку циклов в CI и тест на public entrypoint; подавлять warning не следует, пока причина не понятна.
