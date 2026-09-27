# Workers, Streams, and Memory

## Interview questions

### Worker Threads.
<!-- question-id: 24-nodejs-runtime-q16 -->

#### Ответ
Worker Threads запускают отдельные JavaScript execution threads в одном Node-процессе, обычно с отдельным V8 isolate/heap. Они подходят для CPU-heavy JS и могут разделять SharedArrayBuffer либо передавать Transferable ArrayBuffer; обычный объект передаётся через structured clone, что стоит памяти/CPU и может отвергать неподдерживаемые значения. Worker не ускорит обычный I/O автоматически, поскольку async I/O уже может использовать ОС/event loop.

В production используйте повторно используемый bounded pool: один worker на каждое ядро не всегда правильно — оставьте ресурсы event loop/GC и измерьте throughput. Нужны очередь с backpressure, max queue, timeout, отмена, обработка error/exit и замена упавшего worker. Данные с секретами не передавайте без модели доверия, а shutdown должен дождаться/отменить активные jobs. Для больших бинарных данных предпочитайте transfer, чтобы не клонировать мегабайты; shared memory требует синхронизации и может привести к race conditions.

### Cluster.
<!-- question-id: 24-nodejs-runtime-q17 -->

#### Ответ
cluster — модель нескольких Node processes, обычно создаваемых primary process и worker processes, которые могут обслуживать один серверный порт. У каждого процесса отдельные V8 heap, event loop и failure domain; это использует несколько CPU cores и изолирует падение процесса лучше, чем несколько Worker Threads в одном process. IPC и распределение соединений всё равно имеют цену, а session/in-memory cache не становятся общими.

Для stateless HTTP можно предпочесть несколько orchestrated replicas за внешним load balancer-ом: так проще rolling deploy, health checks и autoscaling, чем привязывать масштабирование к одному Node host. Если используете cluster, сделайте graceful shutdown/drain, readiness, рестарт с backoff и внешнее хранение session/job state. Не полагайтесь на гарантированно равномерную балансировку сокетов и sticky session без явной конфигурации. Cluster не является заменой очереди фоновых работ и не оптимизирует алгоритм каждого запроса.

### Child processes.
<!-- question-id: 24-nodejs-runtime-q18 -->

#### Ответ
Child process запускает отдельный executable/Node process и взаимодействует через stdin/stdout/stderr, IPC или сокеты. Основные варианты имеют разные контракты: spawn потоково подключает произвольную команду и подходит для больших output; exec запускает через shell и буферизует output; execFile запускает binary без shell; fork — Node-ориентированный запуск с IPC. Выбирайте spawn/execFile с аргументами-массивом, когда команда контролируема.

Для внешнего input shell interpolation — путь к command injection; передавайте параметры отдельно, валидируйте allowlist и запускайте с минимальными OS privileges. Ограничьте maxBuffer у буферизующих API, поставьте timeout, обработайте error, exit code, signal и abort; закройте/прочитайте stdio, иначе возможен deadlock или утечка. Child process полезен для изоляции crash/Native dependencies и отдельного сервиса, но дороже thread по памяти и старту. Нельзя создавать process на каждый запрос без bounded pool/admission control.

### Streams.
<!-- question-id: 24-nodejs-runtime-q19 -->

#### Ответ
Stream — интерфейс для последовательной обработки данных частями, не собирая всё содержимое целиком в памяти. Основные виды: Readable, Writable, Duplex и Transform; данные идут в Buffer или object mode. Это снижает пиковую память, позволяет конвейеризацию и естественно выражает backpressure, но требует обработать ошибки, завершение, отмену и закрытие всех звеньев.

В современном Node для связывания потоков обычно используйте stream/promises pipeline: он передаёт ошибки между этапами и завершает/разрушает цепочку при сбое. Не делайте вручную data → write без проверки результата write(), если не умеете ждать drain. Учитывайте encoding: строковый режим может менять семантику байтов, а объектный stream имеет другой highWaterMark. Если нужна ретрай/атомарная запись, пишите во временный ресурс и публикуйте после полного успешного pipeline; частично записанный output нельзя считать валидным.

### Backpressure.
<!-- question-id: 24-nodejs-runtime-q20 -->

#### Ответ
Backpressure — сигнал от медленного consumer к быстрому producer: Writable.write(chunk) вернёт false, когда внутренний буфер достиг порога, и producer должен дождаться drain прежде, чем производить ещё. highWaterMark — порог буферизации, а не жёсткий лимит памяти: один крупный chunk может превысить его, а несколько потоков и sockets умножают суммарный budget. В Readable pipeline backpressure передаётся через pause/resume механизмы.

Без backpressure загрузка большого файла или fan-out в много медленных клиентов приводит к росту heap/external Buffer memory и GC pressure. Предпочитайте pipeline, который связывает flow control и ошибки. Для собственного producer ограничьте количество задач/байтов in-flight, остановите upstream при перегрузе и определите политику для клиента, который долго не читает: timeout, disconnect или ограниченный disk spool. Метрики queue length и buffered bytes полезнее одного факта, что процесс пока не упал.

### Buffers.
<!-- question-id: 24-nodejs-runtime-q21 -->

#### Ответ
Buffer — байтовый view для бинарных данных, наследующий модель Uint8Array и оптимизированный Node API. Он может ссылаться на общий underlying ArrayBuffer: subarray/slice часто не копируют bytes, поэтому удержание маленького view способно удерживать большой backing memory. Если нужна независимая копия, копируйте явно; при передаче между worker-ами решите, копировать или transfer ownership.

Buffer.alloc безопасно обнуляет память; allocUnsafe быстрее, но возвращённую область необходимо полностью заполнить до чтения/отправки, иначе можно раскрыть остаточные байты процесса. Проверяйте размер перед allocation и не складывайте произвольные куски без верхней границы: Buffer относится к external memory и RSS может расти при стабильном heapUsed. Для текста указывайте encoding на границе, но не конвертируйте бинарный protocol в UTF-8. Сравнение секретов выполняйте постоянновременным API, а не обычным ===, когда timing attack входит в threat model.

### EventEmitter.
<!-- question-id: 24-nodejs-runtime-q22 -->

#### Ответ
EventEmitter синхронно вызывает listeners в порядке регистрации во время emit; это часть поведения, поэтому медленный listener блокирует отправителя и последующие listeners. Добавленный listener во время emit обычно не участвует в уже идущем dispatch, удаление listeners во время вызова не обязано отменить текущий snapshot. Событие error имеет специальную семантику: emit('error') без обработчика приводит к throw. Listener не возвращает управляемый Promise результат; rejected Promise не становится автоматически обработанным, если не включён специальный captureRejections или не обработать его самостоятельно.

Не используйте события как скрытый request-response RPC: порядок и жизненный цикл становятся трудно видимы. Отписывайтесь при dispose/close, используйте once для одноразовых подписок и следите за MaxListenersWarning как за симптомом возможной утечки, а не просто отключайте лимит. Для критических async listeners явно обрабатывайте rejection. Если нужна типобезопасность, задайте карту событий и типы tuple для payload; отдельно решите, как обрабатывается ошибочное событие.

### Memory leaks.
<!-- question-id: 24-nodejs-runtime-q23 -->

#### Ответ
Утечка памяти — это достижимые объекты, которые больше не нужны, но удерживаются сильной ссылкой; сборщик не может освободить их. Частые источники: бесконтрольные Map/cache, event listeners и closures на долгоживущем emitter, незакрытые timers/intervals, незавершённые requests/promises, глобальные registries, большой Buffer, удерживаемый маленьким subarray, и request data в singleton. Рост RSS может происходить и вне V8 heap — через Buffer, native addons и allocator fragmentation.

Диагностируйте повторяемым workload: сравните heap snapshot после GC в одинаковой точке, найдите dominator/retained path и подтвердите, что объекты накапливаются между циклами. Snapshot может остановить процесс и содержит чувствительные данные; снимайте осторожно и защищайте artifact. Используйте allocation profile и метрики heapUsed/external/arrayBuffers/RSS, а не повышайте max-old-space-size как первое исправление. Профилактика: bounded cache с eviction/TTL, явные dispose/unsubscribe, AbortSignal, лимиты входа и тесты повторного lifecycle.

### Garbage collection.
<!-- question-id: 24-nodejs-runtime-q24 -->

#### Ответ
GC освобождает память объектов JavaScript, которые стали недостижимы из корней (stack, globals, активные handles и т.д.); он не знает, что объект «логически больше не нужен», если на него всё ещё есть ссылка. V8 применяет generational collection: большинство короткоживущих объектов быстро умирает, долгоживущие проходят дальше; mark/sweep/compact и incremental/concurrent этапы уменьшают паузы. Это внутренние эвристики конкретной версии V8, а не timing contract.

Аллокации имеют цену: временные большие массивы создают GC pressure и tail-latency; retention может увеличить live set и каждую последующую сборку. Не пытайтесь вызывать GC в каждом request — expose-gc предназначен для контролируемых сценариев диагностики, не для исправления lifetime. Следите за heap, external memory и pause/time; оптимизируйте после profiling. Уменьшайте удерживаемый граф, переиспользуйте крупные структуры только если измерение показывает пользу и такая оптимизация не создаёт shared mutable state/race между запросами.

