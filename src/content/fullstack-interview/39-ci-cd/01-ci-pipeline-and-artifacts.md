# CI Pipeline and Artifacts

## Interview questions

### Что происходит после push?
<!-- question-id: 39-ci-cd-q01 -->

#### Ответ

После push Git hosting принимает commit и создаёт события: например, pull_request, push в main или release tag. Workflow matcher выбирает pipeline; runner получает revision, checkout-ит код, устанавливает зависимости по lockfile и выполняет проверки с заданными permissions. Результаты, логи, статусы и артефакты привязываются к конкретному commit/run. Проверки PR не должны иметь доступ к production credentials, особенно если запускаются для fork. После merge релизный pipeline собирает неизменяемый артефакт, публикует его и передаёт deploy системе. Конкретная последовательность зависит от workflow-конфигурации, а не от самого факта push. [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

### CI.
<!-- question-id: 39-ci-cd-q02 -->

#### Ответ

Continuous Integration — частое объединение изменений с автоматическими проверками, чтобы быстро обнаруживать несовместимость и поддерживать main в собираемом состоянии. Для PR это обычно lint/typecheck/unit tests/build, а рискованные изменения дополняются contract, integration и security checks. CI должен запускаться воспроизводимо на commit, давать понятный failure signal и не маскировать flaky-тесты бесконечными retries. Он не доказывает отсутствие дефектов: нужна стратегия тестов, production observability и review. Инкрементальные проверки ускоряют feedback, но критические проверки нельзя пропускать только потому, что изменился «документ» без надёжного анализа зависимостей.

### CD.
<!-- question-id: 39-ci-cd-q03 -->

#### Ответ

Continuous Delivery означает, что изменение после автоматических проверок готово к выпуску и может быть развернуто контролируемым решением; Continuous Deployment автоматически выпускает каждое прошедшее изменение в production. Это разные уровни автоматизации и управления риском. В обоих случаях важны артефакт, привязанный к revision, безопасные миграции, health signals, gradual rollout и rollback/roll-forward. Ручной approval не должен заменять тесты и не делает deployment автоматически безопасным. Для регулируемой среды delivery может включать аудируемое разрешение и segregation of duties.

### GitHub Actions.
<!-- question-id: 39-ci-cd-q04 -->

#### Ответ

GitHub Actions — workflow engine, где YAML-файлы задают события, jobs, steps, dependencies, environment и permissions. Job выполняется на runner; step запускает команду или action. Артефакты позволяют передать файл между job/run, cache ускоряет получение повторно используемых зависимостей. Secrets и environments дают механизмы для чувствительной конфигурации и approval, но их безопасность зависит от scope, permissions и доверия к workflow. Для каждой используемой сторонней action проверяйте исходный код/владельца и в production pin-ьте commit SHA; permissions задавайте минимальными. [Workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [secure use](https://docs.github.com/en/actions/reference/security/secure-use).

### Runner.
<!-- question-id: 39-ci-cd-q05 -->

#### Ответ

Runner — агент, который получает job и исполняет его на hosted или self-hosted машине. Hosted runner проще изолировать и обслуживать; self-hosted позволяет использовать private network и специализированное железо, но runner может сохранить вредоносный процесс или данные между недоверенными jobs. Для fork PR не выдавайте self-hosted runner и secrets. Разделяйте trust zones, ограничивайте сетевой доступ, обновляйте runner и очищайте ephemeral рабочее окружение. Учитывайте конкуренцию по ресурсам, очереди и доступность runner pool как часть времени CI. [GitHub-hosted runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners) и [self-hosted runner security](https://docs.github.com/en/actions/reference/security/secure-use#hardening-for-self-hosted-runners).

### Build/test/lint.
<!-- question-id: 39-ci-cd-q06 -->

#### Ответ

Lint ловит стилистические и часть статических ошибок; typecheck — ошибки модели типов; tests проверяют поведение; build подтверждает, что приложение и его зависимости реально собираются. Это разные сигналы, поэтому один не заменяет остальные. На PR я запускаю быстрый обязательный набор и параллелю независимые jobs; более медленные интеграционные, e2e и security проверки добавляю по риск-профилю. Важны стабильное окружение, отчёты о тестах и понятные логи. Кэш снижает время, но при его повреждении job должна корректно восстановиться. Flaky-тест расследуется, а не превращается в постоянно разрешаемое исключение.

### Artifact.
<!-- question-id: 39-ci-cd-q07 -->

#### Ответ

Artifact — неизменяемый результат конкретного запуска: например, собранный бинарный пакет, frontend bundle или контейнерный image. Его можно передать следующим jobs и развернуть в нескольких средах, не пересобирая. Cache — временный оптимизационный набор (например, npm cache), который можно удалить и восстановить заново; он не должен быть источником release. Для прослеживаемости храните commit SHA, build provenance и digest, а deployment продвигайте именно этот результат. Ограничивайте доступ и срок хранения: артефакт может содержать исходные карты, дампы или другие чувствительные данные. [Workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts) и [dependency caching](https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching).

### Docker registry.
<!-- question-id: 39-ci-cd-q08 -->

#### Ответ

Container registry хранит версии образов и позволяет runner-у загрузить их при deployment. Публикуйте tag с commit SHA для удобства человека, но для точной идентичности и защиты от перемещения tag используйте digest. Делайте push после проверок, ограничьте права на публикацию, сканируйте image и храните retention policy. Не передавайте секреты через build args и не включайте их в слой. Release pipeline должен связать digest с исходным commit и тестовыми результатами, а deployment использовать тот же digest; отдельная пересборка на окружении разрушает эту связь. Для приватного registry нужны scoped credentials либо короткоживущая федерация.
