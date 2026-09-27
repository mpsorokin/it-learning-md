# Event Loop and Scheduling

## Interview questions

### setImmediate.
<!-- question-id: 24-nodejs-runtime-q09 -->

#### Ответ
setImmediate регистрирует callback в check phase — обычно после завершения текущей poll-обработки I/O. Изнутри I/O callback это даёт понятную точку уступить управление до следующего immediate callback. setTimeout(fn, 0) регистрируется в timers и имеет минимальный порог, а не «немедленное выполнение», поэтому в top-level конкуренции порядок не контрактный. Несколько immediate исполняются по порядку постановки; immediate, поставленный во время выполнения immediate callback, будет отложен до следующего цикла.

API удобно для cooperative yielding: обработать, например, ограниченный chunk, поставить следующую порцию и дать loop обслужить сокеты. Но yield должен быть осознанным: крупный chunk всё равно блокирует, слишком частое дробление добавляет overhead, а накопленная очередь отстаёт. Для долгой работы измеряйте event-loop delay и применяйте backpressure, а не рассчитывайте на один setImmediate как на решение CPU saturation. [Документация timers](https://nodejs.org/api/timers.html).

### process.nextTick.
<!-- question-id: 24-nodejs-runtime-q10 -->

#### Ответ
process.nextTick помещает callback в специальную Node queue, которую runtime опустошает до продолжения event loop после текущего стека. Это быстрее/раньше следующей фазы, чем setImmediate, но очередь может бесконечно пополняться: рекурсивный nextTick-starvation не даст event loop обработать I/O и timers. Поэтому nextTick используют для совместимости API и короткой синхронной нормализации, а не как универсальный scheduler или способ «дать event loop поработать».

Для передачи управления следующему event-loop turn обычно лучше setImmediate. Для стандартной очереди microtasks используйте queueMicrotask/Promise, помня, что они тоже могут starvation-ить loop при бесконечной цепочке. При публикации библиотечного API не меняйте sync/async поведение скрытно: consumer может зависеть от порядка вызовов. Контролируйте размер выполняемой работы и делайте массовые операции порционно.

### Promise microtasks vs nextTick.
<!-- question-id: 24-nodejs-runtime-q11 -->

#### Ответ
Promise reactions и queueMicrotask выполняются как microtasks после текущего JavaScript callback; async/await продолжает функцию через Promise-механизм. process.nextTick — отдельная Node очередь с более высоким приоритетом относительно обычного перехода к следующей фазе. На границе callback Node обрабатывает nextTick и microtasks по правилам runtime; детали вложенного планирования версионируются, поэтому избегайте вывода порядка из одной цепочки console.log.

Обе очереди могут задерживать timers/I/O: microtask, который бесконечно планирует следующую microtask, не уступает poll; то же относится к рекурсивному nextTick. Используйте их для коротких continuations, а не для обхода ограничения event loop. Когда нужно отдать управление I/O, запланируйте следующий chunk через setImmediate или вынесите вычисления в Worker. В тестах лучше проверять observable contract, а не случайный полный порядок между разными типами очередей.

### Worker Pool.
<!-- question-id: 24-nodejs-runtime-q12 -->

#### Ответ
libuv Worker Pool — общий конечный пул нативных worker threads для определённых операций Node/native addons; его не следует путать с JavaScript Worker Threads. Main event loop инициирует задачу, pool выполняет нативную работу, а завершение возвращает callback в event loop. Параметр UV_THREADPOOL_SIZE задают до инициализации pool; увеличение может повысить параллельность подходящей нагрузки, но расходует память/CPU и не лечит насыщение диска, внешнего API или main thread.

Длинные задачи занимают worker и создают очередь для коротких; опасны криптографические операции с неограниченными параметрами от пользователя. Нужны верхние границы input/стоимости, rate limit и измерение задержки именно pool-bound API. Для собственного CPU workload используйте собственный bounded Worker Thread pool или внешнюю очередь/сервис, чтобы изолировать конкуренцию от системного pool. Не запускайте новый worker thread на каждый запрос без лимита и управления жизненным циклом.

### Какие операции идут в libuv thread pool?
<!-- question-id: 24-nodejs-runtime-q13 -->

#### Ответ
К официально документированным типичным потребителям libuv pool относятся файловые операции fs (кроме watcher и синхронных API), dns.lookup/dns.lookupService, асинхронные crypto операции вроде pbkdf2/scrypt/randomBytes и асинхронный zlib. Некоторые операции могут выполнять работу через собственные внутренние механизмы/ОС; не переносите список одного Node release на все версии и API. Сетевой TCP I/O обычно использует системный неблокирующий механизм и не занимает pool thread на ожидание сокета.

Практическое следствие — несколько параллельных pbkdf2 могут влиять на latency файловых/DNS операций при маленьком default pool; конкретная конкуренция зависит от версии и конфигурации. При расследовании смотрите на тип API, длительность и concurrency, а не на общий ярлык «async». Для случайных bytes или password hashing нужны лимиты и осознанный budget, потому что дорогая операция может стать способом истощить ресурсы сервера. [Список и пояснение Node.js](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop).

### Что блокирует Node event loop?
<!-- question-id: 24-nodejs-runtime-q14 -->

#### Ответ
Event loop блокируют синхронный I/O (readFileSync на серверном hot path), длинные циклы и сортировки, большие JSON.parse/stringify, синхронный crypto/zlib, компрессия/парсинг больших payload, неудачный RegExp с catastrophic backtracking, тяжёлый сериализатор и слишком дорогой логгер. Async функция тоже блокирует до первого await и после каждого возобновления выполняет код синхронно. Promise.resolve не переносит CPU в другой поток.

Защита начинается с ограничения работы на входе: лимит размера body, длины строк/regex input, глубины/количества элементов; pagination и bounded concurrency. Для CPU этапа — chunking либо worker pool. Измеряйте event-loop delay/utilization, CPU profile, heap/RSS, а latency — по percentiles; один средний RPS не показывает starvation. REDOS особенно опасен, когда pattern/pathological input контролируется клиентом. Не лечите CPU saturation добавлением асинхронной обёртки вокруг той же синхронной функции.

### CPU-bound work.
<!-- question-id: 24-nodejs-runtime-q15 -->

#### Ответ
CPU-bound работа не становится параллельной от async/await: JavaScript выполняет вычисление на том же thread, пока оно не завершится. Если задача небольшая и ограничена, разбейте её на порции с fair yielding через setImmediate, чтобы сократить максимальную паузу; общий объём CPU при этом не уменьшается. Если нужна вычислительная параллельность — отправляйте чистую функцию в bounded Worker Thread pool, native addon или отдельный compute service.

Решение зависит от размера задачи и latency target: worker имеет startup/message-copy стоимость; worker pool нужен для повторяющихся задач; слишком большой pool вызывает contention и лишний memory footprint. Передавайте минимальный payload или Transferable ArrayBuffer, проверяйте лимиты размера и корректно обрабатывайте timeout/cancel/worker crash. Для очереди задач задайте максимальный backlog, admission control и приоритеты, иначе система лишь перенесёт event-loop starvation в неограниченную очередь worker-ов.

