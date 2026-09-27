# ORM and Entity Relations

## Interview questions

### ORM advantages/trade-offs.
<!-- question-id: 32-orm-typeorm-q01 -->

#### Ответ

**Допущение:** API и примеры ориентируются на текущую официальную документацию TypeORM 1.x с DataSource/EntityManager и PostgreSQL-драйвером; поведение функций и поддержка lock/RETURNING зависят от версии и драйвера. ORM сопоставляет объектную модель с реляционной: дает metadata/decorators, repositories, relation loading, параметризацию запросов и сокращает повторяющийся mapping к строкам. Это ускоряет типовые CRUD use cases и оставляет SQL constraints/transactions как надежный слой целостности.

Цена абстракции — скрытый SQL и драйверные различия: один вызов save/find может затронуть больше таблиц или строк, чем кажется; relation loading способно породить N+1, joins и большие проекции. ORM не отменяет знания cardinality, индексов, изоляции и плана запроса. Для критичного endpoint нужно смотреть query logs/tracing и EXPLAIN; используйте QueryBuilder/raw SQL, когда он делает требуемую операцию яснее/быстрее, не обходя параметры и ограничения БД. Не подменяйте production migrations автоматическим schema sync после появления ценных данных.

### Entity lifecycle.
<!-- question-id: 32-orm-typeorm-q02 -->

#### Ответ

Entity class описывает сопоставление полей и relations с таблицей; объект, загруженный из БД, сам по себе не является автоматически tracked mutable row. Изменив его в памяти, нужно вызвать persistence API. По официальной документации TypeORM save вставляет новый объект или обновляет существующий по primary key и поддерживает partial updates: undefined-проперти пропускается, null записывает SQL NULL. Это различие критично для PATCH DTO: отсутствие поля и явная очистка — разные команды.

Listeners/subscribers могут выполнять cross-cutting поведение на lifecycle операциях, но их не следует использовать как скрытый единственный путь бизнес-инвариантов: bulk update/raw query не эквивалентен загрузке каждого entity и save. Валидация входного DTO, авторизация и транзакционные правила должны быть явными в use case; ограничения остаются в БД. Возвращаемый сохраненный entity/DTO сериализуйте по allowlist, чтобы не утекли relation, секреты или внутренние колонки.

### Relations.
<!-- question-id: 32-orm-typeorm-q03 -->

#### Ответ

TypeORM отображает one-to-one, many-to-one, one-to-many и many-to-many relations; физическая схема всё равно состоит из таблиц, foreign keys и join table. В обычном many-to-one владеющая сторона хранит FK; one-to-many является обратной коллекцией. Для owning one-to-one FK/join column также задает владелец, а many-to-many использует junction table. Уникальность, nullable и onDelete настраивают в соответствии с реальным инвариантом; ORM decorator не заменяет миграцию и фактическое ограничение PostgreSQL.

У отношения должны быть ясные lifecycle/ownership semantics. FK гарантирует ссылочную целостность при конкурентных вставках, а action RESTRICT/CASCADE/SET NULL влияет на удаления. Relation не означает, что ее нужно всегда загружать вместе с объектом; явная проекция/relations выбирается для конкретного use case. Избегайте циклических DTO и serialize целых entity graph наружу — задавайте API projections.

В multi-tenant схеме модель можно подкрепить составными ключами/FK с tenant_id, чтобы relation одной организации нельзя было случайно связать с записью другой. Проверяйте generated SQL и миграции: owning side, cascade, nullable и имя join column должны совпадать с намерением.

### Lazy/eager relations.
<!-- question-id: 32-orm-typeorm-q04 -->

#### Ответ

Eager relation автоматически загружается при соответствующем find* API, поэтому она удобна для неизменного небольшого graph, но может незаметно увеличивать SELECT и число JOIN/строк. В текущей документации TypeORM eager relations не применяются автоматически внутри QueryBuilder — там нужную relation надо явно запросить через joinAndSelect. Не рассчитывайте, что один режим загрузки ведет себя одинаково для всех APIs.

Lazy relation в TypeORM для JavaScript представлена Promise: доступ к ней делает дополнительный запрос. Документация помечает этот подход как non-standard/experimental; доступ к relation в цикле легко превращается в N+1 и асинхронные запросы трудно заметить. Явные relations/projection или batching дают более предсказуемый контракт; relationLoadStrategy join/query выбирают после измерения, потому что один огромный join тоже может раздуть результат.

Для list endpoints лучше указывать нужные relations, поля и предел пагинации на query boundary; не включать eager для крупных коллекций или чувствительных данных по умолчанию. [Eager и lazy relations в TypeORM](https://typeorm.io/docs/relations/eager-and-lazy-relations/)

### N+1.
<!-- question-id: 32-orm-typeorm-q05 -->

#### Ответ

N+1 — паттерн: один запрос загружает N родителей, затем relation каждого читается отдельным SELECT. В TypeORM частая причина — Promise-based lazy property или цикл, внутри которого вызывается repository.findOne для каждого ID. Систематическое логирование/trace query с HTTP request ID выявляет повторяющийся SQL и рост количества запросов пропорционально размеру страницы; следите за общей длительностью и connection-pool wait, а не только latency одного запроса.

Исправление — выбрать нужную форму данных заранее: joinAndSelect для контролируемой relation, batched query по списку parent IDs с группировкой в памяти/DataLoader, или отдельную агрегированную projection. Для one-to-many pagination сначала ограничьте родителей, затем грузите их связи; raw join может повторить parent в каждой строке и испортить LIMIT. Выбирайте только нужные колонки и не загружайте огромный граф ради удобства entity traversal.

Покройте ключевые list endpoints наблюдением за SQL count/shape и тестом, в котором размер страницы больше нескольких элементов. Цель — не искусственно добиться ровно одного SQL, а держать предсказуемое число bounded queries с приемлемым объемом данных.

### Transactions.
<!-- question-id: 32-orm-typeorm-q06 -->

#### Ответ

В TypeORM transaction задает единый connection/snapshot и атомарную границу для нескольких операций. Удобный API — dataSource.transaction(async manager => …). Внутри callback все Repository/EntityManager операции должны идти через переданный transactional manager; использование глобального dataSource manager/repository может выполнить запрос вне этой транзакции и нарушить atomicity. Вручную транзакцией управляет QueryRunner на одном connection.

Держите callback коротким и полностью await-ите все запросы до завершения; не делайте вызов платежного сервиса, отправку письма или ожидание клиента, удерживая БД-транзакцию. Внешний эффект невозможно откатить вместе с PostgreSQL; для надежного процесса сохраните outbox event в той же транзакции, после commit доставляйте его worker-ом и делайте consumer идемпотентным. Исключение внутри callback должно выйти наружу, чтобы TypeORM откатил транзакцию; ожидаемые DB constraint errors переводятся в контрактную ошибку только после rollback.

Уровень изоляции, locks и поддержка зависят от драйвера: TypeORM сообщает ошибку, если driver не поддерживает запрошенный уровень. При PostgreSQL Retry serialization failure/deadlock означает повтор всего transaction callback, но только если операция и внешние эффекты спроектированы безопасно. [Transactions в TypeORM](https://typeorm.io/docs/transactions/)
