# Transactions, Migrations, and Query Boundaries

## Interview questions

### QueryRunner.
<!-- question-id: 32-orm-typeorm-q07 -->

#### Ответ

QueryRunner TypeORM закрепляет один реальный connection из pool за набором операций; это низкоуровневый API для явного управления соединением, транзакцией и тем же connection-bound EntityManager. Создайте runner из DataSource, вызовите connect, затем используйте queryRunner.manager/queryRunner.query, при необходимости startTransaction/commit/rollback. Все statement одной DB-транзакции должны пройти через этот runner, а не через глобальный repository.

Connection надо вернуть в pool в finally через release, включая путь ошибки; иначе постепенно исчерпается pool и запросы начнут ждать свободного соединения. Для обычного unit of work безопаснее короткий callback DataSource.transaction, который освобождает ресурс сам; QueryRunner нужен для явного lifecycle, нескольких фаз или специфичных процедур/migrations. Не держите runner во время сетевых вызовов или пользовательского ожидания. [QueryRunner API](https://typeorm.io/docs/query-runner/)
### Migrations.
<!-- question-id: 32-orm-typeorm-q08 -->

#### Ответ

Migration — версионированный и повторяемый шаг изменения схемы/данных, который контролируемо переводит production БД из одной версии в следующую. В production отключают synchronize: true: изменение entity-класса не является планом безопасного rollout для существующих данных. Migration содержит up и, насколько это возможно и безопасно, down; она должна быть reviewable, тестироваться на копии реальных объемов и применяться управляемым deploy job, а не конкурентно каждым инстансом API.

Для zero/low-downtime breaking changes используйте expand-contract: добавить nullable колонку/совместимую таблицу, выкатить код, который читает/пишет старое и новое, backfill небольшими batch, переключить чтение, проверить метрики и только потом удалить старое поле отдельным релизом. Следите за locks, длительностью DDL, размером индекса и replication lag. PostgreSQL CREATE INDEX CONCURRENTLY нельзя выполнять в обычном transaction block; для него настройте migration transaction mode/per-migration transaction согласно версии TypeORM. Down migration не всегда может восстановить уже потерянные данные. [Как работают TypeORM migrations](https://typeorm.io/docs/migrations/why/) и [режимы transaction](https://typeorm.io/docs/migrations/faking/)
### Cascade.
<!-- question-id: 32-orm-typeorm-q09 -->

#### Ответ

Cascades существуют на двух разных слоях. DB referential action ON DELETE CASCADE задается foreign key и применяется БД к зависимым строкам независимо от ORM. TypeORM cascade на relation управляет тем, какие insert/update/remove/soft-remove/recover ORM может протранслировать при save/remove entity graph; это не одно и то же, что каскад в SQL.

Широкий cascade: true скрывает побочные записи и увеличивает риск массового изменения/удаления через вложенный объект из недоверенного DTO. Предпочитайте конкретный набор cascade operations, explicit persistence и DB FK action только для реального ownership. TypeORM cascade remove обходит relations, присутствующие/загруженные на entity object; не предполагайте, что незагруженные children автоматически пройдут тот же ORM lifecycle. Для критичного удаления проверьте фактические SQL, транзакцию и тесты миграции. [Relation cascades](https://typeorm.io/docs/relations/relations/)
### Locking.
<!-- question-id: 32-orm-typeorm-q10 -->

#### Ответ

Optimistic locking обнаруживает конфликт версии без удержания lock на протяжении бизнес-операции: прочитайте version/UpdatedDate, а при обновлении сравните ожидаемую версию и сообщите конфликт, если запись уже изменена. PostgreSQL может также выполнить compare-and-swap через UPDATE … WHERE id = … AND version = … RETURNING; количество затронутых строк — сигнал успеха. Это удобно при редких конфликтах и интерактивном редактировании.

Pessimistic locking захватывает DB lock до конца короткой транзакции. В QueryBuilder TypeORM setLock('pessimistic_write') для PostgreSQL переводится в FOR UPDATE; вызов должен выполняться через transactional manager, иначе нет корректной границы удержания. setOnLocked('nowait'/'skip_locked') доступен не на всех драйверах/режимах и меняет прикладное поведение. Блокировка не заменяет constraint и не гарантирует запрет новых строк, подходящих под predicate.

Выбирайте optimistic или pessimistic стратегию по частоте конфликтов и цене ожидания; в обоих случаях constraint/atomic update защищает инвариант лучше, чем предварительный SELECT без lock. Учитывайте возможные deadlock/serialization errors и bounded retry на уровне whole transaction. [TypeORM QueryBuilder locking](https://typeorm.io/docs/query-builder/select-query-builder/)
### Raw SQL.
<!-- question-id: 32-orm-typeorm-q11 -->

#### Ответ

Raw SQL оправдан, когда нужны PostgreSQL-специфичные возможности, массовая операция, CTE/window function или план, который ORM строит неясно/неэффективно. Это не «провал ORM»: граница должна оставаться в repository/query service, а бизнес-инварианты, transaction и миграции — согласованными с entity model. Параметризуйте все значения: PostgreSQL driver использует positional bind parameters, а QueryBuilder — именованные параметры. Нельзя вставлять user input конкатенацией строки.

Параметр обычно не может безопасно заменить идентификатор таблицы/колонки или направление ORDER BY. Такие части строятся только из серверного allowlist, а не из непроверенного запроса. Проверьте порядок параметров, типы, null/array handling и generated SQL; raw results часто не имеют формы entity и требуют явного DTO mapping. Запускайте через transaction-bound manager/queryRunner, если команда участвует в транзакции, и тестируйте на целевом PostgreSQL. TypeORM предупреждает отдельно санитизировать raw SQL expressions, переданные в QueryBuilder.
### Почему repository abstraction иногда протекает?
<!-- question-id: 32-orm-typeorm-q12 -->

#### Ответ

Repository abstraction становится «протекающей», когда обещает универсальный save/find/delete, но вызывающему коду все равно нужно знать транзакции, изоляцию, row locks, joins, пагинацию, N+1, PostgreSQL типы, индексы, unique violation и план выполнения. Реляционные свойства нельзя полностью скрыть: например, порядок statement и constraint error видны через границу репозитория, а один универсальный find(criteria) обычно не выражает бизнес-смысл и производительность.

Разделяйте write-side domain operation и read-side query/projection. Репозиторий агрегата полезен, если он сохраняет доменный инвариант и транзакционную границу; специализированный query service может отдавать оптимизированную DTO без построения entity graph. Не дублируйте сложный SQL через пять абстракций и не вводите универсальный repository интерфейс, который сужает возможности TypeORM/PostgreSQL.

Хорошая граница скрывает техническую настройку соединения и дает вызывающему коду понятную операцию/контракт, но явно сообщает ожидаемую атомарность, conflict и idempotency. Для проверки стоимости оставьте возможность смотреть SQL/EXPLAIN и тестировать repository с настоящим PostgreSQL, потому что mock не воспроизводит locks, planner и constraints.
