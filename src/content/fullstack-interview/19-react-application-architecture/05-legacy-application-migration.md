# Legacy application migration

## Interview questions

### Как мигрировать legacy React application?
<!-- question-id: 19-react-application-architecture-q17 -->
#### Ответ

Сначала зафиксируйте текущий baseline и ограничения: маршруты и критичные user journeys, версии React/router/build tools, deploy/rollback path, состояние API, известные production баги, тесты и performance traces. Не начинайте с тотального rewrite: в старой системе ещё неявны edge cases и работающие бизнес-правила. Создайте карту ownership/dependency, выделите наиболее рискованные и часто изменяемые области, добавьте characterization tests вокруг наблюдаемого поведения и установите минимальный CI quality gate. Затем определите целевую границу на уровне route/feature, facade для legacy API/store и последовательный strangler plan. Каждый шаг должен быть отдельно deployable и reversible: feature flag/route switch, постепенная traffic rollout, сравнение error rate и task success, возможность быстро вернуть старую реализацию. Учитывайте миграцию данных, auth, analytics, SEO/SSR и доступность, а не только перенос JSX. Измеряйте lead time, дефекты, JS bundle, route latency, hydration и API errors; завершайте шаг, когда критерии acceptance и observability подтверждают улучшение, а не когда папки переименованы.

### Classes → hooks.
<!-- question-id: 19-react-application-architecture-q18 -->
#### Ответ

Не переводите lifecycle methods механически в один useEffect. Сначала выпишите каждое поведение class component: initial read, реагирование на конкретный prop/state, subscription, timer, imperative ref, error boundary и локальный transition. componentDidMount и componentDidUpdate могут объединиться в Effect с корректными dependencies только если они синхронизируют один внешний процесс; при смене dependency cleanup старой подписки/ресурса должен идти до нового setup. State, вычисляемый из props, часто лучше выводить в render; функциональный updater нужен для перехода от предыдущего state; сложные переходы удобно выразить reducer-ом. Instance fields, не предназначенные для render, могут перейти в ref; DOM side effects требуют отдельной проверки timing. Сохраняйте публичные props, доступность и тесты при миграции одного component за раз, чтобы rollback был локален. Error Boundary остаётся отдельным React концептом и не заменяется обычным try/catch в render. Strict Mode в development поможет найти cleanup bugs; перед удалением старой версии сравните behavior tests, telemetry и render/interaction performance.

Примеры lifecycle-to-Effect семантики и cleanup: [React useEffect](https://react.dev/reference/react/useEffect).

### Incremental migration.
<!-- question-id: 19-react-application-architecture-q19 -->
#### Ответ

Incremental migration вводит новую реализацию за стабильной границей и постепенно переводит поток пользователей/модулей, сохраняя работающий legacy path. Выберите вертикальный slice с понятным owner, API контрактом и измеримой ценностью; route facade или adapter временно изолирует старую модель. Перемещайте владение конкретным state по одному: две системы не должны параллельно считать разные копии authoritative и синхронизировать их неизвестным порядком. Для risky change включите feature flag, canary cohort, метрику rollback и проверку совместимости с текущим backend; имейте быстрый возврат на прежнюю реализацию и схему. База данных и API должны поддерживать переходный период старого и нового клиента. После успешного rollout удалите legacy adapter, тесты и зависимости — иначе временная совместимость останется постоянным second path. Следующий slice выбирают по production доказательствам и зависимости, а не по удобству переименования каталогов.

### Performance migration.
<!-- question-id: 19-react-application-architecture-q20 -->
#### Ответ

Performance migration начинается с пользовательского симптома и baseline на production-подобных данных: Web Vitals, route navigation latency, long tasks, network waterfalls, hydration и React Profiler traces. Определите бюджет и сегмент устройств/сетей, чтобы не оптимизировать самый быстрый desktop. Затем изолируйте одну доминирующую причину: лишний JS/code splitting, тяжёлый sync compute, слишком широкая подписка, частые commits, плохой pagination или медленный endpoint. Исправляйте её с минимальным набором изменений, добавляйте profiling/test reproduction, сравнивайте p50/p75/p95 и корректность после нагрузочного сценария. Memoization помогает только при стабильных inputs и доказанной стоимости, а не исправляет неверную архитектуру или мутации данных. Выкладывайте через canary/flag при риске, сравнивайте error и performance telemetry, оставляйте rollback. Не оптимизируйте по синтетическому score в ущерб функциональности/accessibility; запишите измеренный результат и неудачные гипотезы, чтобы команда не возвращала ту же регрессию.

### Testing legacy code.
<!-- question-id: 19-react-application-architecture-q21 -->
#### Ответ

Для системы без тестов первый шаг — characterization tests критичных сценариев, а не попытка сразу покрыть каждый файл unit tests. Тестируйте domain rules как чистые functions; feature UI — через пользовательские действия и наблюдаемый DOM, не внутренние state setters; network boundaries — integration tests с контролируемым API mock и проверкой loading, error, retry, race и cancellation. Добавьте несколько end-to-end smoke сценариев для login, критического route и записи данных, где важна интеграция нескольких слоёв. Зафиксируйте текущие quirks как «as-is», отличая известный баг от требуемого behavior, затем меняйте контракт отдельной задачей. При миграции тесты должны переживать рефакторинг: не привязывайте их к имени hook или числу render. Снижайте flaky тесты стабилизацией clock/network, очисткой данных и изоляцией окружения; quarantine требует owner и срока. В CI сначала защищайте критические paths и touched modules, затем расширяйте coverage. Мониторинг production дополняет, но не заменяет тесты: он обнаруживает проблему после того, как пользователь уже столкнулся.
