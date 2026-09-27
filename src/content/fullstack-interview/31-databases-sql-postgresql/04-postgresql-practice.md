# PostgreSQL Practice

## Interview questions

### подобрать indexes под queries
<!-- question-id: 31-databases-sql-postgresql-task01 -->

#### Ответ

Без конкретных запросов и распределения данных нельзя честно назвать «правильный» индекс. Сначала соберите топ запросов по общей/средней latency и calls (например, из pg_stat_statements), возьмите реальные predicates, joins, ORDER BY, LIMIT и выбранные столбцы, затем посмотрите EXPLAIN (ANALYZE, BUFFERS) на representative dataset. Индекс выбирают под запрос и его селективность; отдельно учитывают стоимость записи и конкурирующие workload patterns.

**Допущение для примера:** API часто показывает последние открытые заказы одного tenant с ограниченной страницей. Возможный индекс:

    CREATE INDEX CONCURRENTLY orders_tenant_created_open_idx
      ON orders (tenant_id, created_at DESC, id DESC)
      INCLUDE (customer_id, total)
      WHERE status = 'open';

Здесь ведущий tenant_id — equality filter, далее стабильная сортировка/пагинация; partial predicate экономит место, если запрос всегда содержит status = open; INCLUDE помогает только если EXPLAIN покажет пользу index-only scan. Для точечного поиска заказа можно дополнительно нужен unique/primary key, а для foreign-key lookup — индекс по referencing columns. Не создавайте похожие и перекрывающиеся индексы без сравнения планов, размера, INSERT/UPDATE нагрузки и фактического hit rate. Большие индексы в production вводите с планом отката и контролем блокировок/репликации.

### найти N+1
<!-- question-id: 31-databases-sql-postgresql-task02 -->

#### Ответ

N+1 — приложение делает один запрос за списком N сущностей и затем отдельный SELECT на каждую сущность, часто при lazy loading relation в цикле. В PostgreSQL это видно по трассировке запроса: один и тот же normalized SQL повторяется сотни раз с разными bind values в пределах одного HTTP request. Средняя latency одного SELECT может казаться приемлемой, но суммарны round trips, pool occupancy, parse/plan и передаваемые строки.

Диагностика: включить безопасное query tracing с request/correlation ID и длительностью, агрегировать calls/total time через pg_stat_statements, проверить число SQL на endpoint и планы наиболее дорогих statement. Не логировать секреты/PII. Воспроизвести на realistic page size, потому что N=3 может маскировать проблему, которая при 100 элементах насыщает pool.

Исправления зависят от кардинальности: получить relation JOIN-ом или projection query; загрузить связанные ID одним запросом через ANY($1) и собрать mapping в приложении; применять DataLoader/batching в пределах запроса. JOIN может размножить строки и сломать pagination по родителю, поэтому сначала ограничить IDs/страницу родителей и не загружать без нужды широкие коллекции. Добавить регрессионную проверку числа запросов на endpoint, но не фиксировать хрупкое точное число, если допустимы альтернативные планы.

### оптимизировать медленный SQL
<!-- question-id: 31-databases-sql-postgresql-task03 -->

#### Ответ

Начните с определения, где находится latency: ожидание lock/connection pool, CPU, storage I/O, сеть или сериализация ответа. Для выбранного запроса проверьте длительность и частоту, blocking sessions, размер результата и application trace. Затем на staging/безопасной выборке используйте EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS) по возможностям версии: команда исполняет запрос, поэтому DML запускайте в контролируемой транзакции и учитывайте неоткатываемые внешние side effects. Сравнивайте estimated/actual rows, loops, buffers, temp I/O, сортировки и hash batches.

Исправляйте причину по evidence: актуализировать ANALYZE/extended statistics при ошибочных оценках; убрать N+1 и лишние колонки/строки; сделать predicate sargable; подобрать composite/partial/covering index под фильтр, join и порядок; переписать коррелированный подзапрос только если фактический план доказывает лишнюю работу; разбить неограниченную выдачу на страницы. Проверьте parameterized queries с разными частотными значениями и конкуренцию: один literal может планироваться быстрее другого.

Изменение проверяйте end-to-end на representative данных и конкурирующей нагрузке: latency p50/p95/p99, throughput, CPU/I/O, buffers/cache hit, pool wait, lock time, replication lag и стоимость новых индексов на write path. Сохраните исходный план и критерий успеха; внесите индекс/миграцию с rollout и rollback планом. Увеличение work_mem или принудительное отключение node — только после обоснования и расчета памяти/параллельности.

### race condition при покупке последнего товара
<!-- question-id: 31-databases-sql-postgresql-task04 -->

#### Ответ

Нельзя делать отдельные SELECT quantity, затем в приложении сравнить с нулем и UPDATE: две транзакции могут одновременно прочитать quantity=1 и обе продать последний экземпляр. Перенесите проверку и декремент в один atomic statement. Минимальный паттерн для одной единицы:

    BEGIN;
    UPDATE inventory
       SET available = available - 1
     WHERE product_id = $1
       AND available > 0
    RETURNING product_id, available;
    -- Если обновлена одна строка: создать pending order/reservation в этой же транзакции.
    -- Если строк нет: rollback/ответить out of stock.
    COMMIT;

Добавьте CHECK (available >= 0) как defense in depth. В реальном заказе сначала резервируйте все позиции одним согласованным процессом, проверяйте, что изменено нужное количество строк, и при нехватке любой позиции откатывайте всю транзакцию. Сортируйте product_id перед несколькими обновлениями, чтобы снизить вероятность deadlock.

Уникальный Idempotency-Key, scoped к покупателю/операции, предотвращает двойное создание заказа при повторе после сетевого timeout; его запись и order сохраняются атомарно. Не вызывайте платежную систему внутри открытой DB-транзакции. Создайте pending order/reservation и transactional outbox, после commit worker инициирует оплату; webhook/результат идемпотентно фиксирует paid или освобождает/истекает reservation. Для длительного checkout нужен срок резерва и компенсирующий сценарий, а не долгий row lock.

### deadlock scenario
<!-- question-id: 31-databases-sql-postgresql-task05 -->

#### Ответ

**Сценарий.** Таблица inventory содержит строки A и B. Транзакция T1 начинает обработку заказа и обновляет A, получая row lock на A. Параллельная T2 обновляет B и удерживает lock на B. Затем T1 хочет B и ждет T2; T2 хочет A и ждет T1. Получился цикл, и PostgreSQL после обнаружения deadlock abort-ит одну транзакцию.

Устраните первопричину единым порядком захвата: обе транзакции сначала обновляют меньший product_id, затем больший; для наборов это надо применять во всех code paths и в стабильном порядке. Также сократите транзакцию, избегайте сети/пользовательского ожидания при удержании locks, проверяйте SQL/индексы и логируйте deadlock details вместе с transaction/request ID. Не пытайтесь «лечить» только увеличением deadlock_timeout.

Система все равно должна безопасно повторять прерванную операцию: поймать SQLSTATE 40P01, откатить весь unit of work и повторить его ограниченное число раз с небольшим jittered backoff. Повтор должен быть идемпотентным и не запускать внешнее списание дважды; outbox и уникальный ключ помогают отделить DB commit от внешнего эффекта. [Explicit locks и рекомендации против deadlock](https://www.postgresql.org/docs/18/explicit-locking.html)
