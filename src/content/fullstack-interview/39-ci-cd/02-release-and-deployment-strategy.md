# Release and Deployment Strategy

## Interview questions

### Secrets.
<!-- question-id: 39-ci-cd-q09 -->

#### Ответ

Секреты — credentials, signing keys и другие значения, раскрытие которых даёт доступ. Храните их в secret manager или защищённом хранилище CI с минимальным repo/environment scope, коротким сроком жизни и ротацией; где возможно используйте OIDC federation вместо долгоживущего cloud token. В PR из недоверенных fork секреты не выдаются. Не выводите их в logs, artifacts, cache, Docker layers и error traces; редактирование логов — последний барьер, не способ безопасно печатать значение. Используйте отдельные права для build и deploy, аудит доступа и план немедленной ротации после подозрения на утечку. [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use) и [OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect).

### Database migrations.
<!-- question-id: 39-ci-cd-q10 -->

#### Ответ

Миграция — изменение схемы или данных, которое должно сосуществовать со старой и новой версией приложения во время rolling deploy. Предпочитаю expand–migrate–contract: сначала добавить совместимые nullable/default поля или таблицу, затем развернуть код, который читает/пишет старый и новый формат, перенести данные партиями и проверить консистентность, и только в отдельном релизе удалить старый путь. Большие backfill ограничивают по нагрузке и делают restartable. DDL может держать locks; изучаю план и блокировки на реальном масштабе. Не запускаю одну migration конкурентно на каждой реплике и не предполагаю, что rollback приложения автоматически откатит данные. [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html).

### Rollback.
<!-- question-id: 39-ci-cd-q11 -->

#### Ответ

Rollback переключает трафик на предыдущий известный исправный артефакт, если новый релиз нарушил SLO или ключевой бизнес-сигнал. Условие и процедура должны быть автоматизируемы или чётко исполнимы: зафиксированный digest, совместимость конфигурации, health checks, наблюдение, владелец решения. Код rollback не отменяет уже выполненные side effects или несовместимую миграцию; для данных часто безопаснее forward-fix, компенсирующая операция или expand/contract схема. После отката сохраните traces/logs и ограничьте повторное продвижение того же release. Проверяйте восстановление через rehearsal, а не только существование команды.

### Blue-green deployment.
<!-- question-id: 39-ci-cd-q12 -->

#### Ответ

Blue-green поддерживает две production-среды: текущую blue и подготовленную green с новым release. Сначала проверяю green без пользовательского трафика, затем атомарно переключаю routing/load balancer; старую среду сохраняю на период наблюдения для быстрого возврата. Это сокращает риск переключения, но требует двойной capacity и совместимости общей БД: обе версии могут кратко работать одновременно. Session/local state не должен быть привязан к одному пулу, а фоновые consumers не должны дважды выполнить одну работу. Нужно определить, как переключаются health, jobs, WebSockets и миграции, а также кто владеет cleanup старой среды.

### Canary.
<!-- question-id: 39-ci-cd-q13 -->

#### Ответ

Canary отправляет малую долю трафика или выбранную когорту на новый release, затем доля растёт при нормальных метриках. Сравнивайте canary с control по одинаковым окнам, сегментам и нагрузке: error rate, latency, saturation и бизнес-конверсии. Одного readiness ответа недостаточно. Доля и шаги должны учитывать статистическую мощность и редкие ошибки; при плохом сигнале rollout останавливают или автоматически откатывают. Sticky sessions, cache warming и несовместимые события могут исказить сравнение. Canary требует управляемого traffic split и измерений, а не просто запуска двух реплик.

### Zero-downtime deployments.
<!-- question-id: 39-ci-cd-q14 -->

#### Ответ

Zero downtime — целевой пользовательский эффект, а не гарантия одной настройки. Нужны несколько доступных реплик, readiness до получения трафика, graceful shutdown старых реплик, балансировщик с корректным draining и compatible schema/API во время overlap. Для stateful соединений отдельно планируются переподключение/повтор запросов; WebSocket клиенту может потребоваться reconnect. Миграции идут expand/contract, кэш и очереди выдерживают версионный overlap, startup не зависит от тяжёлой синхронной работы. Проверяю не только HTTP healthcheck, но и реальную успешность ключевых операций во время rolling restart.

### Feature flags.
<!-- question-id: 39-ci-cd-q15 -->

#### Ответ

Feature flag отделяет deploy кода от включения поведения: позволяет внутреннюю проверку, постепенный rollout и быстрое отключение проблемной возможности без нового build. Флаг должен иметь владельца, назначение, правила таргетинга, измеряемый эффект и срок удаления; иначе условные ветки и тестовая матрица навсегда растут. Сервер обязан проверять authorization независимо от клиентской видимости флага. Не храните секреты в client-visible flags. Для критичных изменений определите fail-safe значение при недоступности flag service и не допускайте, чтобы сетевой вызов флага блокировал каждый запрос бесконечно. [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments).

### Спроектировать pipeline:
<!-- question-id: 39-ci-cd-task01 -->

PR
→ lint
→ tests
→ build
→ docker
→ push
→ migration
→ deployment
→ healthcheck
→ rollback

#### Ответ

Я разделил бы pipeline на PR validation и release/deploy. На pull_request запускаются checkout по commit, lockfile install, lint/typecheck, unit/integration tests и production build; permissions минимальны, secrets отсутствуют, merge защищён обязательными статусами. На merge в main один раз собирается контейнер, тестируется, сканируется и push-ится в registry с commit-SHA tag. Tag может быть перемещён и не является immutable identity; deployment должен зафиксировать registry digest и продвигать тот же image. Миграция запускается отдельным одноразовым шагом с блокировкой/аудитом и только после проверки expand-совместимости. Затем canary/rolling deployment ждёт readiness и проверяет ошибки, latency и ключевые сценарии; превышение порогов останавливает rollout и запускает переключение на предыдущий digest, если схема совместима.

Зависимые шаги связываются через needs, а независимые проверки параллелятся. Production environment задаёт ограниченный доступ и approval, когда он нужен. Не выдаю production credentials PR job-ам; для облака предпочитаю OIDC с ограничением audience/subject вместо долгоживущего ключа. Реальный rollback-командный синтаксис зависит от платформы (Kubernetes, ECS, PaaS), поэтому его реализует и тестирует отдельный adapter, а workflow передаёт digest и ждёт её результат. Артефакты/логи сохраняют SHA, digest, migration version и health evidence. Actions закрепляются на reviewed SHA; версии runner/action следует обновлять по changelog. [GitHub Actions jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs), [security hardening](https://docs.github.com/en/actions/reference/security/secure-use), [environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments).

Ниже runnable skeleton для GitHub Actions при условии, что package scripts и три deploy scripts существуют. Реальную production-конфигурацию actions/checkout лучше pin-ить на reviewed commit SHA, а не полагаться только на tag.

    name: release
    on:
      pull_request:
      push:
        branches: [main]
    permissions:
      contents: read
    jobs:
      verify:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v6
          - run: npm ci
          - run: npm run lint
          - run: npm test
          - run: npm run build
      publish:
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        needs: verify
        runs-on: ubuntu-latest
        permissions:
          contents: read
          packages: write
        steps:
          - uses: actions/checkout@v6
          - name: Build and push commit-SHA tag
            env:
              GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            run: |
              image="ghcr.io/$(printf '%s' "$GITHUB_REPOSITORY" | tr '[:upper:]' '[:lower:]')"
              echo "$GH_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
              docker build -t "$image:$GITHUB_SHA" .
              ./scripts/scan-image.sh "$image:$GITHUB_SHA"
              docker push "$image:$GITHUB_SHA"
      deploy:
        needs: publish
        runs-on: ubuntu-latest
        environment: production
        steps:
          - uses: actions/checkout@v6
          - name: Run compatible expand migration
            run: |
              image="ghcr.io/$(printf '%s' "$GITHUB_REPOSITORY" | tr '[:upper:]' '[:lower:]')"
              ./scripts/migrate-expand.sh "$image:$GITHUB_SHA"
          - name: Deploy canary, check health, and roll back on failure
            run: |
              image="ghcr.io/$(printf '%s' "$GITHUB_REPOSITORY" | tr '[:upper:]' '[:lower:]')"
              if ! ./scripts/deploy-canary-and-check.sh "$image:$GITHUB_SHA"; then
                ./scripts/rollback.sh
                exit 1
              fi

В примере SHA tag нужен для трассировки, но не является immutable reference. Publish job должен сохранить digest, например из Buildx metadata или ответа registry; deploy script принимает этот digest и разворачивает именно его. Сканер/миграция/deploy scripts платформенно-специфичны и должны завершаться ненулевым кодом при отказе; rollback должен быть повторяемым и возвращать предыдущий проверенный digest.
