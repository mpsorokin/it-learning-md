# Runtime and Production Hardening

## Interview questions

### Volumes.
<!-- question-id: 38-docker-q10 -->

#### Ответ

Named volume управляется Docker и живёт отдельно от жизненного цикла контейнера. Он подходит для состояния, например файлов PostgreSQL, но не заменяет backup, репликацию или миграцию данных. Монтирование volume в путь контейнера перекрывает содержимое этого пути из image; учитывайте владельца, права, snapshot и процедуру восстановления. Не используйте volume для раздачи исходников между production-контейнерами. В оркестраторах storage semantics задаёт платформа, поэтому надо проверять durability, zone affinity и поведение при пересоздании. [Docker volumes](https://docs.docker.com/engine/storage/volumes/).

### Bind mount.
<!-- question-id: 38-docker-q11 -->

#### Ответ

Bind mount связывает конкретный путь хоста с путём внутри контейнера. Это удобно для локальной разработки: исходники сразу видны процессу, а изменение сохраняется на хосте. В production mount может раскрыть контейнеру чувствительные host-файлы или дать возможность их изменить; read-only уменьшает риск, но не устраняет его полностью. Mount также скрывает содержимое пути из image, что иногда ломает установленные зависимости. Используйте явные узкие пути, read-only там, где запись не нужна, и не привязывайте контейнер к случайным путям машины CI. [Bind mounts](https://docs.docker.com/engine/storage/bind-mounts/).

### Healthcheck.
<!-- question-id: 38-docker-q12 -->

#### Ответ

HEALTHCHECK запускает проверку работоспособности контейнера и переводит его health status в starting, healthy или unhealthy. Это отдельный сигнал от факта существования процесса: живой PID может не обслуживать запросы. Проверка должна быть дешёвой, с разумными interval, timeout и retries, и проверять готовность принимать полезную работу, а не только локальный порт. Docker Engine сам по себе не перезапускает контейнер только из-за статуса unhealthy; restart policy реагирует на завершение процесса. Оркестратор может использовать readiness/liveness отдельно, поэтому не переносите семантику одной платформы на другую. [Docker HEALTHCHECK](https://docs.docker.com/reference/dockerfile/#healthcheck) и [health status](https://docs.docker.com/reference/cli/docker/container/health/).

### Container lifecycle.
<!-- question-id: 38-docker-q13 -->

#### Ответ

Контейнер создаётся из конфигурации image, запускает основной процесс и при его завершении останавливается; writable layer и сетевые/ресурсные параметры принадлежат конкретному экземпляру. Контейнер можно остановить, запустить, удалить и пересоздать. Restart policy помогает при неожиданном exit, но не заменяет внешний supervisor, readiness, алерты и восстановление данных. Деплой обычно создаёт новый контейнер из нового проверенного image, переключает трафик и затем удаляет старый; мигрируемое состояние должно быть вне контейнерного слоя. Важно отдельно наблюдать exit code, health, рестарты и причину OOM.

### PID 1.
<!-- question-id: 38-docker-q14 -->

#### Ответ

PID 1 внутри контейнера — главный процесс его PID namespace. У него особая семантика обработки сигналов, и он может отвечать за reap завершившихся дочерних процессов. Если PID 1 — shell или wrapper, сигналы могут не дойти до Node/Nest. Запускайте процесс в exec-форме либо используйте небольшой init, например Docker --init, если приложение порождает дочерние процессы и не reaps их само. Это не исправляет утечки процессов в приложении; проверяйте дерево процессов и shutdown в интеграционном тесте. [Docker run --init](https://docs.docker.com/reference/cli/docker/container/run/#init).

### Signals.
<!-- question-id: 38-docker-q15 -->

#### Ответ

При docker stop движок отправляет основному процессу настроенный stop signal (обычно SIGTERM), ждёт grace period, затем принудительно завершает контейнер сигналом SIGKILL. Точное время ожидания можно задать при остановке или конфигурации, поэтому приложение не должно полагаться на произвольный длинный timeout. SIGTERM — запрос завершиться; SIGKILL обработать нельзя. В Node нужно регистрировать обработчик один раз, прекратить принимать работу и закрыть ресурсы, затем завершить процесс. Убедитесь, что wrapper не перехватывает сигнал без передачи приложению. [docker container stop](https://docs.docker.com/reference/cli/docker/container/stop/).

### Graceful shutdown.
<!-- question-id: 38-docker-q16 -->

#### Ответ

Graceful shutdown — ограниченное по времени завершение без потери уже принятой работы. После SIGTERM приложение сначала перестаёт принимать новые запросы и новые WebSocket-соединения, помечает себя неготовым, завершает или отменяет текущие операции, закрывает listener, DB/Redis pools и другие соединения, flush-ит критичные буферы, затем выходит. Все шаги должны быть idempotent и ограничены deadline; после него supervisor всё равно применит SIGKILL. Нужно согласовать приложение, readiness, load balancer и платформенный termination grace period и проверить поведение при rolling deploy, зависшем запросе и повторном сигнале. Не обещайте завершить бесконечную очередь внутри короткого окна — используйте durable queue и redelivery.

### Docker Compose.
<!-- question-id: 38-docker-q17 -->

#### Ответ

Docker Compose описывает приложение из сервисов, сетей, volumes, конфигурации и зависимостей; особенно полезен для локальной разработки, тестовых окружений и небольших single-host сценариев. Сервисы по умолчанию могут общаться по service name в общей сети, данные БД сохраняются в named volume. depends_on задаёт порядок создания/старта; условие service_healthy может ждать healthcheck на старте, но это не гарантирует, что зависимость не откажет позднее и не заменяет retry в клиенте. Compose сам по себе не равен multi-node scheduler. Секреты в production следует отдавать платформе, а не хранить открытым текстом в compose-файле. [Compose services](https://docs.docker.com/reference/compose-file/services/) и [startup order](https://docs.docker.com/compose/how-tos/startup-order/).

### Production image hardening.
<!-- question-id: 38-docker-q18 -->

#### Ответ

Минимальный production image строится из проверенного base image и содержит только runtime-файлы. Я бы запускал его от непривилегированного UID, фиксировал digest базового образа, регулярно пересобирал и сканировал зависимости, удалял package manager и инструменты сборки, не добавлял секреты, ограничивал capabilities и filesystem writes на уровне платформы. Image подписывается и продвигается по digest, а не пересобирается отдельно для production. Важно не гнаться за минимальным размером ценой отсутствия нужных CA certificates, timezone или диагностики. Обновления и CVE-процесс должны иметь владельца и SLA. [Docker build best practices](https://docs.docker.com/build/building/best-practices/) и [Docker security](https://docs.docker.com/engine/security/).

### Dockerize:
<!-- question-id: 38-docker-task01 -->

Next
Nest
PostgreSQL
Redis

с production multi-stage builds.

#### Ответ

Ниже допущения: Next-приложение собирается с `output: 'standalone'`, оба Node-проекта имеют собственный lockfile, production-секреты выдаёт платформа. Два multi-stage Dockerfile повторяют принцип install/build отдельно, минимальный runtime и non-root user. Next standalone не включает `public/` и `.next/static` автоматически; копирую существующий `public/` условно, static assets — явно. Альтернатива — закрепить CDN как владельца обеих групп статических файлов. Для native npm-модулей builder/runtime должны совпадать по Node, libc и архитектуре. Базовые образы в release pipeline фиксирую digest-ом.

Сокращённые Dockerfile предполагают build context в папке приложения с lockfile; `.dockerignore` исключает `.env`, `node_modules` и `.git`.

    # apps/web/Dockerfile
    FROM node:22-alpine AS deps
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm ci
    FROM deps AS build
    COPY . .
    RUN npm run build
    # Next standalone serves public/ only when it is copied into standalone.
    RUN if [ -d public ]; then cp -r public .next/standalone/public; fi
    FROM node:22-alpine AS runtime
    ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
    WORKDIR /app
    RUN addgroup -S app && adduser -S app -G app
    COPY --from=build --chown=app:app /app/.next/standalone ./
    COPY --from=build --chown=app:app /app/.next/static ./.next/static
    USER app
    CMD ["node", "server.js"]

    # apps/api/Dockerfile
    FROM node:22-alpine AS deps
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm ci
    FROM deps AS build
    COPY . .
    RUN npm run build
    FROM node:22-alpine AS prod-deps
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm ci --omit=dev
    FROM node:22-alpine AS runtime
    ENV NODE_ENV=production
    WORKDIR /app
    RUN addgroup -S app && adduser -S app -G app
    COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
    COPY --from=build --chown=app:app /app/dist ./dist
    COPY --chown=app:app package.json ./
    USER app
    CMD ["node", "dist/main.js"]

Локальная Compose-схема: web, api, postgres и redis в приватной сети; только web публикует HTTP-порт. API использует service DNS `postgres:5432` и `redis:6379`, а не localhost. PostgreSQL получает named volume и healthcheck; приложение обрабатывает outage после старта. Redis — восстанавливаемый cache, если требования не говорят о durable queue. Секреты локально лежат в игнорируемом env-файле, production берёт их из secret manager. Миграции запускаются контролируемым шагом до переключения трафика, не при старте каждой реплики. [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/), [Compose dependencies](https://docs.docker.com/compose/how-tos/startup-order/) и [Next standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

Ключевые части локального compose.yml; production получает секреты через secret manager:

    services:
      web:
        build: ./apps/web
        ports: ["3000:3000"]
        environment:
          API_INTERNAL_URL: http://api:3001
        depends_on:
          api:
            condition: service_healthy
      api:
        build: ./apps/api
        expose: ["3001"]
        env_file: .env
        environment:
          DB_HOST: postgres
          DB_PORT: "5432"
          DB_NAME: app
          DB_USER: app
          REDIS_URL: redis://redis:6379
        depends_on:
          postgres:
            condition: service_healthy
          redis:
            condition: service_healthy
        healthcheck:
          test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
          interval: 10s
          timeout: 3s
          retries: 5
      postgres:
        image: postgres:18-alpine
        env_file: .env
        volumes: ["pgdata:/var/lib/postgresql"]
        healthcheck:
          test: ["CMD", "pg_isready", "-U", "app", "-d", "app"]
          interval: 5s
          timeout: 3s
          retries: 10
      redis:
        image: redis:7-alpine
        healthcheck:
          test: ["CMD", "redis-cli", "ping"]
          interval: 5s
          timeout: 3s
          retries: 10
    volumes:
      pgdata:

Для этого локального примера `.env` содержит POSTGRES_DB=app, POSTGRES_USER=app, POSTGRES_PASSWORD и DB_PASSWORD; файл находится в .gitignore, пароль совпадает. API healthcheck проверяет готовность HTTP handler, а не только открытый порт.

Путь volume выбран для Docker Official Image PostgreSQL 18: его PGDATA расположен в version-specific `/var/lib/postgresql/18/docker`, поэтому volume монтируется в `/var/lib/postgresql`. Для PostgreSQL 17 и старше официальный путь — `/var/lib/postgresql/data`; их нельзя менять местами при обновлении major version. [PostgreSQL Official Image](https://github.com/docker-library/docs/blob/master/postgres/README.md).

