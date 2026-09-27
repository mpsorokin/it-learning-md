# Images, Dockerfiles, and Builds

## Interview questions

### Image vs container.
<!-- question-id: 38-docker-q01 -->

#### Ответ

Docker image — неизменяемый шаблон: метаданные запуска плюс слои файловой системы. Container — экземпляр image с отдельными namespaces, cgroups, настройками сети и writable layer поверх read-only слоёв. Одно image можно запустить несколько раз с разными переменными, лимитами и портами; изменения в writable layer не меняют исходное image и обычно исчезают при удалении контейнера. Данные, которые должны пережить замену контейнера, нужно хранить во внешнем volume или сервисе данных. Образ идентифицируйте digest, а не только изменяемым tag. См. [Docker images](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/) и [containers](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/).

### Layers.
<!-- question-id: 38-docker-q02 -->

#### Ответ

Слои — результат файловых изменений build-инструкций, переиспользуемый между сборками и образами. Кэш инструкции зависит от самой инструкции и её входов; изменение раннего слоя обычно инвалидирует последующие. Поэтому сначала копируют lockfile и ставят зависимости, а затем копируют часто меняющийся исходный код. Слои удобны для повторного build и распространения, но не являются механизмом хранения пользовательских данных или секретов: удалённый в следующем слое файл всё ещё может находиться в предыдущем. Для секретов используйте BuildKit secret mounts, а не ARG/ENV или COPY. [Docker build cache](https://docs.docker.com/build/cache/) и [build best practices](https://docs.docker.com/build/building/best-practices/).

### Dockerfile.
<!-- question-id: 38-docker-q03 -->

#### Ответ

Dockerfile описывает воспроизводимое построение image: FROM выбирает базовый образ, RUN выполняет build-команды, COPY переносит только нужные входы, WORKDIR задаёт каталог, USER — непривилегированного пользователя, а CMD/ENTRYPOINT — runtime-команду. Я бы фиксировал версию базового образа и lockfile, исключал ненужный контекст через .dockerignore, объединял связанные операции без бессмысленного дробления и не помещал credentials в слои. Build-time параметры и runtime-конфигурацию следует разделять; приложение должно читать конфигурацию извне. Проверять нужно не только успешную сборку, но и фактический запуск с минимальными правами. См. [Dockerfile reference](https://docs.docker.com/reference/dockerfile/) и [best practices](https://docs.docker.com/build/building/best-practices/).

### Multi-stage build.
<!-- question-id: 38-docker-q04 -->

#### Ответ

Multi-stage build отделяет компилятор и dev-зависимости от runtime: первая стадия устанавливает зависимости и собирает приложение, финальная начинается с минимального runtime-образа и получает только артефакты, нужные для запуска. Это уменьшает размер и поверхность атаки, не делая исходный build-контейнер production-средой. Для Node-приложения важно скопировать runtime dependencies и dist; для Next standalone — standalone output и static assets. Учитывайте native-модули: build и runtime должны быть совместимы по ОС, libc и архитектуре. Копирование с заданным владельцем и запуск под non-root упрощают hardening. [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/).

### Build cache.
<!-- question-id: 38-docker-q05 -->

#### Ответ

Build cache ускоряет повторную сборку, когда инструкция и её входы совпадают. Кэш не гарантирует корректность при недекларированных внешних зависимостях: например, RUN apt-get update может использовать старый сохранённый слой, если build-кэш попал в hit. Обновление пакетов следует выполнять детерминированно в одной инструкции либо периодически обновлять базовый digest и пересобирать. Располагайте редко меняющиеся lockfile до COPY исходников; используйте BuildKit cache mounts для package-manager cache, если это уместно. В CI cache — ускоритель, а не источник истины: release должен быть воспроизводимым и выпускать проверенный digest. [Build cache](https://docs.docker.com/build/cache/), [cache optimization](https://docs.docker.com/build/cache/optimize/).

### .dockerignore.
<!-- question-id: 38-docker-q06 -->

#### Ответ

.dockerignore исключает файлы из build context до отправки его builder-у. Это сокращает передачу и предотвращает случайное попадание .git, локальных node_modules, результатов тестов и файлов разработчика в build или слой. В него следует включить локальные .env и приватные ключи; не полагаться на то, что секрет будет позже удалён из образа. Исключение должно быть точным: если игнорировать lockfile или нужный static asset, сборка станет некорректной. Для секретов build используйте BuildKit secret mount, а runtime secrets передавайте менеджером секретов платформы. [Docker build context](https://docs.docker.com/build/concepts/context/#dockerignore-files).

### CMD vs ENTRYPOINT.
<!-- question-id: 38-docker-q07 -->

#### Ответ

CMD задаёт команду или аргументы по умолчанию, которые можно заменить при docker run. ENTRYPOINT задаёт основной исполняемый файл; CMD часто становится его аргументами. Для серверного процесса предпочтительна exec-форма, например ENTRYPOINT ["node", "dist/main.js"]: процесс становится PID 1 и получает сигнал напрямую. Shell-форма запускает промежуточную оболочку, которая может не передать SIGTERM приложению. Если нужен wrapper, он должен корректно переслать сигналы и завершиться через exec. Проверяйте итоговую команду после Compose/Kubernetes overrides, потому что command и entrypoint могут заменять разные части. [Dockerfile CMD](https://docs.docker.com/reference/dockerfile/#cmd) и [ENTRYPOINT](https://docs.docker.com/reference/dockerfile/#entrypoint).

### Environment variables.
<!-- question-id: 38-docker-q08 -->

#### Ответ

ENV в Dockerfile попадает в конфигурацию image и становится доступной контейнеру при старте. Это подходит для несекретных defaults вроде NODE_ENV, но не для паролей, токенов и private keys: значения видны тем, кто может inspect-ить образ, и могут попасть в registry или логи сборки. Секреты передавайте через secret store или защищённый механизм платформы с минимальным scope и ротацией. Для build-time credentials используйте secret mount BuildKit. Runtime-конфигурацию валидируйте при старте, не печатайте целиком и отделяйте от build, чтобы один и тот же digest продвигался между окружениями. [Docker build secrets](https://docs.docker.com/build/building/secrets/) и [Compose secrets](https://docs.docker.com/reference/compose-file/secrets/).

### Networks.
<!-- question-id: 38-docker-q09 -->

#### Ответ

Сеть Docker позволяет контейнерам общаться по виртуальной сети. На user-defined bridge контейнеры в одной сети находят друг друга по service/container name через встроенный DNS; внутри сети обращаются к порту приложения, а publish вида host:container нужен только для входа с хоста или извне. Не публикуйте PostgreSQL/Redis без необходимости и разделяйте публичный edge и приватные сервисы. В production сетевые правила — лишь один слой защиты: также нужны аутентификация, TLS там, где требуется, firewall/security groups и least privilege. При пересоздании контейнера IP может измениться, поэтому клиенты должны использовать DNS-имя и уметь переподключаться. [Docker networking](https://docs.docker.com/engine/network/).
