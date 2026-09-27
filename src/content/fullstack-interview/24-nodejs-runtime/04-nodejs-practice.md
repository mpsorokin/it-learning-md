# Node.js Practice

## Interview questions

### реализовать EventEmitter
<!-- question-id: 24-nodejs-runtime-task01 -->

#### Ответ
Ниже — минимальная типизированная реализация синхронного emitter с snapshot listeners, удалением по исходной функции, one-shot listener и special error event. Исключение listener не перехватывается: оно синхронно прерывает emit. Для once мы сохраняем ссылку на конкретную запись и удаляем её до вызова, поэтому reentrant emit не вызовет listener повторно. Перед заменой node:events проверьте требуемую совместимость: prepend, listenerCount, captureRejections и MaxListenersWarning.

    type EventKey = string | symbol;
    type Listener = (this: TinyEmitter, ...args: unknown[]) => void;
    type Entry = { original: Listener; once: boolean; wrapper: Listener };

    class TinyEmitter {
      private readonly events = new Map<EventKey, Entry[]>();

      on(event: EventKey, listener: Listener): this {
        const entries = this.events.get(event) ?? [];
        entries.push({ original: listener, once: false, wrapper: listener });
        this.events.set(event, entries);
        return this;
      }

      once(event: EventKey, listener: Listener): this {
        const entries = this.events.get(event) ?? [];
        const entry = {} as Entry;
        entry.original = listener;
        entry.once = true;
        entry.wrapper = (...args) => {
          this.removeEntry(event, entry);
          listener.apply(this, args);
        };
        entries.push(entry);
        this.events.set(event, entries);
        return this;
      }

      off(event: EventKey, listener: Listener): this {
        const entries = this.events.get(event);
        const index = entries?.map((entry) => entry.original).lastIndexOf(listener) ?? -1;
        if (entries && index >= 0) entries.splice(index, 1);
        if (entries?.length === 0) this.events.delete(event);
        return this;
      }

      private removeEntry(event: EventKey, target: Entry): void {
        const entries = this.events.get(event);
        const index = entries?.indexOf(target) ?? -1;
        if (entries && index >= 0) entries.splice(index, 1);
        if (entries?.length === 0) this.events.delete(event);
      }

      emit(event: EventKey, ...args: unknown[]): boolean {
        const entries = this.events.get(event);
        if (!entries?.length) {
          if (event === "error") {
            const error = args[0];
            throw error instanceof Error ? error : new Error("Unhandled error event");
          }
          return false;
        }
        for (const entry of [...entries]) entry.wrapper.apply(this, args);
        return true;
      }
    }

Повторная регистрация одной функции допустима; off удаляет последнюю регистрацию, emit использует snapshot, чтобы изменение списка во время dispatch не меняло текущий проход. Эта реализация синхронная: она не ждёт Promise и не обрабатывает rejection async listeners. Не скрывайте такую семантику — при необходимости задайте отдельный emitAsync. Проверьте порядок, duplicate registration, удаление, once + reentrant emit, отсутствие события и необработанный error.

### stream большого файла
<!-- question-id: 24-nodejs-runtime-task02 -->

#### Ответ
Для файла больше RAM стройте потоковый pipeline: данные проходят через Readable → Transform → Writable, а backpressure останавливает fast producer, если destination медленный. Не читайте файл целиком и не накапливайте все chunks. Пример потокового gzip во временный файл с атомарной публикацией; input/output предполагаются локальными путями под контролем приложения.

    import { createReadStream, createWriteStream } from "node:fs";
    import { rename, rm } from "node:fs/promises";
    import { randomUUID } from "node:crypto";
    import { pipeline } from "node:stream/promises";
    import { createGzip } from "node:zlib";

    export async function gzipFile(input: string, output: string, signal?: AbortSignal) {
      const temp = output + "." + randomUUID() + ".tmp";
      try {
        await pipeline(
          createReadStream(input),
          createGzip(),
          createWriteStream(temp, { flags: "wx" }),
          { signal },
        );
        await rename(temp, output);
      } catch (error) {
        await rm(temp, { force: true }).catch(() => undefined);
        throw error;
      }
    }

pipeline передаёт ошибки и signal, а уникальный temp предотвращает коллизию параллельных jobs. Rename атомарен только в пределах совместимой файловой системы; обработайте права, дисковое заполнение и политику перезаписи destination. В HTTP upload дополнительно ограничьте размер, проверяйте тип содержимого, задайте timeout и удаляйте временный файл при отмене клиента. Backpressure ограничивает буферы потока, но не заменяет общий лимит конкурентных pipeline.

### исправить blocking endpoint
<!-- question-id: 24-nodejs-runtime-task03 -->

#### Ответ
Сначала профилируйте маршрут и найдите синхронный участок: типичный пример — readFileSync, синхронный hash, компрессия, большой JSON parse или CPU цикл. Простая async-обёртка вокруг CPU кода не поможет. Для password derivation используйте асинхронный crypto API, который отдаёт работу libuv pool; ограничьте стоимость параметров и in-flight jobs, иначе дорогие запросы насытят общий pool. Для общего CPU transform нужен bounded Worker Thread pool.

    import { pbkdf2, randomBytes } from "node:crypto";
    import { promisify } from "node:util";
    import type { Request, Response } from "express";

    const derivePassword = promisify(pbkdf2);

    export async function register(req: Request, res: Response) {
      const { password } = req.body;
      if (typeof password !== "string" || password.length > 1024) {
        return res.status(400).json({ error: "invalid input" });
      }

      const salt = randomBytes(16);
      const iterations = passwordHashPolicy.iterations;
      const hash = await derivePassword(password, salt, iterations, 32, "sha256");
      await credentialsRepository.insert({
        salt: salt.toString("hex"),
        hash: hash.toString("hex"),
        iterations,
      });
      return res.status(201).end();
    }

Здесь соль случайна и параметры сохраняются вместе с credential record; handler не возвращает клиенту хэш. iterations читается из проверенной конфигурации, выбранной по актуальной политике password hashing и измеренной на целевом железе; самовольная константа быстро устаревает. Repository и policy внедряются через зависимости сервиса. Добавьте rate limit, timeout, bounded concurrency, event-loop delay/pool saturation метрики и нагрузочный тест p95/p99. Если операция дольше HTTP budget, используйте job + status endpoint. Не заменяйте блокировку бесконечной очередью фоновых задач.

### worker thread для CPU-heavy operation
<!-- question-id: 24-nodejs-runtime-task04 -->

#### Ответ
Worker Thread нужен, когда CPU-bound JS задерживает event loop; сам await вычисление не переносит. Минимальный пример ниже передаёт ограниченный input через structured clone и возвращает результат. Для демонстрации worker запускается на одну задачу; серверный вариант должен брать worker из bounded reusable pool, а не создавать поток на каждый HTTP request.

Файл cpu-worker.ts:

    import { parentPort, workerData } from "node:worker_threads";

    if (!parentPort) throw new Error("Worker must be started by a parent");
    const { values } = workerData as { values: number[] };
    const result = values.reduce((sum, value) => sum + value * value, 0);
    parentPort.postMessage(result);
    parentPort.close();

Родительский модуль:

    import { Worker } from "node:worker_threads";

    export function compute(values: number[]): Promise<number> {
      return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("./cpu-worker.js", import.meta.url), {
          workerData: { values },
        });
        let received = false;
        worker.once("message", (value: number) => {
          received = true;
          resolve(value);
        });
        worker.once("error", reject);
        worker.once("exit", (code) => {
          if (!received) reject(new Error("Worker exited without a result; code=" + code));
        });
      });
    }

Передавайте только валидированный input с лимитом размера; для больших typed arrays изучите transferList, чтобы избежать копирования. В reusable pool каждому job нужны ID, timeout/cancel, обработка crash/exit, ограниченная очередь и drain при shutdown. Учитывайте, что путь import.meta.url должен указывать на скомпилированный worker artifact в production build.

